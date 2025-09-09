import React from 'react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    children, 
    className,
    loading = false,
    fullWidth = false,
    disabled,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-6 py-4 text-sm',
      lg: 'px-8 py-6 text-base',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          // Base button styles
          'btn',
          'inline-flex items-center justify-center',
          'font-bold uppercase tracking-wide',
          'transition-all duration-200 ease-in-out',
          'border-3 border-black',
          'font-[Space_Grotesk]',
          'focus:outline-none focus:ring-4 focus:ring-[#ff0080] focus:ring-offset-2',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
          
          // Variant styles
          {
            'btn-primary bg-[#ff0080] text-white shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000] hover:transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-[#ff69b4] active:transform-none active:shadow-[2px_2px_0px_#000]': 
              variant === 'primary',
            'btn-secondary bg-white text-[#ff0080] border-[#ff0080] shadow-[4px_4px_0px_#ff0080] hover:shadow-[6px_6px_0px_#ff0080] hover:transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-gray-100': 
              variant === 'secondary',
            'btn-outline bg-transparent text-black border-black shadow-[4px_4px_0px_#000] hover:bg-black hover:text-white hover:transform hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000]': 
              variant === 'outline',
            'btn-ghost bg-transparent text-[#ff0080] border-none shadow-none underline underline-offset-4 decoration-2 hover:text-[#ff69b4] hover:no-underline': 
              variant === 'ghost',
          },
          
          // Size classes
          sizeClasses[size],
          
          // Full width
          { 'w-full': fullWidth },
          
          className
        )}
        disabled={disabled || loading}
        aria-label={typeof children === 'string' ? children : undefined}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="loading-spinner w-4 h-4 border-2 border-current border-t-transparent rounded-none animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };