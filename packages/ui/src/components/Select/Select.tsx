'use client';
import { type SelectHTMLAttributes } from 'react';
import { cn } from '@team-portal/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <select
      className={cn(
        'flex h-10 w-full rounded-medium border border-neutral-200 bg-surface px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50',
        className,
      )}
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
