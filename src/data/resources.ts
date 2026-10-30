export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  quote?: string;
  example?: { title: string; lines: string[] };
}

export interface Guide {
  slug: string;
  category: string;
  title: string;
  summary: string;
  readTime: string;
  intro: string;
  sections: GuideSection[];
  takeaways: string[];
}

export const guides: Guide[] = [
  {
    slug: 'first-week-checklist',
    category: 'Playbook',
    title: 'The first-week onboarding checklist for an AI employee',
    summary:
      'What to connect, what to calibrate, and the three tasks to hand over first so your employee is productive on day one.',
    readTime: '6 min read',
    intro:
      'Most AI employees underperform in their first week for one boring reason: they are hired into an empty room. No context, no examples, no definition of done, and a queue of ambiguous work. This checklist is the order of operations we see work across support, sales, and operations teams.',
    sections: [
      {
        heading: 'Day one: give it a real desk',
        paragraphs: [
          'Before your employee touches a task, it needs the same three things a new hire gets: a place to work, the tools the job requires, and a person who can answer questions. Skipping this step is what makes people conclude that AI employees are not ready — when the truth is that the employee was never set up.',
          'Connect only what the first task needs. A support employee needs the helpdesk and the knowledge base; it does not need your billing console. Scoped access is not just a security posture, it is a quality posture: every extra system is another place the employee can produce a plausible but wrong answer.',
        ],
        bullets: [
          'One owner. A named human who answers calibration questions for the first fortnight.',
          'Two sources of truth. Where answers live, and what counts as current.',
          'Zero write access on day one. Reads first, writes after the first review.',
        ],
      },
      {
        heading: 'Days two to three: calibrate, do not configure',
        paragraphs: [
          'Calibration is five questions, not a settings screen. What does good output look like here? Who is the audience? What tone? What is off-limits? What should it escalate instead of attempting? Answer those in your own words, with one real example each, and the employee will match a good operator rather than a generic one.',
          'The failure mode at this stage is over-specifying. A ninety-line instruction document produces a rigid employee that cannot handle the case it was not told about. A five-answer calibration plus three examples of your best previous work produces judgment.',
        ],
        quote:
          'Show it three things you have already shipped. Examples calibrate faster than any instruction you can write.',
      },
      {
        heading: 'Days four to five: hand over three tasks',
        paragraphs: [
          'Give the employee three tasks of increasing ambiguity, and review each one before it ships. The first should be nearly mechanical: summarise this thread, draft this reply, clean this list. The second should require a judgement call. The third should require it to go and find something you did not provide.',
          'Reviewing all three takes about twenty minutes total. What you are looking for is not perfection, it is whether the misses are the kind you can correct with a sentence. If every miss needs a paragraph, the brief is wrong, not the employee.',
        ],
        bullets: [
          'Task one — mechanical, single source, obvious done state.',
          'Task two — requires prioritisation or tone judgement.',
          'Task three — requires retrieval from your connected tools.',
        ],
      },
      {
        heading: 'What good looks like by Friday',
        paragraphs: [
          'By the end of week one you should be able to point at one piece of work the employee produced that you would have signed off on without edits, and one correction you gave that stuck — meaning it did not repeat the mistake the next day.',
          'If you have the first but not the second, you are reviewing instead of teaching. If you have neither, go back to calibration: the employee does not yet know what good means, and no amount of extra tasks will fix that.',
        ],
      },
    ],
    takeaways: [
      'Connect the minimum, not the maximum — every extra system is another failure surface.',
      'Five calibration answers with real examples beat a long instruction document.',
      'Review the first three tasks personally; that is where the compounding starts.',
    ],
  },
  {
    slug: 'writing-a-brief',
    category: 'Guide',
    title: 'How to write a brief an AI can actually execute',
    summary:
      'The difference between “clean up our pipeline” and a brief that ships. Templates for briefs, reviews, and handoffs.',
    readTime: '8 min read',
    intro:
      'An AI employee is only as good as the brief it receives. Not because it needs to be told everything, but because a vague brief hides the one decision that matters: what does finished look like? Here is the structure we use, and the failure modes it removes.',
    sections: [
      {
        heading: 'The brief is the job description',
        paragraphs: [
          'A brief is not a chat message. It is a small contract: this is the work, this is the standard, this is the deadline, this is what to do when you get stuck. Written well, it survives you being asleep, which is the entire point of delegating.',
          'The test is simple. Hand the brief to a competent freelancer who has never met you. If they would have to ask a question before starting, the brief is not finished.',
        ],
      },
      {
        heading: 'Four lines every brief needs',
        paragraphs: [
          'Outcome: what exists when this is done. Constraints: what must not happen. Evidence: where the truth lives. Escalation: when to stop and ask.',
          'Notice that none of these are instructions about how to work. That is deliberate. You are specifying the result and the boundaries, and leaving the method to the employee — the same way you would with a good contractor. Over-specifying method is how teams end up with output that follows the letter of the request and misses the point.',
        ],
        bullets: [
          'Outcome — “A one-page summary with three recommendations, each with a source link.”',
          'Constraints — “Do not email anyone. Do not edit the CRM.”',
          'Evidence — “Use the Q3 call transcripts and the pricing page.”',
          'Escalation — “If two sources conflict, stop and list the conflict.”',
        ],
      },
      {
        heading: 'A worked example',
        paragraphs: [
          'Here is the difference in practice. The left column is what people write. The right column is the same request, made executable.',
        ],
        example: {
          title: 'Same request, two briefs',
          lines: [
            'weak   — “Clean up our pipeline, it is a mess.”',
            '',
            'strong — Outcome: every open deal has an owner, a stage that',
            '         matches its last activity, and a next step dated in',
            '         the next 14 days.',
            '         Constraints: do not delete deals; do not change amounts.',
            '         Evidence: HubSpot activity log, last 90 days.',
            '         Escalation: flag deals with no activity for 30+ days',
            '         instead of closing them.',
          ],
        },
        quote:
          'A brief with no escalation rule is a brief that guesses. Guessing quietly is the most expensive thing an employee can do.',
      },
      {
        heading: 'When the output misses',
        paragraphs: [
          'Before you rewrite the brief, classify the miss. Was it a knowledge problem, a judgment problem, or a brief problem? Knowledge problems are fixed by connecting a source. Judgment problems are fixed by adding an example of good. Brief problems are fixed by adding a line, not a paragraph.',
          'Then hand the corrected work back as the new example. One corrected example is worth more than three paragraphs of feedback, because it shows the standard instead of describing it.',
        ],
        bullets: [
          'Missed facts → connect the source, then retry the same brief.',
          'Missed tone → attach two examples of your house voice.',
          'Missed scope → the brief was ambiguous; tighten the outcome line.',
        ],
      },
    ],
    takeaways: [
      'Specify outcome, constraints, evidence, and escalation — not method.',
      'If a stranger would need to ask a question, the brief is unfinished.',
      'Classify each miss before rewriting: knowledge, judgment, or brief.',
    ],
  },
  {
    slug: 'measuring-roi',
    category: 'Benchmark',
    title: 'Measuring ROI on your AI team',
    summary:
      'Hours reclaimed, response times, and pipeline touched — the four numbers we track with every customer.',
    readTime: '5 min read',
    intro:
      'Teams rarely struggle to feel the value of an AI employee. They struggle to prove it, because nobody wrote down the “before”. The fix is not a dashboard, it is four numbers recorded on the day you hire — and reviewed on the same day every month.',
    sections: [
      {
        heading: 'Start with hours, not dollars',
        paragraphs: [
          'Dollar attribution is where ROI conversations go to die. Nobody can cleanly split a closed deal between an AI employee, a rep, and a campaign. Hours are measurable on day one and they are the honest unit of comparison, because hours are what you were buying.',
          'Record the time the work took before the employee existed. Two weeks of a stopwatch is enough. If a support queue consumed eleven person-hours a week, that is your baseline — not an estimate of what it “should” take.',
        ],
      },
      {
        heading: 'The four numbers we track',
        paragraphs: [
          'Every customer we work with gets the same four, chosen because each one moves for a different reason and together they catch the case where an employee looks busy but is not helping.',
        ],
        bullets: [
          'Hours reclaimed — person-hours of work now completed without a human starting it.',
          'Cycle time — median time from request to delivered output, before and after.',
          'First-touch quality — share of outputs approved without edits in the first month.',
          'Escalation rate — share of tasks handed back to a human, and whether it is falling.',
        ],
      },
      {
        heading: 'Put them on one page',
        paragraphs: [
          'A number nobody looks at is not a metric. Write the four down with their baselines, add one line of context each, and review them in the same meeting where you review headcount. The conversation shifts quickly from “is this working” to “what should it take over next”.',
          'Keep the first-touch quality number honest by sampling. If you approve everything without reading, you are measuring your own optimism, not the employee.',
        ],
        quote:
          'The useful question is never “did the AI do this well”. It is “which task should it own next, and what would have to be true for that to be safe”.',
      },
      {
        heading: 'Review monthly, decide quarterly',
        paragraphs: [
          'Monthly review keeps the numbers current; quarterly review is when you change scope. At the quarter, either expand what the employee owns, reassign the work it keeps escalating, or retire the role. All three are good outcomes — a role that quietly does nothing is the only bad one.',
        ],
      },
    ],
    takeaways: [
      'Capture the “before” on hiring day — you cannot reconstruct it later.',
      'Four numbers: hours, cycle time, first-touch quality, escalation rate.',
      'Sample your approvals; rubber-stamping corrupts the only quality metric you have.',
    ],
  },
];

export function getGuide(slug: string | undefined): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
