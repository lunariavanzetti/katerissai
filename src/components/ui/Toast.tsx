import React from 'react';
import toast, { 
  Toaster, 
  ToastOptions, 
  Toast as HotToast,
  resolveValue 
} from 'react-hot-toast';
import clsx from 'clsx';

export interface ToastProps {
  t: HotToast;
}

export interface CustomToastOptions extends ToastOptions {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
}

// Custom Toast Component
const CustomToast: React.FC<ToastProps> = ({ t }) => {
  const message = resolveValue(t.message, t);
  
  // Determine variant from toast type or custom data
  const variant = (t as any).variant || 
    (t.type === 'success' ? 'success' : 
     t.type === 'error' ? 'error' : 'info');

  const variantClasses = {
    success: 'bg-[#00ff00] text-black border-black shadow-[4px_4px_0px_#000]',
    error: 'bg-red-500 text-white border-black shadow-[4px_4px_0px_#000]',
    warning: 'bg-yellow-400 text-black border-black shadow-[4px_4px_0px_#000]',
    info: 'bg-[#ff0080] text-white border-black shadow-[4px_4px_0px_#000]',
  };

  const iconMap = {
    success: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div
      className={clsx(
        'brutal-toast',
        'flex items-center gap-3 p-4',
        'border-3 font-[Space_Grotesk] font-bold',
        'uppercase tracking-wide text-sm',
        'transform transition-all duration-200',
        variantClasses[variant],
        {
          'animate-in slide-in-from-top-5': t.visible,
          'animate-out slide-out-to-top-5': !t.visible,
        }
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {iconMap[variant]}
      </div>

      {/* Content */}
      <div className="flex-1">
        {(t as any).title && (
          <div className="font-black text-xs mb-1 opacity-90">
            {(t as any).title}
          </div>
        )}
        <div>{message}</div>
      </div>

      {/* Close button */}
      <button
        onClick={() => toast.dismiss(t.id)}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-current"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Toast Provider Component
const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerClassName="z-50"
      toastOptions={{
        duration: 5000,
        style: {},
        className: '',
        success: {
          iconTheme: {
            primary: '#00ff00',
            secondary: '#000',
          },
        },
        error: {
          iconTheme: {
            primary: '#ff0000',
            secondary: '#fff',
          },
        },
      }}
    >
      {(t) => <CustomToast t={t} />}
    </Toaster>
  );
};

// Helper functions for different toast types
export const showToast = {
  success: (message: string, options?: CustomToastOptions) =>
    toast.custom(
      (t) => <CustomToast t={{ ...t, message, variant: 'success', ...options }} />,
      { ...options, id: options?.id }
    ),

  error: (message: string, options?: CustomToastOptions) =>
    toast.custom(
      (t) => <CustomToast t={{ ...t, message, variant: 'error', ...options }} />,
      { ...options, id: options?.id }
    ),

  warning: (message: string, options?: CustomToastOptions) =>
    toast.custom(
      (t) => <CustomToast t={{ ...t, message, variant: 'warning', ...options }} />,
      { ...options, id: options?.id }
    ),

  info: (message: string, options?: CustomToastOptions) =>
    toast.custom(
      (t) => <CustomToast t={{ ...t, message, variant: 'info', ...options }} />,
      { ...options, id: options?.id }
    ),

  // Promise helper for async operations
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    toastOptions?: CustomToastOptions
  ) =>
    toast.promise(promise, options, toastOptions),

  // Dismiss helpers
  dismiss: (toastId?: string) => toast.dismiss(toastId),
  remove: (toastId?: string) => toast.remove(toastId),
};

// Hook for using toast in components
export const useToast = () => {
  return showToast;
};

ToastProvider.displayName = 'ToastProvider';

export { ToastProvider, CustomToast };