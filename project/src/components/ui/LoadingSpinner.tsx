import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = 'primary' 
}) => {
  // Size mappings
  const sizeMap = {
    small: 'h-5 w-5',
    medium: 'h-10 w-10',
    large: 'h-16 w-16'
  };

  const ringSize = {
    small: 'h-8 w-8',
    medium: 'h-14 w-14',
    large: 'h-24 w-24'
  };

  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <div className="relative">
        {/* Outer glow ring */}
        <div className={`absolute inset-0 ${ringSize[size]} -m-2 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 blur-lg opacity-30 animate-pulse`}></div>
        
        {/* Spinner */}
        <div className="relative">
          <svg 
            className={`animate-spin ${sizeMap[size]} ${color === 'primary' ? 'text-primary-600' : 'text-white'}`} 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-20" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="3"
            ></circle>
            <path 
              className="opacity-90" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          
          {/* Inner dot */}
          <div className={`absolute inset-0 flex items-center justify-center`}>
            <div className={`${size === 'large' ? 'w-3 h-3' : size === 'medium' ? 'w-2 h-2' : 'w-1.5 h-1.5'} rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 animate-pulse`}></div>
          </div>
        </div>
      </div>
      
      {size === 'large' && (
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading...</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
