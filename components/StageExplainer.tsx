import React from 'react';
import { useGenius } from '../store/GeniusContext';
import { X, Info } from 'lucide-react';

interface StageExplainerProps {
    id: string;
    title: string;
    children: React.ReactNode;
    className?: string;
}

export const StageExplainer: React.FC<StageExplainerProps> = ({ id, title, children, className = '' }) => {
    const { userState, dismissExplainer } = useGenius();
    
    if (userState.dismissedExplainers.includes(id)) return null;

    return (
        <div className={`bg-slate-900/80 border border-primary/20 p-4 rounded-lg relative backdrop-blur-sm animate-in fade-in slide-in-from-top-2 mb-6 z-10 ${className}`}>
            <button 
                onClick={() => dismissExplainer(id)}
                className="absolute top-2 right-2 p-2 -mr-2 -mt-2 text-slate-500 hover:text-white transition-colors z-50"
                title="Dismiss"
            >
                <X size={16} />
            </button>
            <div className="flex gap-3">
                <div className="mt-0.5 text-primary shrink-0">
                    <Info size={18} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-200 mb-1">{title}</h4>
                    <div className="text-xs text-slate-400 leading-relaxed">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};