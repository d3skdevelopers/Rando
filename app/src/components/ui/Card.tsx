import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'gold' | 'glass' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hover, glow, children, ...props }, ref) => {
    
    const baseStyles = 'rounded-xl border transition-all duration-200';
    
    const variants = {
      default: 'bg-[#1a1a2e] border-[#2d2d4a]',
      elevated: 'bg-[#1a1a2e] border-[#2d2d4a] shadow-lg',
      gold: 'bg-gradient-to-br from-[#1a1a2e] to-[#151525] border-2 border-[#D4AF37] shadow-lg shadow-yellow-500/10',
      glass: 'bg-[#1a1a2e]/80 backdrop-blur-sm border border-white/10',
      gradient: 'bg-gradient-to-br from-[#2E235E]/20 to-[#D4AF37]/10 border-[#2d2d4a]',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hover ? 'hover:shadow-lg hover:border-[#D4AF37]/30 hover:-translate-y-1 cursor-pointer' : ''} ${className || ''}`}
        {...props}
      >
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E235E]/10 to-[#D4AF37]/10 rounded-xl blur-xl -z-10" />
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 ${className || ''}`}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-2xl font-bold leading-none tracking-tight ${className || ''}`}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-[#B8B8D1] ${className || ''}`}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={`pt-0 ${className || ''}`} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex items-center pt-6 ${className || ''}`}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };