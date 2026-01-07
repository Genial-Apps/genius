import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { LearningPhase, SessionStatus, UserState, LearningUnit, SprintLog, LogEntry, UserPreferences, ScopingData, ScopedGoal, LearningProgram } from '../types';
import { geniusEngine } from '../services/geminiService';
import { toast } from '../services/toastService';

export interface RoadmapItem {
  id: string;
  heading: string;
  content: string;
  createdAt: number;
}

export interface ArchivedSprint {
  id: string;
  date: number;
  topic: string;
  unit: LearningUnit;
  prompts: string[];
}

interface GeniusContextType {
  phase: LearningPhase;
  status: SessionStatus;
  userState: UserState;
  activeUnit: LearningUnit | null;
  scopingData: ScopingData | null;
  currentLog: SprintLog | null;
  timer: number;
  hasOnboarded: boolean;
  isGenerating: boolean;
  isScoping: boolean; 
  loadingProgress: number; 
  complexityLevel: 'Beginner' | 'Intermediate' | 'Expert';
  
  // Data State
  programs: LearningProgram[];
  roadmap: RoadmapItem[];
  sprintHistory: ArchivedSprint[];
  addRoadmapItem: (heading: string, content: string) => void;
  deleteRoadmapItem: (id: string) => void;
  loadSampleData: () => void;
  
  // Dev / Debug State
  isDevMode: boolean;
  isTestingMode: boolean; 
  showDebugLogs: boolean;
  isDeveloperModalOpen: boolean;
  developerModalTab: string;
  logs: LogEntry[];
  toggleDevMode: () => void;
  toggleTestingMode: () => void;
  toggleDebugLogs: () => void;
  setDeveloperModalOpen: (open: boolean) => void;
  setDeveloperModalTab: (tab: string) => void;
  
  // Actions
  updatePreferences: (prefs: UserPreferences) => void;
  updateName: (name: string) => void;
  setComplexityLevel: (level: 'Beginner' | 'Intermediate' | 'Expert') => void;
  resetOnboarding: () => void;
  
  // Program Actions
  initializeProgram: (topic: string) => Promise<void>;
  resumeProgram: (programId: string) => Promise<void>;
  prepareSprint: (topic: string) => Promise<void>;
  refineSession: (newTopic: string) => Promise<void>; 
  
  updateScopingGoals: (goals: ScopedGoal[]) => void;
  launchSprint: (answers: SprintLog['primingAnswers']) => void;
  dismissExplainer: (id: string) => void;
  
  triggerZenPulse: () => void;
  endZenPulse: () => void;
  completeSprint: () => void;
  setPhase: (phase: LearningPhase) => void;
  completeOnboarding: () => void;
}

const GeniusContext = createContext<GeniusContextType | undefined>(undefined);

export const DEFAULT_PREFS: UserPreferences = {
  learningStyle: 'Textual',
  motivationTrigger: 'Goal-Oriented',
  attentionSpan: 'Deep Dive',
  complexityPreference: 'First Principles'
};

