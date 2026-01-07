import React, { useState } from 'react';
import { useGenius } from '../store/GeniusContext';
import { UserPreferences } from '../types';
import { X, Sliders, Check, Layers, Zap, Clock, Activity, User } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

const questions = [
  {
    id: 'learningStyle',
    label: "Learning Style",
    icon: <Layers size={16} className="text-accent" />,
    options: ['Visual', 'Textual', 'Interactive']
  },
  {
    id: 'motivationTrigger',
    label: "Motivation",
    icon: <Zap size={16} className="text-yellow-400" />,
    options: ['Goal-Oriented', 'Curiosity', 'Fear-of-Missing-Out']
  },
  {
    id: 'attentionSpan',
    label: "Attention Rhythm",
    icon: <Clock size={16} className="text-blue-400" />,
    options: ['Deep Dive', 'Rapid Fire', 'Pomodoro']
  },
  {
    id: 'complexityPreference',
    label: "Complexity Frame",
    icon: <Activity size={16} className="text-green-400" />,
    options: ['First Principles', 'Metaphorical', 'Case Study']
  }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { userState, updatePreferences, updateName } = useGenius();
  
  // Engine State
  const [prefs, setPrefs] = useState<UserPreferences>(userState.preferences);
  const [name, setName] = useState(userState.name);

  const handleSaveEngine = () => {
    updatePreferences(prefs);
    updateName(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900 z-10 p-6 flex justify-between items-center">
            <h2 className="text-xl font-light text-white flex items-center gap-2">
                <Sliders size={20} className="text-primary" /> Engine Calibration
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white">
                <X size={20} />
            </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-sm text-slate-400">
                    These settings adjust how the Genius Engine generates your learning sprints. Changing them will affect future sprints only.
                </div>

                {/* Name Input */}
                <div>
                     <div className="flex items-center gap-2 text-slate-200 font-medium mb-3">
                        <User size={16} className="text-slate-400" /> Designation
                    </div>
                    <input 
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-600 font-mono"
                    />
                </div>

                {questions.map((q) => (
                    <div key={q.id}>
                        <div className="flex items-center gap-2 text-slate-200 font-medium mb-3">
                            {q.icon} {q.label}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {q.options.map((opt) => (
                                <button
                                    key={opt}
                                    // @ts-ignore
                                    onClick={() => setPrefs({ ...prefs, [q.id]: opt })}
                                    className={`
                                        px-3 py-3 rounded-lg text-xs font-semibold border transition-all text-center
                                        // @ts-ignore
                                        ${prefs[q.id] === opt 
                                            ? 'bg-primary/20 border-primary text-primary' 
                                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}
                                    `}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
                
                <button
                    onClick={handleSaveEngine}
                    className="w-full px-6 py-3 bg-primary hover:bg-teal-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg mt-8"
                >
                    <Check size={18} /> SAVE CONFIGURATION
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
