'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
  showButton?: boolean;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, onSearch, showButton = false, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch(e.currentTarget.value);
      }
    };

    return (
      <div className={cn('relative flex gap-2', className)}>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <svg
              className="h-5 w-5 text-text-muted"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            ref={ref}
            type="search"
            className={cn(
              'w-full rounded-lg border border-border bg-white py-3 pl-12 pr-4 text-text-primary transition-colors',
              'placeholder:text-text-muted',
              'focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20'
            )}
            onKeyDown={handleKeyDown}
            {...props}
          />
        </div>
        {showButton && (
          <button
            type="button"
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling?.querySelector('input');
              if (input && onSearch) {
                onSearch(input.value);
              }
            }}
            className="rounded-lg bg-brand-navy px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-navy-dark"
          >
            Search
          </button>
        )}
      </div>
    );
  }
);

SearchField.displayName = 'SearchField';
