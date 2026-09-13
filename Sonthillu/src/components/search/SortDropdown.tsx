'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { SortOption } from '@/types/search';
import { SORT_OPTIONS } from '@/types/search';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLabel = SORT_OPTIONS.find((opt) => opt.value === value)?.label || 'Sort';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-brand-navy/50"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13-6L16.5 19m0 0L12 14.5m4.5 4.5V7.5"
          />
        </svg>
        {selectedLabel}
        <svg
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-white shadow-lg"
          role="listbox"
          aria-label="Sort options"
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors',
                value === option.value
                  ? 'bg-brand-navy/5 text-brand-navy font-medium'
                  : 'text-text-primary hover:bg-surface-muted'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Mobile sort bottom sheet.
 */
interface MobileSortSheetProps {
  isOpen: boolean;
  onClose: () => void;
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function MobileSortSheet({ isOpen, onClose, value, onChange }: MobileSortSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-text-primary/50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Sort by</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-muted hover:bg-border"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                onClose();
              }}
              className={cn(
                'flex w-full items-center rounded-lg px-4 py-3 text-left text-sm transition-colors',
                value === option.value
                  ? 'bg-brand-navy/10 text-brand-navy font-medium'
                  : 'text-text-primary hover:bg-surface-muted'
              )}
            >
              {value === option.value && (
                <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
