'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@team-portal/utils';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize;
  error?: boolean;
}

const SIZE_CLASSES: Record<InputSize, string> = {
  sm: 'h-8 px-2.5 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-4 text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, inputSize = 'md', error = false, type = 'text', ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'w-full rounded-md border bg-white text-neutral-900 placeholder:text-neutral-400',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error
          ? 'border-error focus:ring-error/30'
          : 'border-neutral-300 focus:border-primary focus:ring-primary/30',
        SIZE_CLASSES[inputSize],
        className,
      )}
      {...props}
    />
  );
});
