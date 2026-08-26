'use client';
import { type ReactNode, useState } from 'react';
import { cn } from '@team-portal/utils';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({
  items,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value ?? '');
  const activeValue = controlledValue ?? internalValue;

  const handleChange = (val: string) => {
    if (controlledValue === undefined) setInternalValue(val);
    onValueChange?.(val);
  };

  const activeItem = items.find((item) => item.value === activeValue);

  return (
    <div className={className}>
      <div role="tablist" className="flex border-b border-neutral-200">
        {items.map((item) => (
          <button
            key={item.value}
            id={`tab-${item.value}`}
            role="tab"
            type="button"
            aria-selected={item.value === activeValue}
            aria-controls={`tabpanel-${item.value}`}
            tabIndex={item.value === activeValue ? 0 : -1}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
              item.value === activeValue
                ? 'border-b-2 border-primary-500 text-primary-600'
                : 'text-neutral-500 hover:text-neutral-900',
            )}
            onClick={() => handleChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        id={`tabpanel-${activeValue}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeValue}`}
        className="pt-4"
      >
        {activeItem?.content}
      </div>
    </div>
  );
}
