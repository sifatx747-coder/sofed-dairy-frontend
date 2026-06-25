'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Sun, Sunset, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, SHIFTS, bn } from '@/lib/utils';

/* ------------------------------- Button -------------------------------- */
const buttonVariants = {
  default: 'bg-leaf-700 text-white hover:bg-leaf-800 shadow-sm',
  accent: 'bg-ghee-400 text-leaf-900 hover:bg-ghee-300 shadow-sm font-semibold',
  outline: 'border border-leaf-200 bg-surface text-leaf-800 hover:bg-leaf-50',
  ghost: 'text-leaf-800 hover:bg-leaf-100/70',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  dangerGhost: 'text-rose-600 hover:bg-rose-50',
};
const buttonSizes = {
  default: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-9 w-9 p-0',
};

export const Button = React.forwardRef(function Button(
  { className, variant = 'default', size = 'default', loading = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

/* ------------------------------ Form bits ------------------------------ */
export const Input = React.forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-leaf-200/80 bg-surface px-3 text-sm text-stone-800',
        'placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-leaf-500/60 focus:border-leaf-400',
        'disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});

export const Textarea = React.forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[80px] w-full rounded-xl border border-leaf-200/80 bg-surface px-3 py-2 text-sm',
        'placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-leaf-500/60 focus:border-leaf-400',
        className
      )}
      {...props}
    />
  );
});

export function Label({ className, ...props }) {
  return <label className={cn('mb-1.5 block text-xs font-semibold text-leaf-900/80', className)} {...props} />;
}

export function Field({ label, children, className, required }) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

export const Select = React.forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full cursor-pointer rounded-xl border border-leaf-200/80 bg-surface px-3 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-leaf-500/60 focus:border-leaf-400',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'inline-flex items-center gap-2 disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-leaf-500 rounded-full'
      )}
    >
      <span
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-leaf-600' : 'bg-stone-300'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </span>
      {label && <span className="text-sm text-stone-700">{label}</span>}
    </button>
  );
}

/* -------------------------------- Card --------------------------------- */
export function Card({ className, ...props }) {
  return (
    <div
      className={cn('rounded-xl2 bg-surface shadow-soft ring-1 ring-leaf-900/5', className)}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }) {
  return <div className={cn('flex items-start justify-between gap-3 p-5 pb-3', className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
  return <h3 className={cn('font-display text-lg text-leaf-900', className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-2', className)} {...props} />;
}

/* -------------------------------- Badge -------------------------------- */
const badgeTones = {
  leaf: 'bg-leaf-100 text-leaf-800',
  ghee: 'bg-ghee-100 text-ghee-700',
  rose: 'bg-rose-100 text-rose-700',
  stone: 'bg-stone-100 text-stone-600',
};
export function Badge({ tone = 'leaf', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        badgeTones[tone],
        className
      )}
      {...props}
    />
  );
}

/* -------------------------------- Table -------------------------------- */
export function Table({ className, ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  );
}
export function THead({ className, ...props }) {
  return <thead className={cn('text-left text-xs text-leaf-900/60', className)} {...props} />;
}
export function TH({ className, ...props }) {
  return <th className={cn('px-3 py-2 font-semibold whitespace-nowrap', className)} {...props} />;
}
export function TR({ className, ...props }) {
  return <tr className={cn('border-t border-leaf-100', className)} {...props} />;
}
export function TD({ className, ...props }) {
  return <td className={cn('px-3 py-2.5 align-middle whitespace-nowrap', className)} {...props} />;
}

/* -------------------------------- Dialog ------------------------------- */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({ className, children, title, description, wide = false }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-leaf-900/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2',
          wide ? 'max-w-2xl' : 'max-w-md',
          'max-h-[88vh] overflow-y-auto rounded-xl2 bg-surface p-6 shadow-lift',
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && (
              <DialogPrimitive.Title className="font-display text-xl text-leaf-900">
                {title}
              </DialogPrimitive.Title>
            )}
            {description && (
              <DialogPrimitive.Description className="mt-1 text-sm text-stone-500">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close className="rounded-lg p-1.5 text-stone-400 hover:bg-leaf-50 hover:text-leaf-800">
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* --------------------------------- Tabs -------------------------------- */
export function Tabs({ items, value, onChange, className }) {
  return (
    <div className={cn('inline-flex flex-wrap gap-1 rounded-xl bg-leaf-100/70 p-1', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
            value === item.value
              ? 'bg-surface text-leaf-900 shadow-sm'
              : 'text-leaf-800/60 hover:text-leaf-900'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------- Page pieces ----------------------------- */
export function PageHeader({ title, desc, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl text-leaf-900 md:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-stone-500">{desc}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

const statTones = {
  leaf: 'bg-leaf-100 text-leaf-700',
  ghee: 'bg-ghee-100 text-ghee-600',
  rose: 'bg-rose-100 text-rose-600',
  stone: 'bg-stone-100 text-stone-500',
};
export function StatCard({ icon: Icon, label, value, sub, tone = 'leaf' }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-500">{label}</p>
          <p className="num mt-1 truncate font-display text-2xl text-leaf-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-stone-400">{sub}</p>}
        </div>
        {Icon && (
          <span className={cn('shrink-0 rounded-xl p-2.5', statTones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, desc, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl2 border border-dashed border-leaf-200 bg-leaf-50/40 px-6 py-12 text-center">
      {Icon && <Icon className="mb-3 h-8 w-8 text-leaf-300" />}
      <p className="font-display text-lg text-leaf-900">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-stone-500">{desc}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-leaf-600', className)} />;
}

/* ------------------------------ Pagination ----------------------------- */
export function Pagination({ page, pages, total, onPage, className }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className={cn('flex items-center justify-between gap-3 pt-4', className)}>
      <p className="text-xs text-stone-500">
        পৃষ্ঠা {bn(page)} / {bn(pages)}
        {total != null && <span className="text-stone-400"> · মোট {bn(total)}টি</span>}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="gap-1" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
          আগের
        </Button>
        <Button variant="outline" size="sm" className="gap-1" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          পরের
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function PageLoader({ label = 'লোড হচ্ছে…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-stone-500">
      <Spinner className="h-7 w-7" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ------------------------- Date + shift picker ------------------------- */
export function DayShiftPicker({ date, onDate, shift, onShift, showShift = true }) {
  const icons = { morning: Sun, afternoon: Sunset };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="date"
        value={date}
        onChange={(e) => onDate(e.target.value)}
        className="w-auto min-w-[150px]"
      />
      {showShift && (
        <div className="inline-flex rounded-xl bg-leaf-100/70 p-1">
          {SHIFTS.map((s) => {
            const Icon = icons[s.value];
            return (
              <button
                key={s.value}
                onClick={() => onShift(s.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                  shift === s.value
                    ? 'bg-surface text-leaf-900 shadow-sm'
                    : 'text-leaf-800/60 hover:text-leaf-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
