import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-[linear-gradient(100deg,#8b6dff_0%,#6d4dfa_45%,#5d7cff_100%)] text-white shadow-[0_10px_34px_-12px_rgba(124,92,255,0.85)] hover:shadow-[0_16px_44px_-12px_rgba(124,92,255,1)] hover:brightness-[1.08] border border-white/15',
  secondary:
    'bg-white/[0.06] text-white border border-white/12 hover:bg-white/[0.1] hover:border-white/20 backdrop-blur',
  ghost: 'bg-transparent text-[#c3c6d4] hover:text-white hover:bg-white/[0.06] border border-transparent',
  outline: 'bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/[0.04]',
  subtle: 'bg-[#7c5cff]/12 text-[#c9baff] border border-[#7c5cff]/25 hover:bg-[#7c5cff]/20',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-[52px] px-7 text-[15px] gap-2.5',
};

const base =
  'inline-flex items-center justify-center rounded-full font-medium tracking-[-0.01em] transition-all duration-200 disabled:opacity-55 disabled:pointer-events-none whitespace-nowrap select-none active:scale-[0.985]';

export function buttonStyles({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonStyles({ variant, size, className })} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : iconLeft}
      {children}
      {iconRight}
    </button>
  );
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props}>
      {iconLeft}
      {children}
      {iconRight}
    </Link>
  );
}
