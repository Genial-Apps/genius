import React, { useState } from 'react';
import { useGenius } from '../store/GeniusContext';
import { Search, ChevronRight, Settings as SettingsIcon, Layers, PlayCircle, CheckCircle, Activity, ChevronDown, Check, Plus, Target, ArrowRight } from 'lucide-react';
import { ElevationGauge } from '../components/ElevationGauge';
import { InfoTooltip } from '../components/InfoTooltip';
import { SettingsModal } from '../components/SettingsModal';
import { LearningProgram } from '../types';

// Trajectory Visualization (7 steps)
const TrajectoryVisualizer: React.FC<{ program: LearningProgram }> = ({ program }) => {
    return (
        <div className="relative h-24 w-full flex items-center justify-between px-2 md:px-8 mt-6">
            {/* Connecting Line */}
            <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-800 -z-0"></div>
            <div 
                className="absolute left-4 top-1/2 h-0.5 bg-primary transition-all duration-500 -z-0" 
                style={{ width: `${(program.currentSessionIndex / 6) * 100}%` }} 
            ></div>

            {[...Array(7)].map((_, i) => {
                const isCompleted = i < program.currentSessionIndex;
                const isCurrent = i === program.currentSessionIndex;
                const isFuture = i > program.currentSessionIndex;
                
                return (
                    <InfoTooltip key={i} label={program.syllabus[i] || `Session ${i+1}`}>
                        <div className={`
                            relative z-10 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 transition-all duration-300
                            ${isCompleted ? 'bg-primary border-primary' : ''}
                            ${isCurrent ? 'bg-slate-900 border-primary scale-150 shadow-[0_0_10px_rgba(13,148,136,0.8)]' : ''}
                            ${isFuture ? 'bg-slate-900 border-slate-700' : ''}
                        `}>
                            {isCurrent && (
                                <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
                            )}
                        </div>
                    </InfoTooltip>
                );
            })}
        </div>
    );
};

