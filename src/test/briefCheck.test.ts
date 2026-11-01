import { describe, expect, it } from 'vitest';
import {
  checkBrief,
  decideStatus,
  failureScore,
  parseVerdict,
  type BriefCheck,
} from '../../supabase/functions/run-task/index.ts';
import { readVerification } from '@/lib/verification';

const brief = (detail: string, title = 'Q4 launch email') => ({ title, detail });

const failing = (checks: BriefCheck[]) => checks.filter((check) => !check.pass).map((check) => check.id);

const FULL_BRIEF =
  'Announce the launch. Mention “the 1.2M pipeline” and keep it under 120 words. List the next steps.';

const GOOD_DRAFT = [
  'Draft: launch announcement for Apex.',
  '',
  'Subject: Your pipeline review is booked',
  '',
  '1. We looked at the 1.2M pipeline you flagged and pulled the two stalled deals.',
  '2. The proposal goes out on the date you named.',
  '',
  'Open question: which of the two should I chase first?',
].join('\n');

describe('checkBrief', () => {
  it('passes a draft that uses the brief’s figures, wording and shape', () => {
    const checks = checkBrief(brief(FULL_BRIEF), GOOD_DRAFT);

    expect(failing(checks)).toEqual([]);
    expect(checks.map((check) => check.id)).toContain('quoted_wording');
    expect(checks.map((check) => check.id)).toContain('format');
    expect(checks.map((check) => check.id)).toContain('word_limit');
  });

  it('catches a figure the brief never supplied', () => {
    const checks = checkBrief(
      brief('Write a short note about the launch.'),
      'Draft: launch note.\n\nWe closed 47 deals last month, worth ₦8.4M, and the team is now ahead of plan.\n\nOpen question: none?',
    );

    expect(failing(checks)).toContain('figures_from_brief');
    const check = checks.find((entry) => entry.id === 'figures_from_brief');
    expect(check?.note).toContain('8.4m');
    expect(check?.note).toContain('47');
  });

  it('accepts the same figure written with different spacing', () => {
    const checks = checkBrief(
      brief('Reference the ₦1.2M pipeline figure.'),
      'Draft: brief.\n\nThe ₦1.2 M pipeline is the number that matters here, and nothing else does.',
    );

    expect(failing(checks)).not.toContain('figures_from_brief');
  });

  it('catches wording the brief quoted and the draft dropped', () => {
    const checks = checkBrief(
      brief('Open with “a calmer way to run payroll” and keep it factual.'),
      'Draft: payroll note.\n\nHere is a faster way to run payroll that the team can adopt this quarter.',
    );

    expect(failing(checks)).toContain('quoted_wording');
  });

  it('catches a list that was asked for and not written', () => {
    const checks = checkBrief(
      brief('Give me a checklist of the five things to do before launch.'),
      'Draft: pre-launch.\n\nEverything hinges on the payment flow, the copy review and a final pass on pricing, in that order.',
    );

    expect(failing(checks)).toContain('format');
  });

  it('honours a word ceiling the brief set', () => {
    const long = `Draft: note.\n\n${'word '.repeat(140)}`;
    const checks = checkBrief(brief('Summarise in under 60 words.'), long);

    expect(failing(checks)).toContain('word_limit');
    expect(checks.find((entry) => entry.id === 'word_limit')?.label).toContain('60');
  });

  it('rejects an empty draft and assistant boilerplate', () => {
    expect(failing(checkBrief(brief('Do the thing.'), ''))).toContain('produced');
    expect(
      failing(checkBrief(brief('Do the thing.'), 'Sure! As an AI, I cannot access your calendar, but here is a plan.')),
    ).toEqual(expect.arrayContaining(['no_placeholder', 'not_a_meta_reply']));
  });

  it('does not invent checks the brief never asked for', () => {
    const ids = checkBrief(brief('Write a short internal note.'), GOOD_DRAFT).map((check) => check.id);

    expect(ids).not.toContain('quoted_wording');
    expect(ids).not.toContain('format');
    expect(ids).not.toContain('word_limit');
    expect(ids).toContain('length');
  });
});

