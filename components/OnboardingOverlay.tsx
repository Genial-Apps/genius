import React, { useState } from 'react';
import { useGenius, DEFAULT_PREFS } from '../store/GeniusContext';
import { UserPreferences } from '../types';
import { Zap, ChevronRight, Check, BrainCircuit, Activity, Clock, Layers, User } from 'lucide-react';

const introStep = {
    title: "Welcome to Genius Academy 1.0",
    desc: "Before we begin, we need to calibrate the engine to your cognitive signature. This allows the AI to tailor content density, structure, and pacing to your specific neuro-type.",
    insight: "We don't just present content; we reshape it to fit your brain's preferred protocol.",
    icon: <BrainCircuit size={48} className="text-primary" />
};

const questions = [
  {
    id: 'learningStyle',
    label: "Learning Style",
    question: "How do you prefer to digest complex information?",
    insight: "The Engine will dynamically re-render content formats—prioritizing diagrams for visual learners or structured synthesis for textual processors.",
    icon: <Layers size={24} className="text-accent" />,
    options: [
      { value: 'Visual', label: 'Visual', desc: 'Diagrams, Spatial Maps, Images' },
      { value: 'Textual', label: 'Textual', desc: 'Dense readings, Lists, Essays' },
      { value: 'Interactive', label: 'Interactive', desc: 'Quizzes, Socratic Dialogue' }
    ]
  },
  {
    id: 'motivationTrigger',
    label: "Motivation",
    question: "What fuels your focus the most?",
    insight: "We formulate the 'Priming Bridge' of every sprint to target your specific dopamine triggers, increasing engagement retention.",
    icon: <Zap size={24} className="text-yellow-400" />,
    options: [
      { value: 'Goal-Oriented', label: 'Goal-Oriented', desc: 'Achieving a specific outcome' },
      { value: 'Curiosity', label: 'Curiosity', desc: 'Exploring novel concepts' },
      { value: 'Fear-of-Missing-Out', label: 'F.O.M.O.', desc: 'Staying ahead of the curve' }
    ]
  },
  {
    id: 'attentionSpan',
    label: "Attention",
    question: "What is your preferred focus rhythm?",
    insight: "Sprint durations and the frequency of 'Zen Pulse' consolidation breaks are adjusted to match your cognitive endurance.",
    icon: <Clock size={24} className="text-blue-400" />,
    options: [
      { value: 'Deep Dive', label: 'Deep Dive', desc: 'Long, uninterrupted sessions' },
      { value: 'Rapid Fire', label: 'Rapid Fire', desc: 'Quick, high-intensity bursts' },
      { value: 'Pomodoro', label: 'Pomodoro', desc: 'Structured 25m blocks' }
    ]
  },
  {
    id: 'complexityPreference',
    label: "Complexity",
    question: "How should we frame new concepts?",
    insight: "We scaffold new information differently based on this setting—building from axioms up, or using analogies to bridge from known to unknown.",
    icon: <Activity size={24} className="text-green-400" />,
    options: [
      { value: 'First Principles', label: 'First Principles', desc: 'Fundamental truths up' },
      { value: 'Metaphorical', label: 'Metaphorical', desc: 'Analogies to known concepts' },
      { value: 'Case Study', label: 'Case Study', desc: 'Real-world examples' }
    ]
  }
];

