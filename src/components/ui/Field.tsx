import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
}

const fieldShell =
  'w-full rounded-xl border bg-white/[0.03] px-3.5 text-[14px] text-white placeholder:text-[#5f6376] transition-all duration-200 focus:bg-white/[0.05] focus:outline-none';

export function Field({ label, hint, error, icon, trailing, className, id, ...props }: FieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={fieldId} className="flex items-center justify-between text-[12.5px] font-medium text-[#a9adbd]">
        <span>{label}</span>
        {hint && <span className="text-[11px] font-normal text-[#6c7085]">{hint}</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6c7085]">
            {icon}
          </span>
        )}
        <input
          id={fieldId}
          className={cn(
            fieldShell,
            'h-11',
            icon ? 'pl-10' : '',
            trailing ? 'pr-11' : '',
            error
              ? 'border-rose-400/50 focus:border-rose-400/80'
              : 'border-white/10 hover:border-white/20 focus:border-[#7c5cff]/70 focus:ring-4 focus:ring-[#7c5cff]/10',
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
        {trailing && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>
        )}
      </div>
      {error && (
        <p id={`${fieldId}-error`} className="text-[12px] text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField(props: Omit<FieldProps, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="grid size-8 place-items-center rounded-lg text-[#6c7085] transition hover:bg-white/5 hover:text-white"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
    />
  );
}
