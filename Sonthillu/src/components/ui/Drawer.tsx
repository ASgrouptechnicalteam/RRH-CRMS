'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: 'left' | 'right';
}

export function Drawer({ isOpen, onClose, children, className, position = 'right' }: DrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div className="fixed inset-0 bg-text-primary/50 backdrop-blur-sm" />
      <div
        className={cn(
          'fixed inset-y-0 flex w-full max-w-sm animate-fade-in flex-col bg-white shadow-xl',
          position === 'left' ? 'left-0' : 'right-0',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface DrawerHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function DrawerHeader({ children, onClose, className }: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border px-6 py-4',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-text-primary">{children}</h3>
      {onClose && (
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-text-muted transition-colors hover:bg-border hover:text-text-primary"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}

interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerBody({ children, className }: DrawerBodyProps) {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)}>{children}</div>;
}

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return <div className={cn('border-t border-border px-6 py-4', className)}>{children}</div>;
}
