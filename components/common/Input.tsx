import React from 'react';
import { cn } from '../../lib/utils'; // Assuming you have a utility for combining class names

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Add any specific props if needed
}

export const Input: React.FC<InputProps> = ({ className, ...props }) => {
  const baseStyles = 'w-full p-3 border rounded-lg focus:outline-none focus:ring-2 text-lg bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-romantic-500';

  return (
    <input
      className={cn(baseStyles, className)}
      {...props}
    />
  );
};