import React from 'react';

export type ButtonVariant = 'primary' | 'gold' | 'action' | 'secondary' | 'destructive';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

/**
 * Button — Production-grade button primitive.
 *
 * Variants mapped to Sonthillu brand colors:
 *   primary:   --color-navy   (#203873)
 *   gold:      --color-gold    (#E0B040)
 *   action:    --color-action-blue (#4268E8)
 *   secondary: ghost with --color-neutral-300 border
 *   destructive: --color-destructive (#EF4444)
 *
 * Sizes:
 *   sm: 28px height,    --space-3 (12px) padding horizontal, --space-2 (8px) vertical
 *   md: 36px height,    --space-4 (16px) padding horizontal, --space-3 (12px) vertical
 *   lg: 44px height,    --space-5 (20px) padding horizontal, --space-4 (16px) vertical — meets Fitts' Law 44px touch target
 *
 * States:
 *   hover:       brightness 0.92, subtle elevation rise
 *   active:      scale(0.98)
 *   focus-visible: 2px solid var(--color-action-blue) + 2px outline-offset
 *   disabled:    opacity 0.5, pointer-events-none
 *   isLoading:   spinner inline-end, disabled state applied
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading,
  startIcon,
  endIcon,
  children,
  disabled,
  className,
  ...rest
}) => {
  const sizeStyles = {
    sm: {
      height: '28px',
      padding: '0 var(--space-3)',   /* 12px horizontal */
      paddingY: 'var(--space-2)',   /* 8px vertical */
      fontSize: 'var(--text-sm)',   /* 11px */
      borderRadius: var(--radius-sm), /* 4px */
    },
    md: {
      height: '36px',
      padding: 'var(--space-4) var(--space-3)', /* 16px horizontal, 12px vertical */
      fontSize: 'var(--text-base)', /* 16px */
      borderRadius: var(--radius-md), /* 8px */
    },
    lg: {
      height: '44px',
      padding: 'var(--space-5) var(--space-4)', /* 20px horizontal, 16px vertical */
      fontSize: 'var(--text-lg)', /* 18px */
      borderRadius: var(--radius-md), /* 8px */
    },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-navy)',
      color: 'var(--color-canvas)',
      _hover: { backgroundColor: 'var(--color-action-blue-hover)' },
      _active: { transform: 'scale(0.98)' },
    },
    gold: {
      backgroundColor: 'var(--color-gold)',
      color: 'var(--color-navy)',
      _hover: { backgroundColor: '#d2a83c' },
      _active: { transform: 'scale(0.98)' },
    },
    action: {
      backgroundColor: 'var(--color-action-blue)',
      color: 'var(--color-canvas)',
      _hover: { backgroundColor: 'var(--color-action-blue-hover)' },
      _active: { transform: 'scale(0.98)' },
    },
    secondary: {
      backgroundColor: 'transparent',
      color: 'var(--color-navy)',
      border: '1px solid var(--color-neutral-300)',
      _hover: { borderColor: 'var(--color-action-blue)', color: 'var(--color-action-blue)' },
      _active: { transform: 'scale(0.98)' },
    },
    destructive: {
      backgroundColor: 'var(--color-destructive)',
      color: 'var(--color-canvas)',
      _hover: { backgroundColor: '#dc2626' },
      _active: { transform: 'scale(0.98)' },
    },
  };

  const styles = variantStyles[variant as keyof typeof variantStyles] || variantStyles.primary;
  const sizeObj = sizeStyles[size as keyof typeof sizeStyles] || sizeStyles.md;

  const spinner = (
    <span className="align-middle mr-2 h-3 w-3 animate-spin border-2 border-white rounded-full" aria-hidden="true" />
  );

  return (
    <button
      type="button"
      disabled={isLoading || disabled}
      className`
        w-full
        inline-flex
        items-center
        justify-center
        rounded-md
        font-medium
        transition-property: background-color, border-color, color, transform, box-shadow
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1)
        transition-duration: 150ms
        ${isLoading ? 'opacity-70 pointer-events-none' : ''}
        ${!isLoading && disabled ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `
      style={{
        ...sizeObj,
        ...variantStyles[variant as keyof typeof variantStyles],
        '&:hover': variant === 'secondary' ? styles._hover : {
          backgroundColor: (variantStyles[variant as keyof typeof variantStyles] as any)._hover?.backgroundColor,
        },
        '&:active': styles._active,
        '&:focus-visible': `
          outline: 2px solid var(--color-action-blue);
          outline-offset: 2px;
        `,
      }},
      ...rest
    >
      {startIcon && <span className="mr-2 align-middle">{startIcon}</span>}
      {isLoading && spinner}
      <span className="align-middle whitespace-nowrap">
        {children}
      </span>
      {endIcon && <span className="ml-2 align-middle">{endIcon}</span>}
    </button>
  );
};

export { Button, ButtonVariant, ButtonSize, ButtonProps };