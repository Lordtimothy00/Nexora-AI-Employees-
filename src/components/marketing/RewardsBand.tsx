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
    icon: 'bg-[#c8f060]/15 text-[#e2fa9e] ring-[#c8f060]/25',
    bar: 'bg-[linear-gradient(90deg,#e2fa9e,#c8f060)]',
    pill: 'bg-[#c8f060]/12 text-[#e2fa9e]',
  },
  ember: {
    icon: 'bg-[#c8f060]/18 text-[#e2fa9e] ring-[#c8f060]/30',
    bar: 'bg-[linear-gradient(90deg,#d7f68c,#c8f060)]',
    pill: 'bg-[#c8f060]/15 text-[#e2fa9e]',
  },
  gold: {
    icon: 'bg-[#d3d5cd]/15 text-[#e6e7e3] ring-[#d3d5cd]/25',
    bar: 'bg-[linear-gradient(90deg,#e6e7e3,#d3d5cd)]',
    pill: 'bg-[#d3d5cd]/12 text-[#e6e7e3]',
  },
};

export function RewardsBand() {
  return (
    <section id="rewards" className="relative py-6 md:py-10">
      <div className="shell">
        <Reveal>
          <div className="noise relative overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(115deg,#1d2022_0%,#121314_45%,#0d0e0f_100%)] p-6 md:p-10">
            <div className="pointer-events-none absolute inset-x-28 -top-px h-px bg-gradient-to-r from-transparent via-[#e2fa9e] to-transparent" />
            <div className="pointer-events-none absolute -left-24 -top-28 size-[460px] rounded-full bg-[radial-gradient(circle,rgba(200,240,96,0.12),transparent_65%)]" />
            <div className="pointer-events-none absolute -bottom-40 right-[-80px] size-[420px] rounded-full bg-[radial-gradient(circle,rgba(245,245,243,0.08),transparent_65%)]" />
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.25] [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_72%)]" />

            <div className="relative grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
              <div>
                <span className="eyebrow border-[#c8f060]/25 bg-[#c8f060]/[0.07] text-[#e2fa9e]">
                  <Gift className="size-3 text-[#e2fa9e]" />
                  Nexora perks
                </span>
                <h2 className="mt-5 text-[clamp(1.9rem,3.6vw,2.8rem)] font-semibold leading-[1.06]">
                  Rewards for teams
                  <br />
                  <span className="text-[#e2fa9e]">that actually ship.</span>
                </h2>
                <p className="mt-4 max-w-md text-[14px] leading-relaxed text-[#b8b9b5]">
                  Every delivered task earns points. Points unlock credits, free months, and early
                  access to new employees — automatically, with no forms to fill in.
                </p>

                <div className="mt-7 flex flex-col items-start gap-3">
                  <ButtonLink to="/signup" size="lg" iconRight={<ArrowRight className="size-4" />}>
                    Start earning on your first task
                  </ButtonLink>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px] text-[#9d9e9a]">
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3 text-[#c8f060]" /> Points never expire
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Check className="size-3 text-[#c8f060]" /> Applied to your next invoice
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* perks card */}
                <div className="relative overflow-hidden rounded-2xl border border-[#c8f060]/25 bg-[linear-gradient(135deg,#2b2f32_0%,#1b1d1f_48%,#121314_100%)] p-4">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-[radial-gradient(circle,rgba(200,240,96,0.2),transparent_68%)] blur-lg"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[#e2fa9e] to-transparent"
                  />
                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[#e2fa9e]/80">
                        Nexora perks
                      </p>
                      <p className="mt-2 font-display text-[20px] font-semibold leading-none text-white">
                        1,842 <span className="text-[10px] font-normal text-[#c3c4c0]">pts</span>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#e2fa9e]/30 bg-[#e2fa9e]/10 px-2 py-1 text-[9px] text-[#e2fa9e]">
                      <Crown className="size-2.5" /> Signal tier
                    </span>
                  </div>
                  <div className="relative mt-4 flex items-end justify-between">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#c3c4c0]/70">
                        Member
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#e6e7e3]">Alex Morgan</p>
                    </div>
                    <div className="flex items-end gap-[3px]">
                      {[8, 13, 10, 18, 22, 17, 26].map((height, index) => (
                        <span
                          key={index}
                          className="w-[4px] rounded-sm bg-[linear-gradient(180deg,#e2fa9e,rgba(200,240,96,0.25))]"
                          style={{ height: `${height}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* progress */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="inline-flex items-center gap-1.5 text-[#b8b9b5]">
                      <Zap className="size-3 text-[#e2fa9e]" /> Next reward · $250 credit
                    </span>
                    <span className="font-mono text-[9.5px] text-white">588 / 1,000</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[59%] rounded-full bg-[linear-gradient(90deg,#e2fa9e,#d7f68c)]" />
                  </div>
                  <p className="mt-1.5 text-[9.5px] text-[#7c7d79]">
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
                          <p className="truncate text-[10px] text-[#7c7d79]">{reward.description}</p>
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

                <p className="flex items-center gap-1.5 text-[9px] text-[#5e5f5c]">
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
