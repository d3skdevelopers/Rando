import React from 'react';

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
      default: 'bg-[#252540] text-white',
      guest: 'bg-gradient-to-r from-[#2E235E] to-[#4A3F8C] text-white',
      student: 'bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#0f0f1a]',
      premium: 'bg-gradient-to-r from-[#FB6962] to-[#FF8C7F] text-white',
      success: 'bg-[#10B981]/20 text-[#10B981]',
      warning: 'bg-[#F59E0B]/20 text-[#F59E0B]',
      danger: 'bg-[#EF4444]/20 text-[#EF4444]',
      info: 'bg-[#3B82F6]/20 text-[#3B82F6]',
      campus: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-xs',
      lg: 'px-4 py-1.5 text-sm',
    };

    const dotColors = {
      default: 'bg-white',
      guest: 'bg-white',
      student: 'bg-[#0f0f1a]',
      premium: 'bg-white',
      success: 'bg-[#10B981]',
      warning: 'bg-[#F59E0B]',
      danger: 'bg-[#EF4444]',
      info: 'bg-[#3B82F6]',
      campus: 'bg-white',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${dot ? 'pl-2.5' : ''} ${className || ''}`}
        {...props}
      >
        {dot && (
          <span
            className={`mr-1.5 h-2 w-2 rounded-full ${dotColors[variant]}`}
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