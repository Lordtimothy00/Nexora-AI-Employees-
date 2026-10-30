import { Link } from 'react-router-dom';
import { ArrowUpRight, Linkedin, Twitter, Youtube } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'AI Employees', to: '/employees' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Dashboard', to: '/dashboard' },
    ],
  },
  {
    title: 'Departments',
    links: [
      { label: 'Sales', to: '/employees?department=Sales' },
      { label: 'Support', to: '/employees?department=Support' },
      { label: 'Marketing', to: '/employees?department=Marketing' },
      { label: 'Operations', to: '/employees?department=Operations' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/how-it-works' },
      { label: 'Customers', to: '/#customers' },
      { label: 'Security', to: '/how-it-works#security' },
      { label: 'Contact', to: '/signup' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/12 bg-[#060a13]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4d8dff]/40 to-transparent" />
      <div className="shell py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-[14px] leading-relaxed text-[#aab8cc]">
              AI employees that plug into your stack, learn your playbook, and ship real work — not
              another chat window.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/[0.06] px-3 py-1.5">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-mint opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-mint" />
              </span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#9cc0ff]">
                All systems operational
              </span>
            </div>
            <div className="mt-8 flex items-center gap-2">
              {[
                { icon: Twitter, label: 'X' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Youtube, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <a
                  key={label}
                  href="https://example.com"
                  aria-label={label}
                  className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-[#b8c5d7] transition hover:border-white/20 hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((column) => (
              <div key={column.title}>
                <h4 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#9aa7bd]">
                  {column.title}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        className="group inline-flex items-center gap-1 text-[13.5px] text-[#b9c6d9] transition-colors hover:text-white"
                      >
                        {link.label}
                        <ArrowUpRight className="size-3 opacity-0 transition-all group-hover:opacity-60" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12.5px] text-[#9aa7bd]">
            © {new Date().getFullYear()} Nexora Labs, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[#9aa7bd]">
            <span>SOC 2 Type II</span>
            <span className="hidden size-1 rounded-full bg-[#222d41] sm:block" />
            <span>GDPR ready</span>
            <span className="hidden size-1 rounded-full bg-[#222d41] sm:block" />
            <Link to="/how-it-works#security" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link to="/how-it-works#security" className="transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
