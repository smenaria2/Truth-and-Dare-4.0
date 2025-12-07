import React from 'react';
import { cn } from '../../lib/utils'; // Assuming you have a utility for combining class names

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', color = 'primary', className, ...props }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-14 h-14 border-6',
  };

  const colorClasses = {
    primary: 'border-b-romantic-600',
    secondary: 'border-b-slate-400',
    white: 'border-b-white',
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-solid",
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};