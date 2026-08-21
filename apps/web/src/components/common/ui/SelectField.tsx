import React from 'react';

export interface OptionItem {
  value: string | number;
  label: string | React.ReactNode;
  disabled?: boolean;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options?: OptionItem[];
  searchable?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  label,
  error,
  success,
  disabled,
  placeholder,
  options = [],
  searchable = false,
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
          className="block text-xs font-medium text-neutral-700 mb-1 transition-colors"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        disabled={disabled}
        className="w-full rounded-md input-field"
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
      >
        <option value="" disabled>
          {placeholder || 'Select...'}
        </option>
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
          >
            {typeof opt.label === 'string' ? opt.label : opt.label}
          </option>
        ))}
      </select>

      {hasError && (
        <p className="text-xs text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export { SelectField };