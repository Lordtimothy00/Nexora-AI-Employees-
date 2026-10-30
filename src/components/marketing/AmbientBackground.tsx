const particles = [
  { left: '8%', top: '22%', size: 3, delay: '0s', duration: '18s', tint: 'bg-[#7aa8ff]/70' },
  { left: '14%', top: '68%', size: 2, delay: '-4s', duration: '22s', tint: 'bg-[#c4b5fd]/60' },
  { left: '22%', top: '38%', size: 1.5, delay: '-8s', duration: '16s', tint: 'bg-white/60' },
  { left: '31%', top: '12%', size: 2, delay: '-12s', duration: '24s', tint: 'bg-[#8b5cf6]/60' },
  { left: '43%', top: '76%', size: 2.5, delay: '-2s', duration: '20s', tint: 'bg-[#4d8dff]/60' },
  { left: '52%', top: '18%', size: 1.5, delay: '-6s', duration: '26s', tint: 'bg-white/50' },
  { left: '61%', top: '58%', size: 2, delay: '-10s', duration: '19s', tint: 'bg-[#c4b5fd]/60' },
  { left: '68%', top: '30%', size: 3, delay: '-14s', duration: '23s', tint: 'bg-[#4d8dff]/50' },
  { left: '77%', top: '72%', size: 1.5, delay: '-3s', duration: '21s', tint: 'bg-[#8b5cf6]/60' },
  { left: '86%', top: '44%', size: 2, delay: '-9s', duration: '17s', tint: 'bg-white/50' },
  { left: '92%', top: '16%', size: 2.5, delay: '-5s', duration: '25s', tint: 'bg-[#7aa8ff]/60' },
  { left: '38%', top: '86%', size: 1.5, delay: '-13s', duration: '22s', tint: 'bg-white/40' },
];

/**
 * The AI operating environment: layered blue/violet aurora, a hairline grid and slow drifting
 * particles painted behind every page. Purely decorative.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#181a25]" />

      <div className="aurora aurora-blue animate-aurora left-1/2 top-[-22%] size-[760px] -translate-x-1/2 opacity-80" />
      <div
        className="aurora aurora-violet animate-aurora right-[-16%] top-[10%] size-[620px] opacity-70"
        style={{ animationDelay: '-7s' }}
      />
      <div
        className="aurora aurora-blue animate-aurora bottom-[2%] left-[-18%] size-[680px] opacity-50"
        style={{ animationDelay: '-12s' }}
      />
      <div
        className="aurora aurora-violet animate-aurora bottom-[-24%] left-1/2 size-[600px] -translate-x-1/2 opacity-40"
        style={{ animationDelay: '-4s' }}
      />

      <div className="grid-lines absolute inset-0 opacity-70 [mask-image:radial-gradient(ellipse_at_50%_18%,black,transparent_74%)]" />

      <div className="absolute inset-0">
        {particles.map((particle, index) => (
          <span
            key={index}
            className={`animate-drift absolute rounded-full ${particle.tint}`}
            style={{
              left: particle.left,
              top: particle.top,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
              boxShadow: '0 0 8px 1px rgba(122,168,255,0.45)',
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_30%,rgba(16,14,13,0.85)_100%)]" />
      <div className="noise absolute inset-0 opacity-60" />
    </div>
  );
}
