import React from 'react';
import clsx from 'clsx';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label,
    error,
    success,
    helperText,
    size = 'md',
    fullWidth = true,
    className,
    id,
    ...props 
  }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-4 text-base',
      lg: 'px-6 py-6 text-lg',
    };

    return (
      <div className={clsx('space-y-2', { 'w-full': fullWidth })}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-bold uppercase tracking-wide text-black"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              // Base brutal input styles
              'brutal-input',
              'border-3 border-black bg-white',
              'font-[Space_Grotesk] font-medium text-black',
              'transition-all duration-200',
              'shadow-[4px_4px_0px_#000]',
              'placeholder:text-gray-500 placeholder:font-normal',
              
              // Focus states
              'focus:outline-none focus:border-[#ff0080] focus:shadow-[4px_4px_0px_#ff0080] focus:transform focus:translate-x-[-2px] focus:translate-y-[-2px]',
              
              // Error states
              {
                'border-red-500 shadow-[4px_4px_0px_#ff0000] focus:border-red-500 focus:shadow-[4px_4px_0px_#ff0000]': error,
                'border-[#00ff00] shadow-[4px_4px_0px_#00ff00] focus:border-[#00ff00] focus:shadow-[4px_4px_0px_#00ff00]': success,
              },
              
              // Size classes
              sizeClasses[size],
              
              // Full width
              { 'w-full': fullWidth },
              
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : 
              success ? `${inputId}-success` : 
              helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          
          {/* Error icon */}
          {error && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg 
                className="w-5 h-5 text-red-500" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          )}
          
          {/* Success icon */}
          {success && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg 
                className="w-5 h-5 text-[#00ff00]" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          )}
        </div>
        
        {/* Helper/Error/Success text */}
        {error && (
          <p 
            id={`${inputId}-error`} 
            className="text-sm font-medium text-red-500 uppercase tracking-wide"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {success && !error && (
          <p 
            id={`${inputId}-success`} 
            className="text-sm font-medium text-[#00ff00] uppercase tracking-wide"
          >
            {success}
          </p>
        )}
        
        {helperText && !error && !success && (
          <p 
            id={`${inputId}-helper`} 
            className="text-sm text-gray-600"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label,
    error,
    success,
    helperText,
    size = 'md',
    fullWidth = true,
    className,
    id,
    rows = 4,
    ...props 
  }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-4 text-base',
      lg: 'px-6 py-6 text-lg',
    };

    return (
      <div className={clsx('space-y-2', { 'w-full': fullWidth })}>
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-bold uppercase tracking-wide text-black"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            rows={rows}
            className={clsx(
              // Base brutal textarea styles
              'brutal-input brutal-textarea',
              'border-3 border-black bg-white',
              'font-[Space_Grotesk] font-medium text-black',
              'transition-all duration-200',
              'shadow-[4px_4px_0px_#000]',
              'placeholder:text-gray-500 placeholder:font-normal',
              'resize-vertical',
              
              // Focus states
              'focus:outline-none focus:border-[#ff0080] focus:shadow-[4px_4px_0px_#ff0080] focus:transform focus:translate-x-[-2px] focus:translate-y-[-2px]',
              
              // Error states
              {
                'border-red-500 shadow-[4px_4px_0px_#ff0000] focus:border-red-500 focus:shadow-[4px_4px_0px_#ff0000]': error,
                'border-[#00ff00] shadow-[4px_4px_0px_#00ff00] focus:border-[#00ff00] focus:shadow-[4px_4px_0px_#00ff00]': success,
              },
              
              // Size classes
              sizeClasses[size],
              
              // Full width
              { 'w-full': fullWidth },
              
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${textareaId}-error` : 
              success ? `${textareaId}-success` : 
              helperText ? `${textareaId}-helper` : undefined
            }
            {...props}
          />
        </div>
        
        {/* Helper/Error/Success text */}
        {error && (
          <p 
            id={`${textareaId}-error`} 
            className="text-sm font-medium text-red-500 uppercase tracking-wide"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {success && !error && (
          <p 
            id={`${textareaId}-success`} 
            className="text-sm font-medium text-[#00ff00] uppercase tracking-wide"
          >
            {success}
          </p>
        )}
        
        {helperText && !error && !success && (
          <p 
            id={`${textareaId}-helper`} 
            className="text-sm text-gray-600"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
Textarea.displayName = 'Textarea';

export { Input, Textarea };