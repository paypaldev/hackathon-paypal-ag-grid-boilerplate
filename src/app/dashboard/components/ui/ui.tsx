'use client';

import { useEffect, useEffectEvent, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

// Black & Grey Stealth building blocks for the dashboard shell
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-zinc-100 text-zinc-950 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 shadow-sm',
  secondary: 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-600 disabled:border-zinc-800 disabled:text-zinc-600 shadow-sm',
  ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:text-zinc-600',
  danger: 'bg-rose-700 text-white hover:bg-rose-600 shadow-sm',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  const sizing = size === 'sm' ? 'h-8 px-4 text-xs' : 'h-10 px-5 text-sm';
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed cursor-pointer ${sizing} ${VARIANTS[variant]} ${className}`}
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
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white focus-visible:outline-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:text-zinc-700 disabled:hover:bg-transparent cursor-pointer ${className}`}
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
      className="m-auto w-[min(460px,calc(100vw-32px))] rounded-xl bg-[#121215] border border-zinc-800 p-0 font-paypal text-zinc-100 shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      {open && (
        <div className="p-6">
          <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          <div className="mt-3 text-sm text-zinc-400">{children}</div>
          <div className="mt-6 flex flex-wrap justify-end gap-3 pt-3 border-t border-zinc-850">{actions}</div>
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
      className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-zinc-800 bg-[#121215] py-1 shadow-2xl text-zinc-200"
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
      className={`block w-full px-4 py-2 text-left text-xs transition-colors cursor-pointer ${
        danger ? 'text-rose-400 hover:bg-rose-950/40' : 'text-zinc-200 hover:bg-zinc-800/80 hover:text-white'
      }`}
      {...props}
    />
  );
}
