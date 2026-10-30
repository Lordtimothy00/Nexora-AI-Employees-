import { ArrowRight, Check, Crown, Gift, Sparkles, Target, Zap } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';

const rewards = [
  {
    icon: Gift,
    tone: 'olive',
    title: 'Refer a team',
    description: 'One month free for both workspaces.',
    status: 'Unlocked',
    unlocked: true,
  },
  {
    icon: Target,
    tone: 'ember',
    title: 'Ship 1,000 tasks',
    description: '$250 credit toward your next hire.',
    status: '588 / 1,000',
    unlocked: false,
  },
  {
    icon: Crown,
    tone: 'gold',
    title: 'Go annual',
    description: 'Two months free, applied automatically.',
    status: 'Available',
    unlocked: true,
  },
] as const;

const toneStyles = {
  olive: {
    icon: 'bg-[#b5b56f]/15 text-[#e2e2b0] ring-[#b5b56f]/25',
    bar: 'bg-[linear-gradient(90deg,#d9d9a0,#b5b56f)]',
    pill: 'bg-[#b5b56f]/12 text-[#e2e2b0]',
  },
  ember: {
    icon: 'bg-[#dd6816]/18 text-[#ffc08e] ring-[#dd6816]/30',
    bar: 'bg-[linear-gradient(90deg,#ffa15c,#dd6816)]',
    pill: 'bg-[#dd6816]/15 text-[#ffc08e]',
  },
  gold: {
    icon: 'bg-[#e9b45f]/15 text-[#f8dfb4] ring-[#e9b45f]/25',
    bar: 'bg-[linear-gradient(90deg,#f8dfb4,#e9b45f)]',
    pill: 'bg-[#e9b45f]/12 text-[#f8dfb4]',
  },
};

export function RewardsBand() {
  return (
    <section id="rewards" className="relative py-6 md:py-10">
      <div className="shell">
        <Reveal>
          <div className="noise relative overflow-hidden rounded-[30px] border border-[#b5b56f]/25 bg-[linear-gradient(115deg,#25260f_0%,#16170c_40%,#1b0c06_100%)] p-6 md:p-10">
            <div className="pointer-events-none absolute inset-x-28 -top-px h-px bg-gradient-to-r from-transparent via-[#d9d9a0] to-transparent" />
            <div className="pointer-events-none absolute -left-24 -top-28 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(181,181,111,0.22),transparent_65%)]" />
            <div className="pointer-events-none absolute -bottom-40 right-[-80px] size-[420px] rounded-full bg-[radial-gradient(circle,rgba(221,104,22,0.28),transparent_65%)]" />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.25] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_72%)]" />

            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div>
                <span className="eyebrow border-[#b5b56f]/25 bg-[#b5b56f]/[0.07] text-[#e2e2b0]">
                  <Gift className="size-3 text-[#d9d9a0]" />
                  Nexora perks
                </span>
                <h2 className="mt-5 text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold leading-[1.06]">
                  Rewards for teams
                  <br />
                  <span className="text-[#d9d9a0]">that actually ship.</span>
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[#c5b2a6]">
                  Every delivered task earns points. Points unlock credits, free months, and early
                  access to new employees — automatically, with no forms to fill in.
                </p>

                <div className="mt-7 flex flex-col items-start gap-3">
                  <ButtonLink to="/signup" size="lg" iconRight={<ArrowRight className="size-4" />}>
                    Start earning on your first task
                  </ButtonLink>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-[#a68e80]">
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3 text-[#b5b56f]" /> Points never expire
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3 text-[#b5b56f]" /> Applied to your next invoice
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* perks card */}
                <div className="relative overflow-hidden rounded-2xl border border-[#b5b56f]/35 bg-[linear-gradient(135deg,#41411c_0%,#26270f_48%,#25100a_100%)] p-4">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-[radial-gradient(circle,rgba(217,217,160,0.3),transparent_68%)] blur-lg"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[#e2e2b0] to-transparent"
                  />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#e2e2b0]/80">
                        Nexora perks
                      </p>
                      <p className="mt-2 font-display text-[20px] font-semibold leading-none text-white">
                        1,842 <span className="text-[10px] font-normal text-[#c7c8a4]">pts</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#d9d9a0]/30 bg-[#d9d9a0]/10 px-2 py-1 text-[9px] text-[#e2e2b0]">
                      <Crown className="size-2.5" /> Olive tier
                    </span>
                  </div>
                  <div className="relative mt-4 flex items-end justify-between">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#c7c8a4]/70">
                        Member
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#f4e9d6]">Alex Morgan</p>
                    </div>
                    <div className="flex items-end gap-[3px]">
                      {[8, 13, 10, 18, 22, 17, 26].map((height, index) => (
                        <span
                          key={index}
                          className="w-[4px] rounded-sm bg-[linear-gradient(180deg,#e2e2b0,rgba(181,181,111,0.25))]"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* progress */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="inline-flex items-center gap-1.5 text-[#c5b2a6]">
                      <Zap className="size-3 text-[#ffc08e]" /> Next reward · $250 credit
                    </span>
                    <span className="font-mono text-[9.5px] text-white">588 / 1,000</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[59%] rounded-full bg-[linear-gradient(90deg,#d9d9a0,#ffa15c)]" />
                  </div>
                  <p className="mt-1.5 text-[9.5px] text-[#8a7365]">
                    412 tasks to go — roughly two weeks at your current pace.
                  </p>
                </div>

                {/* reward rows */}
                <div className="divide-y divide-white/6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                  {rewards.map((reward) => {
                    const tone = toneStyles[reward.tone];
                    return (
                      <div key={reward.title} className="flex items-center gap-3 px-3.5 py-3">
                        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${tone.icon}`}>
                          <reward.icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11.5px] font-medium text-white">{reward.title}</p>
                          <p className="truncate text-[10px] text-[#8a7365]">{reward.description}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.08em] ${tone.pill}`}
                        >
                          {reward.status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="flex items-center gap-1.5 text-[9px] text-[#6f5548]">
                  <Sparkles className="size-2.5" />
                  Illustrative rewards in this preview. Points shown are from the demo workspace.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
