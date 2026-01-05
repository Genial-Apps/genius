import React from 'react';
import { Activity, Mountain } from 'lucide-react';

interface ElevationGaugeProps {
  percentage: number;
  orientation?: 'vertical' | 'horizontal';
}

export const ElevationGauge: React.FC<ElevationGaugeProps> = ({ percentage, orientation = 'vertical' }) => {
  
  if (orientation === 'horizontal') {
    return (
      <div className="w-full flex flex-col gap-1 cursor-help group">
        <div className="flex justify-between items-end px-1">
            <div className="text-[10px] text-secondary surgical-mono uppercase tracking-widest flex items-center gap-1">
                <Mountain size={10} /> Elevation
            </div>
            <div className="flex items-center gap-1 text-[10px] text-accent font-mono">
                <Activity size={10} className="group-hover:animate-pulse" />
                <span>{percentage}%</span>
            </div>
        </div>
        
        <div className="relative h-2 w-full bg-slate-900 overflow-hidden border-y border-slate-800/50">
            {/* Gradient Fill Left-to-Right */}
            <div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary/40 to-primary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(13,148,136,0.5)]"
                style={{ width: `${percentage}%` }}
            />
             {/* Grid overlay */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-full w-[1px] bg-slate-800/50" />
                ))}
            </div>
        </div>
      </div>
    );
  }

  // Vertical (Default / Legacy use)
  return (
    <div className="flex flex-col gap-2 p-4 bg-surface border border-slate-700/50 rounded-lg w-full max-w-[200px] cursor-help">
      <div className="flex items-center justify-between text-xs text-secondary surgical-mono mb-1">
        <span className="flex items-center gap-1">
          <Mountain size={12} /> ELEVATION
        </span>
        <span>{percentage}%</span>
      </div>
      
      <div className="relative h-32 w-full bg-slate-900 rounded-md overflow-hidden border border-slate-800">
        <div 
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/20 to-primary/80 transition-all duration-1000 ease-out"
          style={{ height: `${percentage}%` }}
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="w-full h-[1px] bg-slate-700/30" />
            ))}
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-[10px] text-accent mt-1">
        <Activity size={10} className="animate-pulse" />
        <span className="uppercase tracking-wider">Ascending</span>
      </div>
    </div>
  );
};
