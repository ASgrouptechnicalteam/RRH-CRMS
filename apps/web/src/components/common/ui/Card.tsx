import React from 'react';

export interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

export interface CardTitleProps {
  className?: string;
}

export interface CardDescriptionProps {
  className?: string;
}

export interface CardContentProps {
  className?: string;
}

export interface CardFooterProps {
  className?: string;
}

export type CardVariant = 'default' | 'elevated' | 'outlined';

/**
 * Card — Card component primitive with sub-components.
 *
 * Geometry per CRM-DESIGN-SYSTEM-RULES.md:
 *   - 16px border-radius (--radius-md)
 *   - Background: --color-surface-raised (#EAF3FB) or --color-card-surface
 *   - Subtle border: #D7E3EA
 *   - Very soft shadow: var(--shadow-card)
 *   - No heavy gradients, no neon
 *
 * Sub-components provide consistent vertical rhythm using the 4px/8px spacing scale.
 */

const Card: React.FC<{
  variant?: CardVariant;
  className?: string;
  children: React.ReactNode;
}> = ({ variant = 'default', className, children }) => {
  const cardClasses = `
    card
    rounded-md
    border
    border-transparent
    shadow-sm
    transition-all
    data-[variant=default]:bg-surface-soft
    data-[variant=elevated]:bg-white shadow-lg
    data-[variant=outlined]:bg-white border border-border
  `.trim();

  return (
    <div
      className`
        ${cardClasses}
        ${className}
      `
    >
      {children}
    </div>
  );
};

Card.Header: React.FC<CardHeaderProps> = ({ title, subtitle }) => (
  <div className="flex flex-col space-y-1.5">
    <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
    {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
  </div>
);

Card.Title: React.FC<CardTitleProps> = ({ className, children }) => (
  <h4 className={`text-xs font-semibold text-neutral-900 ${className}`}>
    {children}
  </h4>
);

Card.Description: React.FC<CardDescriptionProps> = ({ className, children }) => (
  <p className={`text-xs text-neutral-500 ${className}`}>
    {children}
  </p>
);

Card.Content: React.FC<CardContentProps> = ({ className, children }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

Card.Footer: React.FC<CardFooterProps> = ({ className, children }) => (
  <div className={`p-6 pt-0 border-t border-border ${className}`}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardVariant, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps };