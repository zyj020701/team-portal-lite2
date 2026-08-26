import { type HTMLAttributes } from 'react';
import Image from 'next/image';
import { cn } from '@team-portal/utils';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  priority?: boolean;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter((char): char is string => Boolean(char))
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 'md',
  priority = false,
  className,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-primary-100 font-medium text-primary-700 overflow-hidden',
        sizeClasses[size],
        className,
      )}
      title={name}
      role="img"
      aria-label={name}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="40px"
          priority={priority}
          className="object-cover"
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </div>
  );
}
