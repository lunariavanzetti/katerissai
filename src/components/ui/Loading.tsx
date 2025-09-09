import React from 'react';
import clsx from 'clsx';

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'black' | 'white';
  className?: string;
}

export interface LoadingDotsProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'black' | 'white';
  className?: string;
}

export interface LoadingBarsProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'black' | 'white';
  className?: string;
}

export interface LoadingPulseProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'black' | 'white';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3 border-[2px]',
    sm: 'w-4 h-4 border-[2px]',
    md: 'w-6 h-6 border-[3px]',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-[4px]',
  };

  const colorClasses = {
    primary: 'border-gray-200 border-t-[#ff0080]',
    secondary: 'border-gray-200 border-t-[#00ff00]',
    black: 'border-gray-200 border-t-black',
    white: 'border-gray-600 border-t-white',
  };

  return (
    <div
      className={clsx(
        'loading-spinner inline-block animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-2',
  };

  const colorClasses = {
    primary: 'bg-[#ff0080]',
    secondary: 'bg-[#00ff00]',
    black: 'bg-black',
    white: 'bg-white',
  };

  return (
    <div
      className={clsx(
        'loading-dots inline-flex items-center',
        gapClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            sizeClasses[size],
            colorClasses[color],
            'animate-bounce'
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s',
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const LoadingBars: React.FC<LoadingBarsProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    xs: 'w-1 h-4',
    sm: 'w-1 h-6',
    md: 'w-2 h-8',
    lg: 'w-2 h-10',
  };

  const gapClasses = {
    xs: 'gap-1',
    sm: 'gap-1',
    md: 'gap-1',
    lg: 'gap-2',
  };

  const colorClasses = {
    primary: 'bg-[#ff0080]',
    secondary: 'bg-[#00ff00]',
    black: 'bg-black',
    white: 'bg-white',
  };

  return (
    <div
      className={clsx(
        'inline-flex items-end',
        gapClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={clsx(
            sizeClasses[size],
            colorClasses[color],
            'animate-pulse'
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1.2s',
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

const LoadingPulse: React.FC<LoadingPulseProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
  };

  const colorClasses = {
    primary: 'border-[#ff0080]',
    secondary: 'border-[#00ff00]',
    black: 'border-black',
    white: 'border-white',
  };

  return (
    <div
      className={clsx(
        'relative inline-flex items-center justify-center',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      {/* Outer ring */}
      <div
        className={clsx(
          'absolute inset-0 border-3 animate-ping',
          colorClasses[color]
        )}
        style={{
          animationDuration: '2s',
        }}
      />
      
      {/* Inner ring */}
      <div
        className={clsx(
          'absolute inset-2 border-3 animate-ping',
          colorClasses[color]
        )}
        style={{
          animationDelay: '0.5s',
          animationDuration: '2s',
        }}
      />
      
      {/* Center dot */}
      <div
        className={clsx(
          'w-2 h-2 animate-pulse',
          colorClasses[color].replace('border-', 'bg-')
        )}
      />
      
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Combined Loading component with different variants
export interface LoadingProps {
  variant?: 'spinner' | 'dots' | 'bars' | 'pulse';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'black' | 'white';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  className,
}) => {
  const renderLoadingComponent = () => {
    switch (variant) {
      case 'dots':
        return <LoadingDots size={size} color={color} />;
      case 'bars':
        return <LoadingBars size={size} color={color} />;
      case 'pulse':
        return <LoadingPulse size={size} color={color} />;
      default:
        return <LoadingSpinner size={size} color={color} />;
    }
  };

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3',
        className
      )}
    >
      {renderLoadingComponent()}
      {text && (
        <p className="text-sm font-medium text-black uppercase tracking-wide font-[Space_Grotesk]">
          {text}
        </p>
      )}
    </div>
  );
};

Loading.displayName = 'Loading';
LoadingSpinner.displayName = 'LoadingSpinner';
LoadingDots.displayName = 'LoadingDots';
LoadingBars.displayName = 'LoadingBars';
LoadingPulse.displayName = 'LoadingPulse';

export { 
  Loading, 
  LoadingSpinner, 
  LoadingDots, 
  LoadingBars, 
  LoadingPulse 
};