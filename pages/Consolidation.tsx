import React, { useState, useEffect } from 'react';
import { useGenius } from '../store/GeniusContext';
import { LearningPhase } from '../types';
import { RefreshCw, ArrowRight, Brain, Zap, CheckCircle, Activity, Lightbulb, Bug } from 'lucide-react';
import { StageExplainer } from '../components/StageExplainer';

type Step = 'INTRO' | 'RECALL' | 'BRIDGE' | 'FEEDBACK' | 'SUMMARY';

export const Consolidation: React.FC = () => {
  const { setPhase, userState, activeUnit, currentLog, isTestingMode } = useGenius();
  const [step, setStep] = useState<Step>('INTRO');
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [showDefinition, setShowDefinition] = useState(false);
  
  // Timer for the 5 min session
  const [sessionTimer, setSessionTimer] = useState(300); // 5 mins

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step !== 'INTRO' && step !== 'SUMMARY' && sessionTimer > 0) {
      interval = setInterval(() => setSessionTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, sessionTimer]);

  const concepts = activeUnit?.thresholdConcepts || ['Core Concept 1', 'Core Concept 2', 'Synthesis'];
  const currentConcept = concepts[currentConceptIndex];
  const primingGoal = currentLog?.primingAnswers?.relevance || "mastering this topic";

  const handleNextConcept = () => {
      setInputValue('');
      setShowDefinition(false);
      if (currentConceptIndex < concepts.length - 1) {
          setCurrentConceptIndex(prev => prev + 1);
      } else {
          setStep('BRIDGE');
      }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const getConceptContext = (concept: string | undefined) => {
    if (!activeUnit || !concept) return null;
    const normalizedConcept = concept.toLowerCase();

    // 1. Prioritize Context from Sections (The lesson context)
    for (const section of activeUnit.sections) {
        // Strip Markdown for cleaner sentence splitting
        const cleanContent = section.content.replace(/(\*\*|__)/g, '');
        // Split roughly into sentences
        const sentences: string[] = cleanContent.match(/[^.!?]+[.!?]+/g) || [];
        
        const match = sentences.find(s => s.toLowerCase().includes(normalizedConcept));
        if (match) {
            // Clean up any remaining markdown chars like * or #
            const cleanText = match.replace(/[*_#\[\]]/g, '').trim();
            return { text: cleanText, source: section.title };
        }
    }

    // 2. Fallback to Word Pairs (Formal Definition)
    const pair = activeUnit.wordPairs?.find(p => p.a.toLowerCase() === normalizedConcept);
    if (pair) return { text: pair.b, source: 'Core Definition' };

    return null;
  };
  
  const contextData = showDefinition ? getConceptContext(currentConcept) : null;

  // --- RENDERERS ---

  if (step === 'INTRO') {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 animate-fade-in relative">
             {isTestingMode && (
                 <div className="absolute top-4 right-4">
                     <button onClick={() => setPhase(LearningPhase.INGESTION)} className="text-xs bg-accent text-black font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-amber-400">
                         <Bug size={12}/> SKIP
                     </button>
                 </div>
             )}
             <div className="max-w-xl w-full">
                <div className="mb-8 p-6 rounded-full bg-slate-900 border border-slate-800 shadow-2xl animate-breathe inline-block">
                    <Brain size={64} className="text-teal-500" />
                </div>
                <h1 className="text-3xl font-light text-slate-200 mb-4 tracking-widest uppercase">
                    Structural Consolidation
                </h1>
                <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                    Passive reading is not learning. <br/>
                    We will now execute a <strong>5-minute active integration protocol</strong> to burn these concepts into your long-term memory.
                </p>
                
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 text-left mb-8 space-y-4">
                    <div className="flex items-center gap-3">
                        <Zap size={20} className="text-accent" />
                        <span className="text-slate-300"><strong>Active Recall:</strong> Define threshold concepts without help.</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Activity size={20} className="text-primary" />
                        <span className="text-slate-300"><strong>Interleaving:</strong> Connect concepts to your specific goals.</span>
                    </div>
                </div>

                <button
                    onClick={() => setStep('RECALL')}
                    className="px-8 py-4 bg-primary hover:bg-teal-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg mx-auto w-full md:w-auto"
                >
                    BEGIN PROTOCOL <ArrowRight size={18} />
                </button>
             </div>
        </div>
      );
  }

  if (step === 'RECALL') {
      return (
          <div className="min-h-screen bg-background flex flex-col items-center pt-20 px-6 animate-in slide-in-from-right-8 relative">
              {isTestingMode && (
                 <div className="absolute top-20 right-4">
                     <button onClick={() => setStep('BRIDGE')} className="text-xs bg-accent text-black font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-amber-400">
                         <Bug size={12}/> SKIP
                     </button>
                 </div>
              )}
              <div className="max-w-2xl w-full">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                      <span className="text-xs font-mono text-secondary uppercase tracking-widest">Protocol: Active Recall</span>
                      <span className="text-xl font-mono text-primary font-bold">{formatTime(sessionTimer)}</span>
                  </div>

                  <div className="text-center mb-12">
                      <h2 className="text-sm text-slate-500 uppercase tracking-widest mb-4">Define This Concept</h2>
                      <h1 className="text-4xl md:text-5xl font-light text-white mb-8">{currentConcept}</h1>
                      
                      {!showDefinition ? (
                          <div className="space-y-6">
                              <textarea 
                                  autoFocus
                                  value={inputValue}
                                  onChange={(e) => setInputValue(e.target.value)}
                                  placeholder="Type your definition here (don't worry about being perfect)..."
                                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-6 text-lg text-slate-300 focus:border-primary outline-none h-40 resize-none"
                              />
                              <button 
                                  onClick={() => setShowDefinition(true)}
                                  disabled={!inputValue}
                                  className={`mx-auto px-6 py-3 rounded-full font-bold transition-all ${!inputValue ? 'bg-slate-800 text-slate-600' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                              >
                                  REVEAL ANSWER
                              </button>
                          </div>
                      ) : (
                          <div className="animate-in zoom-in fade-in duration-300">
                              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-left mb-8 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
                                      <CheckCircle size={48} />
                                  </div>
                                  <h4 className="text-xs text-primary font-bold uppercase mb-2">Your Definition</h4>
                                  <p className="text-slate-400 mb-6 italic border-l-2 border-slate-700 pl-4">{inputValue}</p>
                                  
                                  <h4 className="text-xs text-accent font-bold uppercase mb-2">Contextual Grounding</h4>
                                  {contextData ? (
                                      <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/50">
                                          <p className="text-slate-300 mb-2 leading-relaxed">"{contextData.text}"</p>
                                          <div className="flex justify-between items-center">
                                              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Source: {contextData.source}</span>
                                              <span className="text-xs text-primary italic">Compare with your answer</span>
                                          </div>
                                      </div>
                                  ) : (
                                      <p className="text-slate-400 text-sm">
                                          Recall the lesson context. Does your definition capture the core mechanism?
                                      </p>
                                  )}
                              </div>
                              
                              <div className="flex justify-center gap-4">
                                  <button onClick={handleNextConcept} className="px-6 py-3 bg-primary hover:bg-teal-500 text-white rounded-lg font-bold">
                                      {currentConceptIndex < concepts.length - 1 ? "Next Concept" : "Proceed to Bridging"}
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
                  
                  <div className="flex justify-center gap-1">
                      {concepts.map((_, i) => (
                          <div key={i} className={`h-1 w-8 rounded-full ${i === currentConceptIndex ? 'bg-primary' : i < currentConceptIndex ? 'bg-slate-600' : 'bg-slate-800'}`} />
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  if (step === 'BRIDGE') {
      return (
          <div className="min-h-screen bg-background flex flex-col items-center pt-20 px-6 animate-in slide-in-from-right-8 relative">
              {isTestingMode && (
                 <div className="absolute top-20 right-4">
                     <button onClick={() => setStep('SUMMARY')} className="text-xs bg-accent text-black font-bold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-amber-400">
                         <Bug size={12}/> SKIP
                     </button>
                 </div>
              )}
              <div className="max-w-2xl w-full">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
                      <span className="text-xs font-mono text-secondary uppercase tracking-widest">Protocol: Interleaving</span>
                      <span className="text-xl font-mono text-accent font-bold">{formatTime(sessionTimer)}</span>
                  </div>

                  <div className="bg-slate-900/50 border border-dashed border-slate-700 p-8 rounded-2xl mb-8">
                      <div className="flex items-start gap-4 mb-6">
                          <Lightbulb size={24} className="text-yellow-400 mt-1 shrink-0" />
                          <div>
                              <h3 className="text-lg font-light text-white mb-2">Synthesis Challenge</h3>
                              <p className="text-slate-400 leading-relaxed">
                                  You started this session because you wanted to: <br/>
                                  <span className="text-primary italic">"{primingGoal}"</span>.
                              </p>
                          </div>
                      </div>
                      
                      <p className="text-lg text-slate-200 font-medium mb-4">
                          Select ONE threshold concept you just reviewed and write one sentence explaining how it directly helps you achieve that goal.
                      </p>

                      <textarea 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white focus:border-accent outline-none h-32 resize-none"
                          placeholder="e.g., Concept X allows me to..."
                      />
                  </div>

                  <div className="flex justify-center">
                      <button 
                          onClick={() => setStep('SUMMARY')}
                          className="px-8 py-4 bg-accent hover:bg-amber-400 text-slate-900 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-amber-900/20"
                      >
                          COMPLETE INTEGRATION <CheckCircle size={18} />
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // SUMMARY STEP (Original-ish view)
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 animate-fade-in">
      <div className="mb-8 p-6 rounded-full bg-slate-900 border border-slate-800 shadow-2xl animate-breathe">
        <CheckCircle size={64} className="text-emerald-500" />
      </div>

      <h1 className="text-3xl font-light text-slate-200 mb-2 tracking-widest uppercase">
        Integration Complete
      </h1>
      <p className="text-slate-500 max-w-md mx-auto mb-12">
        Neural pathways reinforced. <br/>
        Sprint successfully consolidated, {userState.name}.
      </p>

      <div className="grid grid-cols-2 gap-8 text-left max-w-lg w-full bg-slate-900/50 p-8 rounded-xl border border-slate-800">
        <div>
            <span className="block text-xs text-secondary uppercase mb-1">Session ROI</span>
            <span className="text-2xl font-mono text-primary">+22%</span>
        </div>
        <div>
            <span className="block text-xs text-secondary uppercase mb-1">Status</span>
            <span className="text-2xl font-mono text-slate-300">Ready</span>
        </div>
      </div>

      <button
        onClick={() => setPhase(LearningPhase.INGESTION)}
        className="mt-12 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <RefreshCw size={14} /> Return to Momentum Map
      </button>
    </div>
  );
};