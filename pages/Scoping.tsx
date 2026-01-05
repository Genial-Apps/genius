import React, { useState, useRef } from 'react';
import { useGenius } from '../store/GeniusContext';
import { ScopedGoal, GoalPriority } from '../types';
import { Loader2, ArrowRight, Brain, Target, Shield, CheckCircle, Link as LinkIcon, Star, Sparkles, AlertTriangle, ArrowLeft } from 'lucide-react';
import { StageExplainer } from '../components/StageExplainer';

export const Scoping: React.FC = () => {
  const { launchSprint, scopingData, isScoping, updateScopingGoals, userState, loadingProgress, toggleDevMode } = useGenius();
  
  // Priming State
  const [relevance, setRelevance] = useState('');
  const [relation, setRelation] = useState('');
  const [scope, setScope] = useState('');
  const [primingStep, setPrimingStep] = useState(1); // 1, 2, 3
  
  // Learning Contract Visibility
  const [viewContract, setViewContract] = useState(false);

  const contractRef = useRef<HTMLDivElement>(null);

  // Handle Goal Toggles
  const toggleGoalSelection = (id: string) => {
      if (!scopingData) return;
      const newGoals = scopingData.goals.map(g => 
          g.id === id ? { ...g, isSelected: !g.isSelected } : g
      );
      updateScopingGoals(newGoals);
  };

  // Handle Priority Cycle
  const cyclePriority = (id: string) => {
      if (!scopingData) return;
      const priorities: GoalPriority[] = ['Useful', 'Critical', 'Interesting'];
      
      const newGoals = scopingData.goals.map(g => {
          if (g.id === id) {
              const currentIdx = priorities.indexOf(g.priority);
              const nextIdx = (currentIdx + 1) % priorities.length;
              return { ...g, priority: priorities[nextIdx] };
          }
          return g;
      });
      updateScopingGoals(newGoals);
  };

  const handleLaunch = () => {
      launchSprint({ relevance, relation, scope });
  };

  const nextStep = () => {
      if (primingStep === 1 && !relevance) return;
      if (primingStep === 2 && !relation) return;
      if (primingStep === 3 && !scope) return;
      setPrimingStep(p => Math.min(p + 1, 4));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          nextStep();
      }
  };

  const revealContract = () => {
      setViewContract(true);
      // Wait for render to update hidden class then scroll
      setTimeout(() => {
          if (contractRef.current) {
              contractRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
      }, 50);
  };

  const analysisReady = !isScoping && scopingData;

  return (
    <div className="h-screen bg-background text-slate-200 flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="flex-none z-50 bg-background/95 backdrop-blur border-b border-slate-800 shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                <div onDoubleClick={toggleDevMode} className="cursor-default select-none">
                    <h1 className="text-base md:text-lg font-light tracking-wide mb-1">
                        Cognitive <span className="text-primary font-bold">Priming</span>
                    </h1>
                    <div className="flex items-center gap-2 text-secondary text-[10px] surgical-mono uppercase tracking-widest">
                        <Target size={10} />
                        Target: {userState.currentSubject}
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                     {isScoping && (
                         <div className="flex items-center gap-2 text-primary text-xs font-mono animate-pulse">
                             <Loader2 size={12} className="animate-spin" /> Scoping... {Math.round(loadingProgress)}%
                         </div>
                     )}
                     {!isScoping && scopingData && (
                         <div className="flex items-center gap-2 text-green-500 text-xs font-mono">
                             <CheckCircle size={12} /> Analysis Ready
                         </div>
                     )}
                </div>
          </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full overflow-hidden">
          
          {/* LEFT: PRIMING INPUTS */}
          <div id="scoping-left-panel" className="w-full md:w-1/2 p-6 overflow-y-auto scrollbar-hide border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-center">
               <div className="max-w-md mx-auto w-full space-y-6 pb-12">
                   
                   <StageExplainer id="priming" title="Protocol: Priming">
                       Answer these questions to activate specific neural pathways. 
                       The AI will use your answers to bridge your existing mental models with the new material.
                   </StageExplainer>

                   {/* Step 1 */}
                   {primingStep === 1 && (
                       <div className="animate-in slide-in-from-right-8 fade-in duration-300">
                           <div className="flex items-center gap-3 mb-4 text-primary">
                               <Target size={24} />
                               <h2 className="text-xl font-semibold">1. Relevance</h2>
                           </div>
                           <p className="text-slate-400 text-sm mb-4">Why does this matter to you <span className="text-white underline decoration-primary/50">right now</span>?</p>
                           <textarea 
                               autoFocus
                               value={relevance}
                               onChange={(e) => setRelevance(e.target.value)}
                               onKeyDown={handleKeyDown}
                               className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                               placeholder="I need this to..."
                           />
                           <div className="flex justify-end mt-4">
                               <button onClick={nextStep} disabled={!relevance} className="text-primary hover:text-white flex items-center gap-2 font-bold px-4 py-2 rounded hover:bg-slate-800 transition-colors">
                                   NEXT <ArrowRight size={16} />
                               </button>
                           </div>
                       </div>
                   )}

                   {/* Step 2 */}
                   {primingStep === 2 && (
                       <div className="animate-in slide-in-from-right-8 fade-in duration-300">
                           <button onClick={() => setPrimingStep(1)} className="mb-6 text-slate-500 hover:text-white flex items-center gap-1 text-xs"><ArrowLeft size={12}/> Back</button>
                           <div className="flex items-center gap-3 mb-4 text-accent">
                               <LinkIcon size={24} />
                               <h2 className="text-xl font-semibold">2. Context</h2>
                           </div>
                           <p className="text-slate-400 text-sm mb-4">What does this <span className="text-white underline decoration-accent/50">relate to</span>?</p>
                           <textarea 
                               autoFocus
                               value={relation}
                               onChange={(e) => setRelation(e.target.value)}
                               onKeyDown={handleKeyDown}
                               className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-base focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all resize-none"
                               placeholder="It connects to..."
                           />
                           <div className="flex justify-end mt-4">
                               <button onClick={nextStep} disabled={!relation} className="text-accent hover:text-white flex items-center gap-2 font-bold px-4 py-2 rounded hover:bg-slate-800 transition-colors">
                                   NEXT <ArrowRight size={16} />
                               </button>
                           </div>
                       </div>
                   )}

                   {/* Step 3 */}
                   {primingStep === 3 && (
                       <div className="animate-in slide-in-from-right-8 fade-in duration-300">
                           <button onClick={() => setPrimingStep(2)} className="mb-6 text-slate-500 hover:text-white flex items-center gap-1 text-xs"><ArrowLeft size={12}/> Back</button>
                           <div className="flex items-center gap-3 mb-4 text-teal-400">
                               <Shield size={24} />
                               <h2 className="text-xl font-semibold">3. Expectations</h2>
                           </div>
                           <p className="text-slate-400 text-sm mb-4">What do you <span className="text-white underline decoration-teal-400/50">expect to see</span>?</p>
                           <textarea 
                               autoFocus
                               value={scope}
                               onChange={(e) => setScope(e.target.value)}
                               onKeyDown={handleKeyDown}
                               className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-base focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none transition-all resize-none"
                               placeholder="Specific concepts like..."
                           />
                           <div className="flex justify-end mt-4">
                               <button onClick={nextStep} disabled={!scope} className="text-teal-400 hover:text-white flex items-center gap-2 font-bold px-4 py-2 rounded hover:bg-slate-800 transition-colors">
                                   FINISH PRIMING <ArrowRight size={16} />
                               </button>
                           </div>
                       </div>
                   )}
                   
                   {/* Completion State */}
                   {primingStep === 4 && (
                       <div className="text-center animate-in zoom-in fade-in duration-300 py-12">
                           <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                               <CheckCircle size={32} className="text-primary" />
                           </div>
                           <h3 className="text-xl text-white font-light mb-2">Priming Complete, {userState.name}</h3>
                           <p className="text-slate-400 text-sm mb-6">Your cognitive model has been bridged to the target.</p>
                           
                           <button 
                                onClick={revealContract}
                                disabled={!analysisReady}
                                className={`
                                    mx-auto px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all
                                    ${analysisReady 
                                    ? 'bg-slate-800 hover:bg-slate-700 text-white shadow-lg' 
                                    : 'bg-slate-900 text-slate-600 cursor-wait'}
                                `}
                           >
                               VIEW LEARNING CONTRACT <ArrowRight size={16} />
                           </button>

                           <button onClick={() => setPrimingStep(1)} className="block mx-auto mt-6 text-slate-500 hover:text-white text-xs underline">Edit Answers</button>
                       </div>
                   )}

               </div>
          </div>

          {/* RIGHT: ANALYSIS & GOALS */}
          {/* Hidden on mobile unless viewed, always visible on desktop if ready */}
          <div 
             id="scoping-right-panel"
             ref={contractRef} 
             className={`
                w-full md:w-1/2 bg-slate-900/30 p-6 overflow-y-auto scrollbar-hide relative border-t md:border-t-0 md:border-l border-slate-800
                ${viewContract ? 'block opacity-100' : 'hidden md:block md:opacity-0 md:pointer-events-none'}
                transition-opacity duration-700
             `}
          >
               <div className="max-w-lg mx-auto py-8 pb-16">
                   
                   <StageExplainer id="goal_setting" title="Learning Contract">
                       <p className="mb-2">Review your outcomes. Priorities adjust depth:</p>
                       <ul className="list-disc pl-4 text-xs space-y-1 text-slate-400">
                           <li><strong className="text-red-300"><Star size={10} className="inline"/> Critical</strong>: Deep dive, must-know.</li>
                           <li><strong className="text-yellow-300"><Sparkles size={10} className="inline"/> Interesting</strong>: Bonus, lateral thinking.</li>
                       </ul>
                   </StageExplainer>

                   {scopingData && (
                       <div>
                           <div className="mb-6 flex items-center justify-between">
                               <h3 className="text-xl font-light text-white flex items-center gap-2">
                                   <Brain size={20} className="text-primary"/> Learning Contract
                               </h3>
                               <span className="text-xs uppercase tracking-widest bg-slate-800 px-2 py-1 rounded text-slate-400">
                                   {scopingData.complexity}
                               </span>
                           </div>

                           <div className="space-y-3 mb-8">
                               <h4 className="text-xs text-secondary font-bold uppercase tracking-widest mb-2">Goals</h4>
                               {scopingData.goals.map((goal) => (
                                   <div 
                                      key={goal.id}
                                      className={`
                                        p-3 rounded-lg border transition-all flex items-start gap-3 group
                                        ${goal.isSelected ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-900/20 border-slate-800 opacity-60'}
                                      `}
                                   >
                                       <button 
                                          onClick={() => toggleGoalSelection(goal.id)}
                                          className={`mt-1 h-5 w-5 shrink-0 rounded border flex items-center justify-center transition-colors ${goal.isSelected ? 'bg-primary border-primary text-white' : 'border-slate-600 hover:border-slate-400'}`}
                                       >
                                           {goal.isSelected && <CheckCircle size={14} />}
                                       </button>
                                       
                                       <div className="flex-1 pt-0.5">
                                           <p className={`text-sm leading-relaxed ${goal.isSelected ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                                               {goal.text}
                                           </p>
                                       </div>

                                       {/* Priority Toggle */}
                                       {goal.isSelected && (
                                           <button 
                                              onClick={() => cyclePriority(goal.id)}
                                              className="mt-0.5 flex flex-col items-center gap-1 w-12 shrink-0 transition-transform hover:scale-105"
                                              title="Toggle Priority"
                                           >
                                               {goal.priority === 'Critical' && (
                                                     <Star size={18} className="text-red-400 fill-red-400/20" />
                                               )}
                                               {goal.priority === 'Useful' && (
                                                     <Star size={18} className="text-slate-600" />
                                               )}
                                               {goal.priority === 'Interesting' && (
                                                     <Sparkles size={18} className="text-yellow-400" />
                                               )}
                                           </button>
                                       )}
                                   </div>
                               ))}
                           </div>

                           <div className="mb-8">
                               <h4 className="text-xs uppercase tracking-widest text-secondary mb-3">Threshold Concepts</h4>
                               <div className="flex flex-wrap gap-2">
                                   {scopingData.thresholdConcepts.map((c, i) => (
                                       <span key={i} className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-300">
                                           {c}
                                       </span>
                                   ))}
                               </div>
                           </div>

                           <div className="flex justify-end pt-4 border-t border-slate-800">
                               <button 
                                   onClick={handleLaunch}
                                   className="px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all bg-primary hover:bg-teal-500 text-white shadow-lg shadow-teal-900/20 transform hover:-translate-y-1"
                               >
                                   INITIALIZE SPRINT <ArrowRight size={18} />
                               </button>
                           </div>

                       </div>
                   )}

               </div>
          </div>
      </div>
    </div>
  );
};