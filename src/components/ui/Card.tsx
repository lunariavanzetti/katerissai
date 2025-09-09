import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'pink';
  hover?: boolean;
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hover = true, children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          // Base brutal card styles
          'brutal-card',
          'bg-white border-3 border-black transition-all duration-200',
          
          // Variant styles
          {
            'shadow-[4px_4px_0px_#000]': variant === 'default',
            'brutal-card-pink border-[#ff0080] shadow-[4px_4px_0px_#ff0080]': variant === 'pink',
          },
          
          // Hover effects
          {
            'hover:transform hover:translate-x-[-2px] hover:translate-y-[-2px]': hover,
            'hover:shadow-[8px_8px_0px_#000]': hover && variant === 'default',
            'hover:shadow-[8px_8px_0px_#ff0080]': hover && variant === 'pink',
          },
          
          className
        )}
        role="article"
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'p-6 border-b-3 border-black bg-gray-50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('p-6', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'p-6 border-t-3 border-black bg-gray-50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };