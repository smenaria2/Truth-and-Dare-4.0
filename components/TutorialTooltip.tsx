

import React, { useState } from 'react';

interface TutorialTooltipProps {
  content: string;
  children: React.ReactNode;
  isVisible: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const TutorialTooltip: React.FC<TutorialTooltipProps> = ({ 
  content, 
  children, 
  isVisible, 
  position = 'bottom',
  className = ''
}) => {
  const [show, setShow] = useState(false);
  
  if (!isVisible) return <div className={className}>{children}</div>;

  return (
    <div 
      className={`relative inline-block ${className}`} 
      onMouseEnter={() => setShow(true)} 
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {/* Pulsing Indicator */}
      <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10 pointer-events-none">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
      </span>
      
      {/* Tooltip Popup */}
      {show && (
        <div className={`absolute z-[100] w-48 p-3 bg-blue-600/95 backdrop-blur text-white text-xs rounded-xl shadow-xl transition-all duration-200 ${
          position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
          position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
          position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
          'left-full top-1/2 -translate-y-1/2 ml-2'
        }`}>
          {content}
          {/* Arrow */}
          <div className={`absolute w-0 h-0 border-4 border-transparent ${
            position === 'bottom' ? '-top-2 left-1/2 -translate-x-1/2 border-b-blue-600/95' :
            position === 'top' ? '-bottom-2 left-1/2 -translate-x-1/2 border-t-blue-600/95' :
            position === 'left' ? '-right-2 top-1/2 -translate-y-1/2 border-l-blue-600/95' :
            '-left-2 top-1/2 -translate-y-1/2 border-r-blue-600/95'
          }`}></div>
        </div>
      )}
    </div>
  );
};