const ProgramCard: React.FC<{ program: LearningProgram, onResume: (id: string) => void, isProcessing: boolean }> = ({ program, onResume, isProcessing }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Completed sessions are index 0 up to currentSessionIndex - 1
    const completedSessions = program.syllabus.slice(0, program.currentSessionIndex);

    return (
        <div className="bg-surface border border-slate-700 rounded-xl p-6 shadow-xl relative overflow-hidden group hover:border-primary/50 transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Layers size={100} />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl md:text-2xl font-light text-white mb-1">{program.topic}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">
                            Session {Math.min(program.currentSessionIndex + 1, 7)} of 7 • {Math.round(program.progress)}% Complete
                        </p>
                    </div>
                    {program.status === 'ACTIVE' && (
                        <button 
                            onClick={() => onResume(program.id)}
                            disabled={isProcessing}
                            className="bg-primary hover:bg-teal-500 text-white p-3 rounded-full shadow-lg shadow-teal-900/50 transition-transform transform hover:scale-105"
                        >
                            {isProcessing ? <div className="animate-spin h-6 w-6 border-2 border-white rounded-full border-t-transparent" /> : <PlayCircle size={24} />}
                        </button>
                    )}
                    {program.status === 'COMPLETED' && (
                        <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded-full border border-emerald-500/20">
                            <Check size={24} />
                        </div>
                    )}
                </div>
                
                {program.status === 'ACTIVE' && (
                    <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-800">
                        <span className="text-xs text-secondary uppercase block mb-1">Next Objective</span>
                        <span className="text-slate-200 font-medium">
                            {program.syllabus[program.currentSessionIndex] || "Loading Syllabus..."}
                        </span>
                    </div>
                )}

                <TrajectoryVisualizer program={program} />

                {/* Completed Objectives Accordion */}
                {completedSessions.length > 0 && (
                    <div className="mt-6 border-t border-slate-800 pt-4">
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center gap-2 text-xs text-slate-500 hover:text-white uppercase tracking-widest w-full"
                        >
                            {isExpanded ? <ChevronDown size={14} className="rotate-180" /> : <ChevronRight size={14} />}
                            {isExpanded ? 'Hide Completed Objectives' : `Show ${completedSessions.length} Completed Objectives`}
                        </button>
                        
                        {isExpanded && (
                            <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200 pl-2 border-l border-slate-800">
                                {completedSessions.map((title, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                                        <CheckCircle size={12} className="text-primary/70" />
                                        <span>{title}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
  const { initializeProgram, resumeProgram, programs, userState, toggleDevMode, complexityLevel, setComplexityLevel, setDeveloperModalOpen, isDevMode, isTestingMode } = useGenius();
  const [topicInput, setTopicInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const activePrograms = programs.filter(p => p.status === 'ACTIVE');
  const completedPrograms = programs.filter(p => p.status === 'COMPLETED');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicInput) return;
    setIsProcessing(true);
    await initializeProgram(topicInput);
  };

  const handleResume = async (programId: string) => {
      setIsProcessing(true);
      await resumeProgram(programId);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center">
      
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Edge-to-Edge Header Area */}
      <header className="w-full bg-background/95 backdrop-blur z-50 border-b border-slate-800 sticky top-0">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
             <InfoTooltip label="Platform Name (Double Click for Dev Tools)">
              <div onDoubleClick={(e) => { e.stopPropagation(); setDeveloperModalOpen(true); }} className="cursor-default select-none">
                <h1 className="text-2xl md:text-3xl font-light tracking-tight">
                  Genius<span className="font-bold text-primary">Academy</span>
                </h1>
                <p className="text-secondary surgical-mono text-[10px] uppercase tracking-widest">
                  Cognitive Accelerator v1.0
                </p>
              </div>
            </InfoTooltip>

            <div className="flex items-center gap-4">
                {(isDevMode || isTestingMode) && (
                    <span className="text-[10px] font-bold uppercase bg-accent/20 text-accent px-2 py-0.5 rounded border border-accent/30 animate-pulse">
                        {isTestingMode ? 'TEST MODE' : 'DEV MODE'}
                    </span>
                )}
                <button 
                    onClick={() => setShowSettings(true)}
                    className="p-3 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative"
                    title="Engine Settings"
                >
                    <SettingsIcon size={20} />
                </button>
            </div>
        </div>
        
        {/* Horizontal Elevation Gauge */}
        <div className="w-full border-t border-slate-800/50">
            <div className="max-w-4xl mx-auto px-6">
                <InfoTooltip label="Current Mastery Elevation" className="w-full">
                    <ElevationGauge percentage={userState.elevation} orientation="horizontal" />
                </InfoTooltip>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-scroll-container" className="w-full max-w-4xl px-4 md:px-6 py-8 md:py-12 flex-1 flex flex-col overflow-y-auto scrollbar-hide">
        
        {/* HERO / ENGAGING BLOCK */}
        {!isCreatingNew && (
            <div className="mb-12 text-center animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
                     <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Target size={120} />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-light text-white mb-4">Mission Control</h2>
                    <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                        Ready to accelerate your cognitive trajectory? Initialize a new 10-minute mastery sprint or continue an active protocol.
                    </p>
                    <button 
                        onClick={() => setIsCreatingNew(true)}
                        className="bg-primary hover:bg-teal-500 text-white px-8 py-4 rounded-xl font-bold tracking-wide flex items-center justify-center gap-2 mx-auto transition-transform hover:scale-105 shadow-lg shadow-teal-900/30"
                    >
                        <Plus size={20} /> INITIALIZE PROTOCOL
                    </button>
                </div>
            </div>
        )}

        {/* CREATE NEW PROGRAM FORM (Expanded Overlay) */}
        {isCreatingNew && (
            <div className="mb-12 animate-in zoom-in fade-in duration-300">
                 <button onClick={() => setIsCreatingNew(false)} className="mb-4 text-xs text-slate-500 hover:text-white flex items-center gap-1 mx-auto">
                    <ChevronRight size={12} className="rotate-180" /> Back to Mission Control
                </button>

                <div className="bg-surface border border-slate-700 p-6 md:p-8 rounded-xl shadow-2xl relative overflow-hidden group max-w-2xl mx-auto">
                    <div className="absolute top-0 right-0 p-8 md:p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                        <Target size={150} />
                    </div>

                    <h2 className="text-xl md:text-2xl font-semibold mb-6 flex items-center gap-2 relative z-10">
                        <Search className="text-primary" size={24} />
                        New Mastery Target
                    </h2>

                    <form onSubmit={handleCreate} className="space-y-6 relative z-10">
                        <div>
                        <label className="block text-xs surgical-mono text-secondary mb-2 uppercase">
                            Target Subject or URL
                        </label>
                        <input
                            type="text"
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            placeholder="e.g., Astrophysics, https://..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-base md:text-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-600"
                            autoFocus
                        />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs surgical-mono text-secondary uppercase">
                                Complexity Level
                            </label>
                            <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                                {(['Beginner', 'Intermediate', 'Expert'] as const).map(level => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setComplexityLevel(level)}
                                        className={`
                                            py-2 text-xs md:text-sm font-medium rounded transition-all
                                            ${complexityLevel === level 
                                                ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700' 
                                                : 'text-slate-500 hover:text-slate-300'}
                                        `}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={!topicInput || isProcessing}
                            className={`
                                w-full px-8 py-3 rounded-lg font-bold tracking-wide flex items-center justify-center gap-2 transition-all
                                ${!topicInput || isProcessing
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                                : 'bg-primary hover:bg-teal-500 text-white shadow-lg shadow-teal-900/50 transform hover:-translate-y-0.5'
                                }
                            `}
                            >
                            {isProcessing ? (
                                <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                MAPPING SYLLABUS...
                                </>
                            ) : (
                                <>
                                LAUNCH PROGRAM <ArrowRight size={18} />
                                </>
                            )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* ACTIVE PROGRAMS GRID */}
        {activePrograms.length > 0 && !isCreatingNew && (
            <div className="grid gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-2 border-b border-slate-800 pb-2">
                    <h2 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                        <Activity size={16} /> Active Trajectories
                    </h2>
                </div>

                {activePrograms.map(program => (
                    <ProgramCard 
                        key={program.id} 
                        program={program} 
                        onResume={handleResume} 
                        isProcessing={isProcessing} 
                    />
                ))}
            </div>
        )}

        {/* COMPLETED PROGRAMS GRID */}
        {completedPrograms.length > 0 && !isCreatingNew && (
             <div className="grid gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                    <CheckCircle size={16} /> Completed Trajectories
                </h2>
                {completedPrograms.map(program => (
                    <ProgramCard 
                        key={program.id} 
                        program={program} 
                        onResume={() => {}} 
                        isProcessing={false} 
                    />
                ))}
             </div>
        )}
      </main>
    </div>
  );
};