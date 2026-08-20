import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  icon?: React.ComponentType;
  skeletonRows?: number;
}

/**
 * EmptyState — Empty state placeholder with action CTA.
 *
 * Visual system:
 *   - Centered layout with generous spacing (var(--space-8) vertical rhythm)
 *   - Icon slot (or placeholder circle)
 *   - Title in deep navy hierarchy
 *   - Description in muted slate
 *   - Primary CTA button slot
 *   - No horizontal scrolling, fully responsive
 *
 * Accessibility:
 *   - aria-label required or derived from title + description
 *   - Action button has clear accessible name
 */

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  actionOnClick,
  icon: IconComponent,
  skeletonRows = 2,
}) => {
  const Icon = IconComponent || ((<div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center animate-pulse" />));

  return (
    <div className="text-center p-8">
      <Icon className="mx-auto mb-4" aria-hidden="true" />
      <h3 className="text-xl font-semibold text-neutral-900 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-base text-neutral-500 mb-6">
          {description}
        </p>
      )}
      {actionLabel && actionOnClick && (
        <button
          onClick={actionOnClick}
          className`
            btn-primary
            w-full
            py-2
            mt-4
          `
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export { EmptyState, EmptyStateProps };