export const OnboardingOverlay: React.FC = () => {
  const { completeOnboarding, updatePreferences, updateName } = useGenius();
  const [stepIndex, setStepIndex] = useState(-1); // -1 is Intro
  const [prefs, setPrefs] = useState<any>({});
  const [name, setName] = useState('');

  const handleNext = () => {
    if (stepIndex === -1) {
        if (!name.trim()) return;
        updateName(name);
        setStepIndex(0);
        return;
    }

    if (stepIndex < questions.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      updatePreferences(prefs as UserPreferences);
      completeOnboarding();
    }
  };

  const handleSkip = () => {
      // Set Defaults
      updateName(name || "Traveler");
      updatePreferences(DEFAULT_PREFS);
      completeOnboarding();
  };

  const handleOptionSelect = (key: string, value: string) => {
      setPrefs({ ...prefs, [key]: value });
  };

  const currentQ = stepIndex >= 0 ? questions[stepIndex] : null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="bg-surface border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 z-10">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((stepIndex + 2) / (questions.length + 1)) * 100}%` }}
          />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 mt-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          <div className="flex flex-col justify-center min-h-[40vh]">
            
            {stepIndex === -1 ? (
               // INTRO SCREEN
               <div className="text-center animate-in slide-in-from-bottom-4 fade-in duration-500 flex flex-col items-center">
                   <div className="bg-slate-900 p-6 rounded-full inline-block mb-8 border border-slate-800 shadow-lg shrink-0">
                      {introStep.icon}
                   </div>
                   <h2 className="text-2xl md:text-3xl font-light text-white mb-4">{introStep.title}</h2>
                   <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-lg mb-8">{introStep.desc}</p>
                   
                   <div className="w-full max-w-sm mb-6">
                       <label className="block text-xs surgical-mono text-secondary mb-2 uppercase text-left">Your Designation</label>
                       <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name..."
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-600 font-mono"
                                autoFocus
                            />
                       </div>
                   </div>

                   <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg max-w-lg w-full">
                      <p className="text-primary text-sm font-medium">{introStep.insight}</p>
                   </div>
               </div>
            ) : currentQ ? (
               // QUESTIONS
               <div key={currentQ.id} className="w-full animate-in slide-in-from-right-8 fade-in duration-300">
                   <div className="flex items-center gap-3 mb-4 text-primary uppercase text-xs font-bold tracking-widest">
                      {currentQ.icon} {currentQ.label}
                   </div>
                   <h2 className="text-2xl md:text-3xl font-light text-white mb-8">{currentQ.question}</h2>
                   
                   <div className="grid gap-4 mb-8">
                      {currentQ.options.map((opt) => (
                          <button
                              key={opt.value}
                              onClick={() => handleOptionSelect(currentQ.id, opt.value)}
                              className={`
                                  w-full p-4 md:p-5 rounded-xl border text-left transition-all duration-200 group relative overflow-hidden
                                  ${prefs[currentQ.id] === opt.value 
                                      ? 'bg-slate-800 border-primary text-white shadow-lg' 
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-slate-800'}
                              `}
                          >
                              <div className="flex justify-between items-center relative z-10">
                                  <span className="font-semibold text-lg">{opt.label}</span>
                                  {prefs[currentQ.id] === opt.value && <Check size={20} className="text-primary" />}
                              </div>
                              <span className="text-sm text-slate-500 group-hover:text-slate-400 relative z-10 block mt-1">{opt.desc}</span>
                              
                              {/* Selection Highlight */}
                              {prefs[currentQ.id] === opt.value && (
                                  <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                              )}
                          </button>
                      ))}
                   </div>

                   {/* Unique Insight Statement */}
                   <div className="mt-6 flex items-start gap-3 text-slate-500 text-sm italic border-t border-slate-800 pt-4">
                      <Zap size={14} className="mt-1 shrink-0 text-accent" />
                      <p>{currentQ.insight}</p>
                   </div>
               </div>
            ) : null}
          </div>
        </div>

        {/* Footer Area with Button */}
        <div className="p-6 border-t border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-surface z-20 shrink-0">
            {stepIndex === -1 ? (
                <button 
                    onClick={handleSkip}
                    className="text-xs text-slate-500 hover:text-white uppercase tracking-wider font-bold transition-colors order-2 md:order-1"
                >
                    Skip Calibration
                </button>
            ) : (
                <div className="hidden md:block" /> // Spacer
            )}

            <button
                onClick={handleNext}
                disabled={(stepIndex === -1 && !name.trim()) || (stepIndex >= 0 && !prefs[questions[stepIndex].id])}
                className={`
                    w-full md:w-auto px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg whitespace-nowrap order-1 md:order-2
                    ${((stepIndex === -1 && !name.trim()) || (stepIndex >= 0 && !prefs[questions[stepIndex].id]))
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                        : 'bg-primary hover:bg-teal-500 text-white shadow-teal-900/20 transform hover:-translate-y-0.5'}
                `}
            >
                {stepIndex === -1 ? (
                    <>Calibrate Engine <ChevronRight size={18} /></>
                ) : stepIndex === questions.length - 1 ? (
                    <>Finalize Profile <Check size={18} /></>
                ) : (
                    <>Next Step <ChevronRight size={18} /></>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};