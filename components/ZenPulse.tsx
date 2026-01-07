import React, { useState, useEffect, useRef } from 'react';
import { useGenius } from '../store/GeniusContext';
import { SessionStatus } from '../types';
import { Wind, Network, Hourglass, X, SkipForward, Brain, CheckSquare, Square, Wand2, RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { StageExplainer } from './StageExplainer';

type ZenMode = 'MENU' | 'COUNTDOWN' | 'CONNECTIONS' | 'PAIRS';

const DEFAULT_DURATION_MINUTES = 5;

// --- Sub-Component: Countdown ---
const ZenCountdown: React.FC<{ timeLeft: number }> = ({ timeLeft }) => {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in duration-500 w-full">
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-48 h-48 md:w-64 md:h-64 bg-primary/10 rounded-full animate-breathe blur-3xl"></div>
        <div className="text-6xl md:text-8xl font-thin text-slate-100 font-mono tracking-tighter relative z-10">
          {formatTime(timeLeft)}
        </div>
      </div>
      <p className="text-primary/70 tracking-[0.2em] uppercase text-sm animate-pulse-slow">
        No Device Time
      </p>
    </div>
  );
};

// --- Sub-Component: Connections ---
interface Node {
  id: string;
  text: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  parentId?: string;
  isEditing?: boolean;
}

const ZenConnections: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'root', text: 'Central Concept', x: 50, y: 50, isEditing: true }
  ]);

  const handleUpdateText = (id: string, newText: string) => {
      setNodes(nodes.map(n => n.id === id ? { ...n, text: newText } : n));
  };

  const finishEditing = (id: string) => {
      setNodes(nodes.map(n => n.id === id ? { ...n, isEditing: false } : n));
  };
  
  const addNode = (parentId: string) => {
      const parent = nodes.find(n => n.id === parentId);
      if (!parent) return;

      const count = nodes.length;
      const angle = count * 137.5; // Golden angle
      const radius = Math.min(40, 15 + count * 3); 
      
      const rad = (angle * Math.PI) / 180;
      const x = 50 + radius * Math.cos(rad);
      const y = 50 + radius * Math.sin(rad);

      const newNode: Node = {
          id: crypto.randomUUID(),
          text: '',
          x,
          y,
          parentId,
          isEditing: true
      };
      
      setNodes([...nodes, newNode]);
  };

  return (
      <div className="w-full h-full flex flex-col relative animate-in fade-in duration-500">
          <h3 className="text-center text-secondary uppercase tracking-widest text-xs mb-4">Neural Associative Mapping</h3>
          
          <div className="flex-1 relative bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden shadow-inner cursor-pointer" onClick={(e) => {
              if (e.target === e.currentTarget && nodes.length > 0) {
                 addNode(nodes[nodes.length-1].id);
              }
          }}>
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  {nodes.map(node => {
                      if (!node.parentId) return null;
                      const parent = nodes.find(n => n.id === node.parentId);
                      if (!parent) return null;
                      
                      return (
                          <line 
                              key={`line-${node.id}`}
                              x1={`${parent.x}%`} y1={`${parent.y}%`}
                              x2={`${node.x}%`} y2={`${node.y}%`}
                              stroke="#64748b"
                              strokeWidth="1"
                              strokeOpacity="0.4"
                          />
                      );
                  })}
              </svg>

              {nodes.map(node => (
                  <div 
                      key={node.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                      onClick={(e) => e.stopPropagation()}
                  >
                      {node.isEditing ? (
                          <input 
                              autoFocus
                              value={node.text}
                              onChange={(e) => handleUpdateText(node.id, e.target.value)}
                              onBlur={() => finishEditing(node.id)}
                              onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                      finishEditing(node.id);
                                      addNode(node.id);
                                  }
                              }}
                              className="bg-primary text-white text-xs px-3 py-1.5 rounded-full outline-none shadow-lg w-32 text-center placeholder:text-white/50"
                              placeholder="Concept..."
                          />
                      ) : (
                          <button 
                              onClick={() => setNodes(nodes.map(n => n.id === node.id ? { ...n, isEditing: true } : n))}
                              className="bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap text-slate-300 hover:border-primary transition-colors"
                          >
                              {node.text || "..."}
                          </button>
                      )}
                  </div>
              ))}
              
              <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-600 pointer-events-none">
                  Click space to add node • Enter to save & branch
              </div>
          </div>
      </div>
  );
};

// --- Sub-Component: Match Pairs ---
interface Card {
    id: string;
    text: string;
    fullText: string;
    pairId: string;
    state: 'hidden' | 'selected' | 'matched' | 'mismatch';
}

