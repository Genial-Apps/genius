import React, { useState, useRef } from 'react';

interface InfoTooltipProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const InfoTooltip: React.FC<InfoTooltipProps> = ({ label, children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // If element is too close to top (e.g. < 60px), show tooltip below
      if (rect.top < 60) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
    setIsVisible(true);
  };

  const toggleVisibility = (e: React.MouseEvent) => {
     // For touch devices or click interactions
     if (!isVisible) {
         handleMouseEnter();
     } else {
         setIsVisible(false);
     }
  };

  return (
    <div 
      ref={triggerRef}
      className={`relative cursor-help ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
      onClick={toggleVisibility}
    >
      {children}
      {isVisible && (
        <div 
            className={`
                absolute z-[60] left-1/2 -translate-x-1/2 px-3 py-2 
                bg-slate-800 border border-slate-700 text-slate-200 text-xs 
                rounded-md shadow-xl whitespace-nowrap pointer-events-none
                animate-in fade-in zoom-in-95 duration-200
                ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            `}
        >
          {label}
          {/* Arrow */}
          <div 
            className={`
                absolute left-1/2 -translate-x-1/2 w-0 h-0 
                border-4 border-transparent
                ${position === 'top' ? 'border-t-slate-700 top-full' : 'border-b-slate-700 bottom-full'}
            `}
          ></div>
        </div>
      )}
    </div>
  );
};