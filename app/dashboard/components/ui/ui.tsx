'use client';

import { useEffect, useEffectEvent, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

// PayPal-style building blocks for the dashboard shell: pill buttons, a modal dialog and a
// small popover menu. Styling only; behaviour stays in the callers.

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-pp-blue text-white hover:bg-pp-blue-dark disabled:bg-pp-border disabled:text-pp-muted',
  secondary: 'border border-pp-navy text-pp-navy hover:bg-pp-highlight disabled:border-pp-border disabled:text-pp-muted',
  ghost: 'text-pp-blue hover:bg-pp-highlight disabled:text-pp-muted',
  danger: 'bg-pp-danger text-white hover:brightness-90',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  const sizing = size === 'sm' ? 'h-8 px-4 text-sm' : 'h-10 px-5 text-[15px]';
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pp-blue disabled:cursor-not-allowed ${sizing} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function IconButton({ label, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-pp-navy transition-colors hover:bg-pp-highlight focus-visible:outline-2 focus-visible:outline-pp-blue disabled:cursor-not-allowed disabled:text-pp-border disabled:hover:bg-transparent ${className}`}
      {...props}
    />
  );
}

export function Dialog({
  open,
  title,
  children,
  actions,
  onClose,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-lg bg-white p-0 font-paypal text-pp-ink shadow-xl backdrop:bg-pp-navy/40"
    >
      {open && (
        <div className="p-6">
          <h2 className="text-xl font-semibold text-pp-navy">{title}</h2>
          <div className="mt-3 text-[15px] text-pp-muted">{children}</div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div>
        </div>
      )}
    </dialog>
  );
}

export function Menu({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Callers pass a new onClose each render; this keeps the listeners below from re-attaching.
  const close = useEffectEvent(onClose);
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) close();
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-pp-border bg-white py-1 shadow-lg"
    >
      {children}
    </div>
  );
}

export function MenuItem({ danger, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      className={`block w-full px-4 py-2 text-left text-sm hover:bg-pp-highlight ${danger ? 'text-pp-danger' : 'text-pp-ink'}`}
      {...props}
    />
  );
}
