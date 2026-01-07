import React, { useState, useEffect, useRef } from 'react';
import { useGenius } from '../store/GeniusContext';
import { SprintTimer } from '../components/SprintTimer';
import { Zap, BookOpen, AlertTriangle, CheckCircle, Brain, Menu, X, ArrowRight, Lightbulb, Hexagon, Image as ImageIcon, RefreshCw, Quote, Loader2, Sparkles, ChevronRight, ChevronLeft, Bug } from 'lucide-react';
import { SessionStatus } from '../types';
import { InfoTooltip } from '../components/InfoTooltip';
import { StageExplainer } from '../components/StageExplainer';

const REFLECTION_PROMPTS = [
    "How does this concept apply to your current project?",
    "Explain this to a 5-year-old.",
    "What is the exact opposite of this concept?",
    "How would you use this to solve a problem you faced yesterday?",
    "Connect this concept to something unrelated (e.g., cooking).",
    "What is the most counter-intuitive part of this?",
    "Draw a mental map of this section.",
    "Why does this matter in 100 years?",
    "If this were false, what would happen?",
    "What question does this answer?"
];

const CHEEKY_LOADERS = [
    "Reticulating Splines...",
    "Summoning Pixels...",
    "Dreaming in RGB...",
    "Constructing Reality...",
    "Parsing Visuals...",
    "Hallucinating Details...",
    "Rendering Thoughts...",
    "Visualizing Chaos..."
];

