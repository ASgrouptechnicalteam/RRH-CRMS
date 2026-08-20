import React from 'react';

/**
 * GlobalSearchInput — Top-utility search input.
 *
 * Placeholder-only input in the top bar; does not perform routing.
 * Uses the design system CSS variables for consistency.
 */
const GlobalSearchInput: React.FC<{
  placeholder?: string;
  className?: string;
}> = ({ placeholder = 'Search...', className }) => {
  return (
    <div className="relative flex items-center rounded-md border border-neutral-300 bg-white px-3 py-2">
      <span className="absolute left-3 text-neutral-400 flex -translate-y-1/2 w-4 h-4 pointer-events-none">
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M21 21l-1.41-1.41M2 12l2.29-2.29M12 2l2.29 2.29M2 21l1.41-1.41M12 2l-2.29 2.29M2.29 2.29l2.29 2.29M2 12l-2.29-2.29M12 22l-1.41 1.41M4.41 4.41l1.41 1.41M 12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2z" />
        </svg>
      </span>
      <input
        type="text"
        placeholder={placeholder}
        className`
          bg-transparent
          outline-none
          ring-0
          text-sm
          text-neutral-700
          w-full
          pl-7
          pr-2
          placeholder-shown:pl-8
        `
      />
    </div>
  );
};

export { GlobalSearchInput };