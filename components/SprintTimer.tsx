import React from 'react';
import { useGenius } from '../store/GeniusContext';
import { Clock } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';

export const SprintTimer: React.FC = () => {
  const { timer, status, activeUnit } = useGenius();
  
  // Calculate percentage for progress bar (default 10 mins or unit duration)
  const totalTime = activeUnit ? activeUnit.duration * 60 : 600;
  const percentage = Math.min(100, Math.max(0, (timer / totalTime) * 100));

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Dynamic border color based on urgency or state
  const borderColor = timer < 120 ? 'border-accent' : 'border-slate-700';

  return (
    <InfoTooltip label="Time remaining in current Sprint">
      <div className={`
        relative flex items-center justify-center w-32 h-12 
        bg-slate-900 border ${borderColor} rounded-md overflow-hidden
        shadow-[0_0_15px_-3px_rgba(0,0,0,0.3)]
      `}>
        {/* Background Fill Bar */}
        <div 
            className="absolute top-0 bottom-0 left-0 bg-primary/20 transition-all duration-1000 ease-linear"
            style={{ width: `${percentage}%` }}
        ></div>

        <div className="relative z-10 flex items-center">
            <Clock size={16} className="text-secondary mr-2" />
            <span className="text-xl font-mono text-slate-100 font-bold tracking-widest">
            {formatTime(timer)}
            </span>
        </div>
        
        {/* Active Pulse Indicator */}
        {status === 'FOCUS' && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3 z-20">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        )}
      </div>
    </InfoTooltip>
  );
};
