import React from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  icon?: React.ElementType;
  skeletonRows?: number;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  actionOnClick,
  icon: IconComponent,
  skeletonRows = 2,
  children,
}) => {
  let Icon: React.ReactElement | null = null;

  if (IconComponent) {
    Icon = <IconComponent className="mx-auto mb-4" aria-hidden="true" />;
  } else {
    Icon = (
      <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center animate-pulse" />
    );
  }

  return (
    <div className="text-center p-8">
      {children}
      {Icon}
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
          className="btn-primary w-full py-2 mt-4"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export { EmptyState };