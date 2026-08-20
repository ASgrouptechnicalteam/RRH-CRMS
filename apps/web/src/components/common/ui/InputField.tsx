import React from 'react';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  placeholder?: string;
  type?: HTMLInputElement['type'];
}

/**
 * InputField — Single-line input primitive.
 *
 * Height: 40-44px (var(--space-5) = 20px padding + border + content height)
 * Label: strictly above the input field
 * Validation states: default, focus (Action Blue ring), error (destructive border)
 * Always includes accessible label wrapping
 *
 * Spacing: 4px/8px rhythm — label margin-bottom var(--space-2), input padding var(--space-3)/var(--space-4)
 */

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  error,
  success,
  disabled,
  placeholder,
  type = 'text',
  className,
  ...rest
}) => {
  const hasLabel = label !== undefined && label !== null;
  const hasError = !!error;
  const hasSuccess = !!success && !hasError;

  return (
    <div className="space-y-1.5">
      {hasLabel && (
        <label
          htmlFor={id}
          className`
            block
            text-xs font-medium
            text-neutral-700
            mb-1
            transition-colors
          `
        >
          {label}
        </label>
      )}

      <input
        id={id}
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        className`
          w-full
          input-field
          rounded-md
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${hasError ? 'border-red-500' : ''}
          ${hasSuccess ? 'border-green-500' : ''}
          ${!disabled && !hasError && !hasSuccess ? 'border-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0' : ''}
        `
        style={{
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          ...(hasError && {
            boxShadow: '0 0 0 2px rgba(239, 68, 68, 0.1)',
          }),
          ...(hasSuccess && {
            boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.1)',
          }),
        }}
        {...rest}
      />

      {hasError && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export { InputField, InputFieldProps };