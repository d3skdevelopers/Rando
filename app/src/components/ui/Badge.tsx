// app/src/components/ui/Badge.tsx - SIMPLIFIED
import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'guest' | 'student' | 'premium' | 'success' | 'warning' | 'danger' | 'info' | 'campus';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  leftIcon?: React.ReactNode;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, leftIcon, children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors';
    
    const variants = {
      default: 'bg-rando-input text-text-primary',
      guest: 'bg-gradient-to-r from-rando-purple to-rando-purple-600 text-white',
      student: 'bg-gradient-to-r from-rando-gold to-rando-gold-600 text-rando-bg',
      premium: 'bg-gradient-to-r from-rando-coral to-rando-coral-600 text-white',
      success: 'bg-success/20 text-success',
      warning: 'bg-warning/20 text-warning',
      danger: 'bg-danger/20 text-danger',
      info: 'bg-info/20 text-info',
      campus: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-4 py-1.5 text-sm',
    };

    const dotColors = {
      default: 'bg-text-primary',
      guest: 'bg-white',
      student: 'bg-rando-bg',
      premium: 'bg-white',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      info: 'bg-info',
      campus: 'bg-white',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], dot && 'pl-2.5', className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              'mr-1.5 h-2 w-2 rounded-full',
              dotColors[variant]
            )}
          />
        )}
        {leftIcon && <span className="mr-1.5">{leftIcon}</span>}
        {children}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };