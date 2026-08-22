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

const sizeStyles = {
  sm: {
    height: '28px',
    padding: '0 var(--space-3)',
    paddingY: 'var(--space-2)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-sm)',
  },
  md: {
    height: '36px',
    padding: 'var(--space-4) var(--space-3)',
    fontSize: 'var(--text-base)',
    borderRadius: 'var(--radius-md)',
  },
  lg: {
    height: '44px',
    padding: 'var(--space-5) var(--space-4)',
    fontSize: 'var(--text-lg)',
    borderRadius: 'var(--radius-md)',
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
  const sizeObj = sizeStyles[size as keyof typeof sizeStyles] || sizeStyles.md;

  const spinner = (
    <span className="align-middle mr-2 h-3 w-3 animate-spin border-2 border-white rounded-full" aria-hidden="true" />
  );

  return (
    <button
      type="button"
      disabled={isLoading || disabled}
      className={`w-full inline-flex items-center justify-center rounded-md font-medium transition-property:background-color border-color color transform box-shadow transition-timing-function:cubic-bezier(0.4,0,0.2,1) transition-duration:150ms ${isLoading?'opacity-70 pointer-events-none':''} {!isLoading&&disabled?'opacity-50 pointer-events-none':''} ${className}`}
      {...rest}
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

export { Button };