const ZenPairs: React.FC = () => {
    const { activeUnit } = useGenius();
    const [cards, setCards] = useState<Card[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

    useEffect(() => {
        handleReset();
    }, [activeUnit]);

    const truncate = (str: string) => {
        return str.length > 30 ? str.slice(0, 29) + '…' : str;
    };

    const handleCardClick = (id: string) => {
        const clickedCard = cards.find(c => c.id === id);
        
        // Prevent interaction if blocked, already matched, or selected
        if (!clickedCard || 
            clickedCard.state === 'matched' || 
            clickedCard.state === 'selected' || 
            selectedIds.length >= 2
        ) return;

        // Optimistic update: Select the card
        const newSelected = [...selectedIds, id];
        setCards(prev => prev.map(c => c.id === id ? { ...c, state: 'selected' } : c));
        setSelectedIds(newSelected);

        // Logic check when 2 cards are selected
        if (newSelected.length === 2) {
            const firstId = newSelected[0];
            const secondId = newSelected[1];
            
            const card1 = cards.find(c => c.id === firstId);
            const card2 = clickedCard;

            if (card1 && card2) {
                if (card1.pairId === card2.pairId) {
                    // MATCH: Turn Green
                    setTimeout(() => {
                        setCards(prev => prev.map(c => 
                            newSelected.includes(c.id) ? { ...c, state: 'matched' } : c
                        ));
                        setSelectedIds([]);
                    }, 500);
                } else {
                    // MISMATCH: Flash Orange then Hide
                    setTimeout(() => {
                        // Flash Orange
                        setCards(prev => prev.map(c => 
                            newSelected.includes(c.id) ? { ...c, state: 'mismatch' } : c
                        ));
                        
                        setTimeout(() => {
                            // Revert to Hidden
                            setCards(prev => prev.map(c => 
                                newSelected.includes(c.id) ? { ...c, state: 'hidden' } : c
                            ));
                            setSelectedIds([]);
                        }, 800);
                    }, 500);
                }
            }
        }
    };

    const handleSolve = () => {
        setViewMode('LIST');
        setSelectedIds([]);
        // Mark all as matched internally for consistency if we switch back, 
        // though we mainly stay in List mode.
        setCards(prev => prev.map(c => ({...c, state: 'matched'})));
    };

    const handleReset = () => {
        if (!activeUnit?.wordPairs) return;
        setViewMode('GRID');
        setSelectedIds([]);
        
        const newCards: Card[] = [];
        const pairs = activeUnit.wordPairs || [];
        pairs.forEach((pair, idx) => {
            const pairId = `pair-${idx}`;
            newCards.push({ 
                id: `${pairId}-a`, 
                text: truncate(pair.a), 
                fullText: pair.a,
                pairId, 
                state: 'hidden' 
            });
            newCards.push({ 
                id: `${pairId}-b`, 
                text: truncate(pair.b), 
                fullText: pair.b,
                pairId, 
                state: 'hidden' 
            });
        });
        
        // Shuffle for gameplay
        setCards(newCards.sort(() => Math.random() - 0.5));
    }

    return (
        <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header with Controls */}
            <div className="flex justify-between items-center mb-4 px-2 min-h-[40px] border-b border-slate-800 pb-2">
                <h3 className="text-secondary uppercase tracking-widest text-xs font-bold">Semantic Mapping</h3>
                
                <div className="flex gap-3">
                    <button 
                        onClick={handleReset}
                        className="text-[10px] md:text-xs flex items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
                        title="Reset Board"
                    >
                        <RefreshCw size={12} /> Reset
                    </button>
                    <button 
                        onClick={handleSolve}
                        className="text-[10px] md:text-xs flex items-center gap-1.5 text-accent hover:text-amber-300 font-bold transition-colors bg-accent/10 px-2 py-1 rounded-full border border-accent/20"
                        title="Show Solutions"
                    >
                        <Wand2 size={12} /> Solve
                    </button>
               </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 pb-4 scrollbar-hide">
                
                {viewMode === 'GRID' ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 content-start">
                        {cards.map(card => (
                            <button
                                key={card.id}
                                onClick={() => handleCardClick(card.id)}
                                disabled={card.state === 'matched'}
                                title={card.fullText}
                                className={`
                                    min-h-[3rem] p-2 rounded-lg border text-[11px] md:text-xs font-medium leading-tight flex items-center justify-center text-center transition-all duration-300 relative overflow-hidden break-words
                                    ${card.state === 'hidden' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200' : ''}
                                    ${card.state === 'selected' ? 'bg-primary border-primary text-white scale-105 shadow-lg shadow-primary/20 z-10' : ''}
                                    ${card.state === 'matched' ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400 opacity-60' : ''}
                                    ${card.state === 'mismatch' ? 'bg-orange-900/50 border-orange-500 text-orange-200 animate-pulse' : ''}
                                `}
                            >
                                {card.text}
                            </button>
                        ))}
                        {cards.length === 0 && (
                            <div className="col-span-full text-center text-slate-500 py-12">
                                No pairs data available for this unit.
                            </div>
                        )}
                    </div>
                ) : (
                    // SOLVED LIST VIEW
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {activeUnit?.wordPairs?.map((pair, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 bg-slate-900/50 border border-slate-800 p-3 rounded-lg hover:border-emerald-500/30 transition-colors group">
                                <div className="flex-1">
                                    <span className="text-xs font-bold text-emerald-400 block mb-1">Concept</span>
                                    <span className="text-sm text-slate-200">{pair.a}</span>
                                </div>
                                <div className="hidden md:block text-slate-600">
                                    <ArrowRight size={14} className="group-hover:text-emerald-500 transition-colors" />
                                </div>
                                <div className="flex-1 md:text-right border-t md:border-t-0 border-slate-800 pt-2 md:pt-0">
                                    <span className="text-xs font-bold text-secondary block mb-1">Definition</span>
                                    <span className="text-sm text-slate-300">{pair.b}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main Container ---
export const ZenPulse: React.FC = () => {
  const { status, endZenPulse } = useGenius();
  const [mode, setMode] = useState<ZenMode>('MENU');
  const [timer, setTimer] = useState(DEFAULT_DURATION_MINUTES * 60);
  const [rememberChoice, setRememberChoice] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mode === 'COUNTDOWN' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [mode, timer]);

  if (status !== SessionStatus.ZEN_PULSE) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
            <Brain size={24} className="text-primary animate-pulse" />
            <span className="text-sm font-bold tracking-widest text-slate-300">ZEN PULSE</span>
        </div>
        <button 
            onClick={endZenPulse} 
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 hover:bg-slate-800 rounded-full pl-4 pr-2 py-2 border border-slate-800"
        >
            <span className="text-xs font-bold uppercase">Return to Focus</span>
            <div className="bg-slate-800 group-hover:bg-slate-700 p-1 rounded-full">
                <X size={16} />
            </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div id="zen-pulse-container" className="w-full max-w-5xl h-full max-h-[80vh] bg-surface/50 border border-slate-800 rounded-2xl p-6 md:p-12 shadow-2xl overflow-y-auto scrollbar-hide relative flex flex-col">
        
        {/* Helper Explainer */}
        <div className="mb-6">
             <StageExplainer id="zen_pulse" title="Protocol: Consolidation" className="max-w-xl mx-auto">
                 Cognitive load is peaking. Use these active recovery protocols to shift into 'Diffuse Mode' and allow neural pathways to solidify.
             </StageExplainer>
        </div>

        {/* MENU MODE */}
        {mode === 'MENU' && (
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center">
                
                <button 
                    onClick={() => setMode('COUNTDOWN')}
                    className="h-64 flex flex-col items-center justify-center gap-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-primary hover:bg-slate-800/80 transition-all group"
                >
                    <div className="p-4 rounded-full bg-slate-800 group-hover:bg-primary/20 group-hover:text-primary transition-colors text-slate-400">
                        <Hourglass size={32} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-light text-slate-200 mb-1">Countdown</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Non-Sleep Deep Rest</p>
                    </div>
                </button>

                <button 
                    onClick={() => setMode('CONNECTIONS')}
                    className="h-64 flex flex-col items-center justify-center gap-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-accent hover:bg-slate-800/80 transition-all group"
                >
                    <div className="p-4 rounded-full bg-slate-800 group-hover:bg-accent/20 group-hover:text-accent transition-colors text-slate-400">
                        <Network size={32} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-light text-slate-200 mb-1">Connections</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Associative Mapping</p>
                    </div>
                </button>

                <button 
                    onClick={() => setMode('PAIRS')}
                    className="h-64 flex flex-col items-center justify-center gap-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500 hover:bg-slate-800/80 transition-all group"
                >
                    <div className="p-4 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 group-hover:text-emerald-500 transition-colors text-slate-400">
                        <Wind size={32} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-light text-slate-200 mb-1">Recall Pairs</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Semantic Matching</p>
                    </div>
                </button>

            </div>
            
            <div className="flex justify-center mt-8">
                <button 
                    onClick={() => setRememberChoice(!rememberChoice)}
                    className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors bg-slate-900/50 px-3 py-2 rounded-full border border-slate-800"
                >
                    {rememberChoice ? <CheckSquare size={14} className="text-primary" /> : <Square size={14} />}
                    Remember chosen protocol
                </button>
            </div>
          </div>
        )}

        {/* ACTIVE MODES */}
        {mode !== 'MENU' && (
            <div className="flex-1 flex flex-col h-full relative">
                {/* Back Button */}
                <button 
                    onClick={() => setMode('MENU')}
                    className="absolute top-0 left-0 z-20 flex items-center gap-2 text-xs text-slate-500 hover:text-white uppercase tracking-widest"
                >
                    <SkipForward size={12} className="rotate-180" /> Change Protocol
                </button>

                <div className="flex-1 pt-8 h-full">
                    {mode === 'COUNTDOWN' && <ZenCountdown timeLeft={timer} />}
                    {mode === 'CONNECTIONS' && <ZenConnections />}
                    {mode === 'PAIRS' && <ZenPairs />}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};