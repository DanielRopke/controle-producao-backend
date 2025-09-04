import React, { useEffect, useRef } from 'react';

type MenuItem = { id: string; label: string; onClick: () => void };

interface ContextMenuProps {
  open: boolean;
  position: { x: number; y: number };
  items: MenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ open, position, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (ev: MouseEvent) => {
      if (!ref.current) return;
      if (ev.target && !ref.current.contains(ev.target as Node)) {
        onClose();
      }
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // focus first button when opened
    const timer = setTimeout(() => {
      if (ref.current) {
        const btn = ref.current.querySelector('button') as HTMLButtonElement | null;
        btn?.focus();
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  const style: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: 9999,
    minWidth: 190,
  };

  return (
    <div
      ref={ref}
      style={style}
      role="menu"
      aria-orientation="vertical"
      className="rounded-lg shadow-[0_10px_30px_rgba(2,6,23,0.35)] bg-white/80 backdrop-blur-md border border-green-600/30 ring-1 ring-green-400/10 overflow-hidden"
    >
      <div className="flex flex-col py-1">
        {items.map((it, idx) => (
          <button
            key={it.id}
            role="menuitem"
            tabIndex={0}
            onClick={() => {
              try {
                it.onClick();
              } catch (e) {
                console.error('ContextMenu item error', e);
              } finally {
                onClose();
              }
            }}
            className={`text-left px-4 py-2 text-sm transition-colors flex items-center gap-3 focus:outline-none ${idx === 0 ? 'rounded-t-md' : ''} hover:bg-green-50/60 hover:text-green-700`}
          >
            <span className="font-medium">{it.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
