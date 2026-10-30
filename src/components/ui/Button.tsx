import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-[#f2f4f8] text-[#080b12] shadow-[0_10px_32px_-16px_rgba(226,236,247,0.55)] hover:bg-white hover:shadow-[0_16px_44px_-16px_rgba(226,236,247,0.7)] border border-white/70',
  secondary:
    'bg-white/[0.06] text-white border border-white/12 hover:bg-white/[0.1] hover:border-white/20 backdrop-blur',
  ghost: 'bg-transparent text-[#cccfd1] hover:text-white hover:bg-white/[0.06] border border-transparent',
  outline: 'bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/[0.04]',
  subtle: 'bg-[#c8f060]/10 text-[#e2fa9e] border border-[#c8f060]/25 hover:bg-[#c8f060]/16 hover:border-[#c8f060]/40',
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