describe('decideStatus', () => {
  const passing = checkBrief(brief(FULL_BRIEF), GOOD_DRAFT);

  it('passes only when the rules pass and a reader agreed', () => {
    expect(decideStatus(passing, { addressesTask: true, missing: [], reason: 'Fits.' })).toBe('passes');
  });

  it('never claims a pass without the independent reader', () => {
    expect(decideStatus(passing, null)).toBe('unverified');
  });

  it('sends a draft back when the reader says it does not answer the task', () => {
    expect(decideStatus(passing, { addressesTask: false, missing: ['No draft attached.'], reason: 'Wrong task.' })).toBe(
      'needs_review',
    );
  });

  it('sends a draft back on a rule failure even if the reader liked it', () => {
    const checks = checkBrief(brief('Write a note about 47 deals.'), GOOD_DRAFT.replace('1.2M', '99M'));
    expect(decideStatus(checks, { addressesTask: true, missing: [], reason: 'Fine.' })).toBe('needs_review');
  });
});

describe('parseVerdict', () => {
  it('reads JSON out of a fenced block with prose around it', () => {
    const verdict = parseVerdict(
      'Here is my review:\n```json\n{"addresses_task": false, "missing": ["No subject line"], "reason": "Half done"}\n```\n',
    );

    expect(verdict).toEqual({ addressesTask: false, missing: ['No subject line'], reason: 'Half done' });
  });

  it('returns null rather than guessing when the reply is not a verdict', () => {
    expect(parseVerdict('Looks good to me!')).toBeNull();
    expect(parseVerdict('{"missing": ["x"]}')).toBeNull();
    expect(parseVerdict('')).toBeNull();
  });

  it('caps the gap list so a chatty reviewer cannot bloat the repair prompt', () => {
    const verdict = parseVerdict('{"addresses_task": true, "missing": ["a","b","c","d","e"], "reason": "ok"}');
    expect(verdict?.missing).toHaveLength(3);
  });
});

describe('failureScore', () => {
  it('ranks two drafts by how much is wrong with them', () => {
    const clean = { checks: checkBrief(brief(FULL_BRIEF), GOOD_DRAFT), model: null };
    const broken = { checks: checkBrief(brief('Write a note about 47 deals.'), 'Draft: note.\n\nShort.'), model: null };

    expect(failureScore(clean)).toBeLessThan(failureScore(broken));
  });

  it('counts the reviewer’s gaps, so a repair can change the winner', () => {
    const checks = checkBrief(brief(FULL_BRIEF), GOOD_DRAFT);
    const agreed = failureScore({ checks, model: { addressesTask: true, missing: [], reason: '' } });
    const disputed = failureScore({ checks, model: { addressesTask: false, missing: ['a', 'b'], reason: '' } });

    expect(agreed).toBe(0);
    expect(disputed).toBe(3);
  });
});

describe('readVerification', () => {
  const shape = {
    status: 'needs_review',
    checks: [
      { id: 'figures_from_brief', label: 'Every figure comes from the brief', pass: false, note: 'Not in the brief: “8.4m”.' },
      { id: 'produced', label: 'Something was actually produced', pass: true },
    ],
    model: { addressesTask: false, missing: ['No subject line'], reason: 'Half done' },
    attempts: 2,
    repaired: true,
    checkedAt: '2026-11-01T12:00:00.000Z',
  };

  it('reads a verdict the function wrote', () => {
    const verdict = readVerification(shape);

    expect(verdict?.status).toBe('needs_review');
    expect(verdict?.checks).toHaveLength(2);
    expect(verdict?.model?.missing).toEqual(['No subject line']);
    expect(verdict?.repaired).toBe(true);
  });

  it('drops anything that is not a verdict rather than inventing one', () => {
    expect(readVerification(null)).toBeNull();
    expect(readVerification({})).toBeNull();
    expect(readVerification({ ...shape, status: 'pretty good' })).toBeNull();
    expect(readVerification({ ...shape, checks: [] })).toBeNull();
    expect(readVerification({ ...shape, checks: 'nope' })).toBeNull();
  });

  it('survives a jsonb column that lost its shape', () => {
    const verdict = readVerification({ status: 'passes', checks: [{ id: 'produced', label: 'Ok', pass: 'yes' }] });

    expect(verdict?.status).toBe('passes');
    expect(verdict?.checks[0].pass).toBe(true);
    expect(verdict?.model).toBeNull();
    expect(verdict?.attempts).toBe(1);
  });

  it('trusts the status column only when the payload has none', () => {
    const withoutStatus = { ...shape, status: undefined };
    expect(readVerification(withoutStatus, 'passes')?.status).toBe('passes');
    expect(readVerification(withoutStatus, 'nonsense')).toBeNull();
  });
});