export const Session: React.FC = () => {
  const { activeUnit, isGenerating, loadingProgress, triggerZenPulse, completeSprint, status, toggleDevMode, userState, isTestingMode, timer } = useGenius();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isContentUnlocked, setIsContentUnlocked] = useState(false);
  
  // Randomize prompt on mount
  const [reflectionPrompt, setReflectionPrompt] = useState(() => 
    REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]
  );
  
  // Pagination State (0 = Intro, 1..N = Sections, N+1 = Outro)
  const [pageIndex, setPageIndex] = useState(0);
  const [hasMidSprintPulsed, setHasMidSprintPulsed] = useState(false);
  
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (prevStatusRef.current === SessionStatus.ZEN_PULSE && status === SessionStatus.FOCUS) {
      setIsContentUnlocked(true);
    }
    prevStatusRef.current = status;
  }, [status]);

  const shuffleReflection = () => {
      const random = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
      setReflectionPrompt(random);
  };

  const getRandomLoader = () => CHEEKY_LOADERS[Math.floor(Math.random() * CHEEKY_LOADERS.length)];

  // Helper to highlight threshold concepts
  const highlightText = (text: string) => {
      if (!activeUnit?.thresholdConcepts) return text;
      
      let processed = text;
      activeUnit.thresholdConcepts.forEach(concept => {
          // Case-insensitive, robust word boundary
          const regex = new RegExp(`\\b(${concept})\\b`, 'gi');
          processed = processed.replace(regex, '**$1**'); 
      });
      return processed;
  };

  const renderMarkdown = (text: string) => {
    const highlighted = highlightText(text);
    const cleanText = highlighted.replace(/\\n/g, '\n');
    const lines = cleanText.split('\n');
    
    return lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-4" />;

        const parseInline = (str: string) => {
            const parts = str.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                        <span key={i} className="text-accent font-semibold bg-accent/10 px-1 rounded mx-0.5 border-b border-accent/20">
                            {part.slice(2, -2)}
                        </span>
                    );
                }
                return part;
            });
        };

        if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) return null; 
        
        if (trimmed.startsWith('> ')) {
            return (
                <div key={index} className="my-6 relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 p-6 group hover:border-accent/50 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-accent">
                        <Lightbulb size={48} />
                    </div>
                    <p className="relative z-10 text-slate-300 italic text-lg leading-relaxed">
                        {parseInline(trimmed.replace('> ', ''))}
                    </p>
                </div>
            );
        }

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            return (
                <div key={index} className="flex items-start gap-3 mb-3 ml-2">
                    <ArrowRight size={16} className="text-slate-500 mt-1.5 shrink-0" />
                    <p className="text-slate-300 leading-relaxed">
                        {parseInline(trimmed.replace(/^[\*\-]\s/, ''))}
                    </p>
                </div>
            );
        }
        
        if (/^\d+\./.test(trimmed)) {
             return (
                <div key={index} className="flex items-start gap-3 mb-3 ml-2">
                    <span className="font-mono text-accent text-sm mt-1 shrink-0">{trimmed.split('.')[0]}.</span>
                    <p className="text-slate-300 leading-relaxed">
                        {parseInline(trimmed.replace(/^\d+\.\s/, ''))}
                    </p>
                </div>
             );
        }

        return (
            <p key={index} className="mb-4 text-slate-400 leading-7 text-[1.05rem]">
                {parseInline(trimmed)}
            </p>
        );
    });
  };

  // LOADING STATE
  if (!activeUnit || isGenerating) {
      return (
          <div className="h-screen bg-background flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 z-0">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse-slow"></div>
              </div>
              
              <div className="relative z-10 max-w-lg w-full">
                  <Sparkles size={48} className="text-primary mx-auto mb-8 animate-bounce" />
                  <h2 className="text-2xl font-light text-white mb-2">Constructing Neural Pathway</h2>
                  <p className="text-slate-400 mb-8">Synthesizing goals into high-velocity content...</p>
                  
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                      <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
                  </div>
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">{Math.round(loadingProgress)}% Complete</p>
              </div>
          </div>
      );
  }

  const sectionsCount = activeUnit.sections?.length || 0;
  const maxPages = 1 + sectionsCount + 1; // Intro + Sections + Outro

  const handleNext = () => {
      // Pulse Interruption at 5 mins (300s)
      if (timer <= 300 && !hasMidSprintPulsed) {
          triggerZenPulse();
          setHasMidSprintPulsed(true);
          return; // Interrupt navigation
      }
      setPageIndex(p => Math.min(p + 1, maxPages - 1));
  };
  
  const handleBack = () => setPageIndex(p => Math.max(p - 1, 0));

  return (
    <div className="min-h-screen bg-background text-slate-200 flex flex-col relative overflow-hidden">
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 bg-background/80 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
            <InfoTooltip label="Current active learning module">
              <span onDoubleClick={toggleDevMode} className="font-semibold text-sm tracking-wide hidden sm:block cursor-default select-none">
                  {activeUnit.title.toUpperCase()}
              </span>
              <span className="font-semibold text-sm tracking-wide sm:hidden">SPRINT</span>
            </InfoTooltip>
        </div>
        
        <SprintTimer />
        
        <div className="flex items-center gap-2 lg:gap-4">
            {isTestingMode && (
                <button 
                    onClick={completeSprint}
                    className="text-xs bg-accent text-black hover:bg-amber-400 font-bold px-3 py-2 rounded transition-colors whitespace-nowrap flex items-center gap-1"
                >
                    <Bug size={12} /> SKIP
                </button>
            )}
             <button 
                onClick={triggerZenPulse}
                className="flex text-xs items-center gap-1 text-accent hover:text-amber-400 border border-accent/30 px-4 py-2 rounded bg-accent/10 transition-colors uppercase font-bold tracking-wider"
             >
                <Zap size={12} /> PULSE
             </button>
            <button 
                onClick={completeSprint}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-2 rounded transition-colors whitespace-nowrap"
            >
                END
            </button>
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="xl:hidden p-2 text-slate-400 hover:text-white"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 min-h-[calc(100vh-8rem)] flex flex-col">
                
                <StageExplainer id="sprint_session" title="Protocol: The Sprint">
                    High-intensity focus. Concepts highlighted in <span className="text-accent font-bold">Amber</span> are Threshold Concepts—foundational ideas you must master.
                </StageExplainer>

                {/* PAGE 0: PRIMING BRIDGE */}
                {pageIndex === 0 && (
                     <div className="flex-1 flex items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-full">
                            <div className="mb-12 p-1 rounded-2xl bg-gradient-to-r from-primary/20 via-slate-800 to-slate-800 shadow-2xl">
                                <div className="bg-slate-900 rounded-xl p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 text-primary pointer-events-none">
                                        <Brain size={120} />
                                    </div>
                                    <h3 className="text-primary text-xs font-bold uppercase mb-4 flex items-center gap-2 tracking-widest">
                                        <Brain size={14}/> Priming Bridge
                                    </h3>
                                    <div className="relative z-10">
                                        <Quote size={24} className="text-slate-600 mb-4" />
                                        <p className="text-slate-100 text-lg md:text-xl font-light leading-relaxed mb-6">
                                            {activeUnit.motivatingStatement || "Mastery is not an act, but a habit. You are building the foundation now."}
                                        </p>
                                        <div className="h-[1px] w-12 bg-primary mb-4"></div>
                                        <p className="text-slate-400 text-sm">
                                            You are establishing the <strong>Core Foundations</strong> of {activeUnit.title}, {userState.name}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                )}

                {/* PAGES 1..N: SECTIONS */}
                {pageIndex > 0 && pageIndex <= sectionsCount && (
                    <article className="flex-1 animate-in fade-in slide-in-from-right-4 duration-500">
                        {(() => {
                            const section = activeUnit.sections[pageIndex - 1];
                            return (
                                <>
                                    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-slate-800">
                                        <div className="p-2 bg-slate-800 rounded-lg text-primary">
                                            <Hexagon size={24} strokeWidth={1.5} />
                                        </div>
                                        <h2 className="text-3xl font-light text-slate-100 tracking-tight">
                                            {section.title}
                                        </h2>
                                    </div>

                                    <div className="clearfix">
                                        {/* Visual Anchor */}
                                        {section.imageKeyword && (
                                            <div className="float-right ml-6 mb-6 w-full md:w-1/3 rounded-xl overflow-hidden border border-slate-800 relative bg-slate-900 group shadow-lg">
                                                <div className="aspect-video relative">
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-600 font-mono">
                                                        {getRandomLoader()}
                                                    </div>
                                                    <img 
                                                        src={`https://image.pollinations.ai/prompt/${encodeURIComponent(section.imageKeyword)}?width=400&height=300&nologo=true`} 
                                                        alt={section.imageKeyword}
                                                        className="absolute inset-0 w-full h-full object-cover z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                                                        loading="lazy"
                                                    />
                                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent z-20">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                                                            <ImageIcon size={10} /> {section.imageKeyword}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Content Body */}
                                        <div className="prose prose-invert max-w-none text-lg">
                                            {renderMarkdown(section.content)}
                                        </div>
                                    </div>

                                    {/* Interaction Node */}
                                    {section.interactionType === 'REFLECTION' && (
                                        <div className="mt-12 p-6 bg-slate-900/50 border border-dashed border-slate-700 rounded-xl relative group">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-sm font-bold text-accent uppercase flex items-center gap-2">
                                                    <Zap size={14} /> Active Reflection
                                                </h4>
                                                <button onClick={shuffleReflection} className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors" title="Shuffle Prompt">
                                                    <RefreshCw size={14} />
                                                </button>
                                            </div>
                                            <p className="text-slate-300 text-base mb-4 italic">"{reflectionPrompt}"</p>
                                            <textarea className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:border-accent outline-none" rows={3} placeholder="My thoughts..."></textarea>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </article>
                )}

                {/* FINAL PAGE: OUTRO */}
                {pageIndex === maxPages - 1 && (
                     <div className="flex-1 flex flex-col items-center justify-center animate-in zoom-in fade-in duration-500">
                        <div className="w-full max-w-md text-center">
                            {!isContentUnlocked ? (
                                <div className="flex flex-col items-center justify-center">
                                    <div className="h-px w-24 bg-slate-800 mb-8"></div>
                                    <button 
                                        onClick={triggerZenPulse}
                                        className="group flex flex-col items-center gap-6 transition-transform hover:scale-105 active:scale-95"
                                    >
                                        <div className="h-24 w-24 rounded-full border-2 border-primary bg-slate-900 shadow-[0_0_40px_-5px_rgba(13,148,136,0.4)] flex items-center justify-center group-hover:bg-primary text-primary group-hover:text-white transition-all duration-300 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full"></div>
                                            <BookOpen size={32} className="relative z-10"/>
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-sm surgical-mono text-primary font-bold tracking-[0.2em] mb-2">COGNITIVE LOAD HIGH</span>
                                            <span className="text-sm text-slate-400">Initiate Zen Pulse to Consolidate</span>
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center animate-in zoom-in fade-in duration-500">
                                    <div className="px-6 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm uppercase tracking-widest flex items-center gap-2 mb-8">
                                        <Zap size={14} fill="currentColor" /> Neural Pathway Unlocked
                                    </div>
                                    
                                    <button
                                        onClick={completeSprint}
                                        className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center gap-3 transition-colors shadow-lg"
                                    >
                                        Proceed to Consolidation <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation Controls */}
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                    <button 
                        onClick={handleBack}
                        disabled={pageIndex === 0}
                        className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded transition-colors ${pageIndex === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <ChevronLeft size={16} /> BACK
                    </button>
                    
                    <div className="flex gap-1">
                        {[...Array(maxPages)].map((_, i) => (
                            <div key={i} className={`h-1.5 rounded-full transition-all ${i === pageIndex ? 'w-6 bg-primary' : 'w-1.5 bg-slate-700'}`} />
                        ))}
                    </div>

                    <button 
                        onClick={handleNext}
                        disabled={pageIndex === maxPages - 1}
                        className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded transition-colors ${pageIndex === maxPages - 1 ? 'text-slate-600 cursor-not-allowed' : 'text-primary hover:text-teal-400 hover:bg-slate-800'}`}
                    >
                        NEXT <ChevronRight size={16} />
                    </button>
                </div>

            </div>
        </main>

        {/* Sidebar */}
        <aside className={`
            fixed xl:relative inset-y-0 right-0 z-30 w-80 bg-surface/95 backdrop-blur-xl xl:bg-surface/50 border-l border-slate-800
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0 top-16' : 'translate-x-full top-16'}
            xl:translate-x-0 xl:top-0 xl:flex flex-col
        `}>
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <InfoTooltip label="Active Recall and Spaced Repetition Module">
                  <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle size={14} /> Retrieval Lab
                  </h3>
                </InfoTooltip>
                <button onClick={() => setIsSidebarOpen(false)} className="xl:hidden text-slate-400">
                  <X size={14} />
                </button>
            </div>
            
            <div className="p-4 space-y-4 h-full overflow-y-auto">
                 <div className="p-4 rounded-lg border border-dashed border-slate-700 text-center">
                    <AlertTriangle size={24} className="mx-auto text-slate-600 mb-2"/>
                    <p className="text-xs text-secondary">
                        Upcoming Interleaved Test in 5:00
                    </p>
                </div>
            </div>
        </aside>
        
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 xl:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