export const GeniusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<LearningPhase>(LearningPhase.INGESTION);
  const [status, setStatus] = useState<SessionStatus>(SessionStatus.IDLE);
  const [timer, setTimer] = useState<number>(10 * 60); 
  
  const [activeUnit, setActiveUnit] = useState<LearningUnit | null>(null);
  const [scopingData, setScopingData] = useState<ScopingData | null>(null);
  const [complexityLevel, setComplexityLevel] = useState<'Beginner' | 'Intermediate' | 'Expert'>('Intermediate');
  
  const [isGenerating, setIsGenerating] = useState(false); 
  const [isScoping, setIsScoping] = useState(false); 
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const [currentLog, setCurrentLog] = useState<SprintLog | null>(null);
  
  // Dev State
  const [isDevMode, setIsDevMode] = useState(false);
  const [isTestingMode, setIsTestingMode] = useState(false);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [isDeveloperModalOpen, setDeveloperModalOpen] = useState(false);
  const [developerModalTab, setDeveloperModalTab] = useState<string>('CONTROLS');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Persistent Data
  const [programs, setPrograms] = useState<LearningProgram[]>(() => {
      const saved = localStorage.getItem('genius_programs');
      return saved ? JSON.parse(saved) : [];
  });

  const [roadmap, setRoadmap] = useState<RoadmapItem[]>(() => {
      const saved = localStorage.getItem('genius_roadmap');
      return saved ? JSON.parse(saved) : [];
  });
  
  const [sprintHistory, setSprintHistory] = useState<ArchivedSprint[]>(() => {
      const saved = localStorage.getItem('genius_history');
      return saved ? JSON.parse(saved) : [];
  });

  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    const saved = localStorage.getItem('genius_onboarded');
    return saved === 'true';
  });
  
  const [userState, setUserState] = useState<UserState>(() => {
    const savedPrefs = localStorage.getItem('genius_prefs');
    const savedExpl = localStorage.getItem('genius_dismissed');
    const savedName = localStorage.getItem('genius_name') || 'Genius';
    return {
      name: savedName,
      elevation: 12, 
      streak: 3,
      currentSubject: null,
      activeProgramId: null,
      preferences: savedPrefs ? JSON.parse(savedPrefs) : DEFAULT_PREFS,
      dismissedExplainers: savedExpl ? JSON.parse(savedExpl) : []
    };
  });

  // Persist Programs
  useEffect(() => {
    localStorage.setItem('genius_programs', JSON.stringify(programs));
  }, [programs]);

  // Attach Logger
  useEffect(() => {
    geniusEngine.setLogger((type, message, data) => {
      const entry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type,
        message,
        data
      };
      setLogs(prev => [entry, ...prev]); 
      // Show a toast for errors
      if (type === 'error') {
        try { toast({ title: 'Error', message, type: 'error', duration: 8000 }); } catch (e) { console.error(e); }
      }
    });
  }, []);

  // Global window error handlers to capture uncaught errors and promise rejections
  useEffect(() => {
    const onErr = (ev: ErrorEvent) => {
      const msg = ev.message || 'Uncaught error';
      const entry: LogEntry = { id: crypto.randomUUID(), timestamp: Date.now(), type: 'error', message: `Uncaught: ${msg}`, data: { filename: ev.filename, lineno: ev.lineno, colno: ev.colno } };
      setLogs(prev => [entry, ...prev]);
      try { toast({ title: 'Uncaught Error', message: msg, type: 'error', duration: 10000 }); } catch {}
    };

    const onRej = (ev: PromiseRejectionEvent) => {
      const reason = (ev.reason && (ev.reason.message || JSON.stringify(ev.reason))) || 'Unhandled rejection';
      const entry: LogEntry = { id: crypto.randomUUID(), timestamp: Date.now(), type: 'error', message: `UnhandledRejection: ${reason}`, data: { reason: ev.reason } };
      setLogs(prev => [entry, ...prev]);
      try { toast({ title: 'Unhandled Rejection', message: reason, type: 'error', duration: 10000 }); } catch {}
    };

    window.addEventListener('error', onErr);
    window.addEventListener('unhandledrejection', onRej as any);
    return () => {
      window.removeEventListener('error', onErr);
      window.removeEventListener('unhandledrejection', onRej as any);
    };
  }, []);

  // State change logger: record high-level state transitions
  const _prevStateRef = useRef<any | null>(null);
  useEffect(() => {
    const snapshot = {
      phase,
      status,
      activeProgramId: userState?.activeProgramId,
      currentSubject: userState?.currentSubject,
      isScoping,
      isGenerating,
      isDevMode,
      isTestingMode,
      showDebugLogs,
      scopingSummary: scopingData ? { complexity: scopingData.complexity, goals: scopingData.goals?.length ?? 0 } : null,
      timestamp: Date.now()
    };

    const prev = _prevStateRef.current;
    if (prev) {
      const changed = Object.keys(snapshot).filter((k) => {
        try {
          return JSON.stringify(prev[k]) !== JSON.stringify(snapshot[k]);
        } catch {
          return prev[k] !== snapshot[k];
        }
      });

      if (changed.length) {
        const entry: LogEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: 'state',
          message: `State changed: ${changed.join(', ')}`,
          data: { before: prev, after: snapshot }
        };
        setLogs(prevLogs => [entry, ...prevLogs]);
      }
    }

    _prevStateRef.current = snapshot;
  }, [phase, status, userState, isScoping, isGenerating, isDevMode, isTestingMode, showDebugLogs, scopingData]);

  const toggleDevMode = useCallback(() => setIsDevMode(prev => !prev), []);
  const toggleTestingMode = useCallback(() => setIsTestingMode(prev => !prev), []);
  const toggleDebugLogs = useCallback(() => setShowDebugLogs(prev => !prev), []);

  const updatePreferences = (prefs: UserPreferences) => {
    setUserState(prev => ({ ...prev, preferences: prefs }));
    localStorage.setItem('genius_prefs', JSON.stringify(prefs));
  };

  const updateName = (name: string) => {
    setUserState(prev => ({ ...prev, name }));
    localStorage.setItem('genius_name', name);
  };

  const dismissExplainer = (id: string) => {
    setUserState(prev => {
        const newDismissed = [...prev.dismissedExplainers, id];
        localStorage.setItem('genius_dismissed', JSON.stringify(newDismissed));
        return { ...prev, dismissedExplainers: newDismissed };
    });
  };

  const addRoadmapItem = (heading: string, content: string) => {
      const newItem = { id: crypto.randomUUID(), heading, content, createdAt: Date.now() };
      setRoadmap(prev => {
          const updated = [newItem, ...prev];
          localStorage.setItem('genius_roadmap', JSON.stringify(updated));
          return updated;
      });
  };

  const deleteRoadmapItem = (id: string) => {
      setRoadmap(prev => {
          const updated = prev.filter(i => i.id !== id);
          localStorage.setItem('genius_roadmap', JSON.stringify(updated));
          return updated;
      });
  };

  const resetOnboarding = () => {
      setHasOnboarded(false);
      localStorage.removeItem('genius_onboarded');
  };

  const loadSampleData = () => {
      const samplePrograms: LearningProgram[] = [
          {
              id: 'sample-1',
              topic: 'Advanced Game Theory',
              syllabus: ['Foundations', 'Nash Equilibrium', 'Prisoners Dilemma', 'Applications', 'Evolutionary Strategy', 'Advanced', 'Mastery'],
              currentSessionIndex: 3,
              status: 'ACTIVE',
              lastEngagedAt: Date.now() - 86400000,
              progress: 42
          },
          {
              id: 'sample-2',
              topic: 'Neuromarketing',
              syllabus: ['Basics', 'Brain Structures', 'Attention', 'Memory', 'Emotion', 'Ethics', 'Integration'],
              currentSessionIndex: 1,
              status: 'ACTIVE',
              lastEngagedAt: Date.now() - 172800000,
              progress: 14
          },
          {
              id: 'sample-3',
              topic: 'Rust Programming',
              syllabus: ['Ownership', 'Borrowing', 'Lifetimes', 'Concurrency', 'Unsafe Rust', 'Macros', 'Final Project'],
              currentSessionIndex: 5,
              status: 'ACTIVE',
              lastEngagedAt: Date.now() - 3600000,
              progress: 71
          },
          {
              id: 'sample-4',
              topic: 'Stoicism',
              syllabus: [],
              currentSessionIndex: 7,
              status: 'COMPLETED',
              lastEngagedAt: Date.now() - 604800000,
              progress: 100
          },
          {
              id: 'sample-5',
              topic: 'Permaculture Design',
              syllabus: [],
              currentSessionIndex: 7,
              status: 'COMPLETED',
              lastEngagedAt: Date.now() - 1209600000,
              progress: 100
          },
          {
              id: 'sample-6',
              topic: 'Financial Literacy',
              syllabus: [],
              currentSessionIndex: 7,
              status: 'COMPLETED',
              lastEngagedAt: Date.now() - 2592000000,
              progress: 100
          },
          {
              id: 'sample-7',
              topic: 'Renaissance Art',
              syllabus: [],
              currentSessionIndex: 7,
              status: 'COMPLETED',
              lastEngagedAt: Date.now() - 5184000000,
              progress: 100
          }
      ];
      setPrograms(samplePrograms);
  };

  // Fake Loading Progress Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating || isScoping) {
        setLoadingProgress(0);
        interval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev >= 90) return prev; 
                const increment = Math.max(1, (90 - prev) / 10);
                return prev + increment;
            });
        }, 500);
    } else {
        setLoadingProgress(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating, isScoping]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (status === SessionStatus.FOCUS && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status, timer]);

  // --- PROGRAM LOGIC ---

  // 1. Create New Program -> Generate Syllabus -> Start Session 1
  const initializeProgram = async (topic: string) => {
    // IMMEDIATE TRANSITION: Create placeholder and switch phase to unblock UI
    const tempId = crypto.randomUUID();
    
    // Check if input is a URL
    let sourceUrl: string | undefined;
    try {
        const url = new URL(topic);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            sourceUrl = topic;
        }
    } catch {
        // Not a URL
    }

    const tempProgram: LearningProgram = {
        id: tempId,
        topic: topic, // Use input topic initially (URL or Text)
        sourceUrl: sourceUrl,
        syllabus: [], // Empty syllabus initially
        currentSessionIndex: 0,
        status: 'ACTIVE',
        lastEngagedAt: Date.now(),
        progress: 0
    };

    setPrograms(prev => [tempProgram, ...prev]);
    setUserState(prev => ({ ...prev, activeProgramId: tempId, currentSubject: topic }));
    
    // Switch to Scoping Phase immediately
    setPhase(LearningPhase.SCOPING);
    setIsScoping(true); // Starts the loader in the Scoping UI

    // START BACKGROUND AI PROCESS (Parallel)
    _performBackgroundInitialization(tempId, topic, complexityLevel, sourceUrl);
  };
  
  // Background Handler for Initialization
  const _performBackgroundInitialization = async (programId: string, topic: string, complexity: string, sourceUrl?: string) => {
      // 1. Kick off Title Resolution (Fire & Forget)
      if (sourceUrl) {
          geniusEngine.resolveWebPageTitle(sourceUrl).then(resolvedTitle => {
              setPrograms(prev => prev.map(p => p.id === programId ? { ...p, topic: resolvedTitle } : p));
              setUserState(prev => ({ ...prev, currentSubject: resolvedTitle }));
              setCurrentLog(prev => {
                  if (prev && prev.topicInput === sourceUrl) return { ...prev, topicInput: resolvedTitle };
                  return prev;
              });
          }).catch(err => console.error("Title resolution failed silently", err));
      }

      // 2. KICK OFF SCOPING IMMEDIATELY (Don't wait for Syllabus)
      // This is the critical fix for "Scoping takes too long".
      // We assume Session 1 context is just the topic itself.
      const mockProgramForScoping = { id: programId, topic: topic, syllabus: [topic] } as LearningProgram;
      const scopingPromise = _startScopingForSession(mockProgramForScoping, 0);

      // 3. Generate Syllabus (Slow, Parallel)
      geniusEngine.generateSyllabus(topic, complexity).then(({ title, syllabus }) => {
          setPrograms(prev => prev.map(p => 
            p.id === programId 
            ? { ...p, topic: title, syllabus } 
            : p
          ));
          if (!sourceUrl) { // Only overwrite title if it wasn't a URL resolved earlier
            setUserState(prev => ({ ...prev, currentSubject: title }));
          }
      }).catch(e => {
          console.error("Syllabus Gen Failed", e);
          const fallbackSyllabus = Array(7).fill("").map((_, i) => `Session ${i+1}: Core Concepts`);
           setPrograms(prev => prev.map(p => p.id === programId ? { ...p, syllabus: fallbackSyllabus } : p));
      });
      
      // Ensure scoping finishes or times out (handled inside _startScopingForSession)
      await scopingPromise;
  };

  // 2. Resume Existing Program -> Scoping Next Session
  const resumeProgram = async (programId: string) => {
     const program = programs.find(p => p.id === programId);
     if (!program) return;

     if (program.currentSessionIndex >= 7) {
         return;
     }

     setPhase(LearningPhase.SCOPING);
     setIsScoping(true);
     setUserState(prev => ({ ...prev, activeProgramId: program.id, currentSubject: program.topic }));

     // Fire and forget scoping
     _startScopingForSession(program, program.currentSessionIndex);
  };
  
  // 3. Refine Session Topic & Restart Scoping
  const refineSession = async (newTopic: string) => {
      const activeProgram = programs.find(p => p.id === userState.activeProgramId);
      if (!activeProgram) return;

      // 1. Update State
      setPrograms(prev => prev.map(p => {
          if (p.id === activeProgram.id) {
              const newSyllabus = [...p.syllabus];
              newSyllabus[p.currentSessionIndex] = newTopic;
              return { ...p, syllabus: newSyllabus };
          }
          return p;
      }));

      // 2. Re-run Scoping immediate with new topic
      setIsScoping(true);
      setScopingData(null);
      setCurrentLog(prev => prev ? ({ ...prev, topicInput: newTopic }) : null);

      try {
         // Always use Real AI
         const data = await geniusEngine.performInitialScoping(
            newTopic,
            userState.preferences,
            activeProgram.currentSessionIndex,
            7,
            activeProgram.topic
        );
        setScopingData(data);
      } catch (e) {
          console.error("Refine Scoping error", e);
          setScopingData({
            complexity: 'Analysis Failed',
            thresholdConcepts: ['Error'],
            goals: [{ id: 'err', text: 'Retry', isSelected: true, priority: 'Critical' }]
          });
      } finally {
          setIsScoping(false);
      }
  };

  // Internal Scoping Logic
  const _startScopingForSession = async (program: LearningProgram, sessionIndex: number) => {
      setScopingData(null);
      setActiveUnit(null);
      
      const sessionTopic = program.syllabus[sessionIndex];

      setCurrentLog({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topicInput: sessionTopic,
        primingAnswers: { relevance: '', relation: '', scope: '' }
      });

      // TIMEOUT PROMISE (15 seconds)
      const timeout = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error("Scoping Timed Out")), 15000)
      );

      try {
        // Race AI against timeout
        const data = await Promise.race([
             geniusEngine.performInitialScoping(
                sessionTopic, 
                userState.preferences,
                sessionIndex,
                7,
                program.topic
            ),
            timeout.then(() => { throw new Error("Timeout"); }) as Promise<ScopingData>
        ]);

        setScopingData(data);
      } catch (e) {
        console.error("Scoping error/timeout", e);
        // Fallback Data so user isn't stuck
        setScopingData({
            complexity: 'Analysis Incomplete',
            thresholdConcepts: ['Core Principle 1', 'Core Principle 2', 'Synthesis'],
            goals: [
                { id: 'err-1', text: 'Define core vocabulary', isSelected: true, priority: 'Critical' },
                { id: 'err-2', text: 'Understand key mechanisms', isSelected: true, priority: 'Useful' },
                { id: 'err-3', text: 'Apply concepts to context', isSelected: true, priority: 'Useful' }
            ]
        });
      } finally {
        setIsScoping(false);
      }
  };

  const updateScopingGoals = (goals: ScopedGoal[]) => {
      if (scopingData) {
          setScopingData({ ...scopingData, goals });
      }
  };

  // Step 3: Sprint Launch
  const launchSprint = async (answers: SprintLog['primingAnswers']) => {
    if (!currentLog?.topicInput || !scopingData) return;

    setPhase(LearningPhase.SPRINT);
    setStatus(SessionStatus.FOCUS);
    setIsGenerating(true);
    
    setCurrentLog(prev => prev ? ({ ...prev, primingAnswers: answers }) : null);

    try {
        // Always use Real AI
        const unit = await geniusEngine.generateSprintContent(
            currentLog.topicInput, 
            answers, 
            scopingData, 
            userState.preferences
        );
        
        setActiveUnit(unit);
        setTimer(unit.duration * 60 || 600);
    } catch (e) {
        console.error("Generation Error", e);
    } finally {
        setIsGenerating(false);
    }
  };

  const triggerZenPulse = () => setStatus(SessionStatus.ZEN_PULSE);
  const endZenPulse = () => status === SessionStatus.ZEN_PULSE && setStatus(SessionStatus.FOCUS);
  
  const completeSprint = () => {
    // 1. Log History
    if (activeUnit && currentLog) {
        const recentPrompts = logs
            .filter(l => l.type === 'request' && l.timestamp > currentLog.timestamp)
            .map(l => l.data?.prompt || l.message);

        const archive: ArchivedSprint = {
            id: crypto.randomUUID(),
            date: Date.now(),
            topic: activeUnit.title,
            unit: activeUnit,
            prompts: recentPrompts
        };

        setSprintHistory(prev => [archive, ...prev]);
        localStorage.setItem('genius_history', JSON.stringify([archive, ...sprintHistory]));
    }

    // 2. Update Program Progress
    if (userState.activeProgramId) {
        setPrograms(prev => prev.map(p => {
            if (p.id === userState.activeProgramId) {
                const nextIndex = p.currentSessionIndex + 1;
                const progress = Math.min(100, Math.round((nextIndex / 7) * 100));
                return {
                    ...p,
                    currentSessionIndex: nextIndex,
                    progress,
                    lastEngagedAt: Date.now(),
                    status: nextIndex >= 7 ? 'COMPLETED' : 'ACTIVE'
                };
            }
            return p;
        }));
    }

    // 3. Update User Stats & Transition
    setStatus(SessionStatus.COMPLETED);
    setPhase(LearningPhase.CONSOLIDATION);
    setUserState(prev => ({ ...prev, elevation: Math.min(prev.elevation + 5, 100) }));
  };

  const completeOnboarding = () => {
    setHasOnboarded(true);
    localStorage.setItem('genius_onboarded', 'true');
  };

  const prepareSprint = async (topic: string) => {
      await initializeProgram(topic);
  }

  return (
    <GeniusContext.Provider value={{
      phase, status, userState, activeUnit, scopingData, currentLog, timer, hasOnboarded, 
      isGenerating, isScoping, loadingProgress, complexityLevel,
      isDevMode, isTestingMode, showDebugLogs, isDeveloperModalOpen, logs, toggleDevMode, toggleTestingMode, toggleDebugLogs, setDeveloperModalOpen,
      developerModalTab, setDeveloperModalTab,
      programs, roadmap, sprintHistory, addRoadmapItem, deleteRoadmapItem, loadSampleData,
      prepareSprint, initializeProgram, resumeProgram, refineSession,
      updateScopingGoals, launchSprint, triggerZenPulse, endZenPulse, completeSprint, 
      setPhase, completeOnboarding, updatePreferences, updateName, dismissExplainer, setComplexityLevel, resetOnboarding
    }}>
      {children}
    </GeniusContext.Provider>
  );
};

export const useGenius = () => {
  const context = useContext(GeniusContext);
  if (context === undefined) {
    throw new Error('useGenius must be used within a GeniusProvider');
  }
  return context;
};