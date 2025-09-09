import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlay && e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="brutal-modal-overlay fixed inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        className={clsx(
          'brutal-modal',
          'relative z-10',
          'bg-white border-3 border-black',
          'shadow-[12px_12px_0px_#000]',
          'max-h-[90vh] overflow-auto',
          'mx-4',
          sizeClasses[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Default header with title and close button */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b-3 border-black bg-gray-50">
            {title && (
              <h2 
                id="modal-title" 
                className="text-xl font-bold uppercase tracking-wide text-black font-[Space_Grotesk]"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-black hover:text-[#ff0080] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff0080] focus:ring-offset-2"
                aria-label="Close modal"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path 
                    strokeLinecap="square" 
                    strokeLinejoin="miter" 
                    d="M6 6l12 12M6 18L18 6" 
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {children}
      </div>
    </div>,
    document.body
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  showCloseButton = true,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'flex items-center justify-between p-6 border-b-3 border-black bg-gray-50',
        className
      )}
      {...props}
    >
      <div className="flex-1">{children}</div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="ml-4 p-2 text-black hover:text-[#ff0080] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#ff0080] focus:ring-offset-2"
          aria-label="Close modal"
        >
          <svg 
            className="w-6 h-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={3}
          >
            <path 
              strokeLinecap="square" 
              strokeLinejoin="miter" 
              d="M6 6l12 12M6 18L18 6" 
            />
          </svg>
        </button>
      )}
    </div>
  );
};

const ModalContent: React.FC<ModalContentProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx('p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 p-6 border-t-3 border-black bg-gray-50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

Modal.displayName = 'Modal';
ModalHeader.displayName = 'ModalHeader';
ModalContent.displayName = 'ModalContent';
ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalHeader, ModalContent, ModalFooter };