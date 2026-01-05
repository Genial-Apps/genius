import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { LearningPhase, SessionStatus, UserState, LearningUnit, SprintLog, LogEntry, UserPreferences, ScopingData, ScopedGoal, LearningProgram } from '../types';
import { geniusEngine } from '../services/geminiService';

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
  
  // Dev / Debug State
  isDevMode: boolean;
  showDebugLogs: boolean;
  logs: LogEntry[];
  toggleDevMode: () => void;
  toggleDebugLogs: () => void;
  
  // Actions
  updatePreferences: (prefs: UserPreferences) => void;
  updateName: (name: string) => void;
  setComplexityLevel: (level: 'Beginner' | 'Intermediate' | 'Expert') => void;
  
  // Program Actions
  initializeProgram: (topic: string) => Promise<void>;
  resumeProgram: (programId: string) => Promise<void>;
  prepareSprint: (topic: string) => Promise<void>;
  
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
  const [showDebugLogs, setShowDebugLogs] = useState(false);
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
    });
  }, []);

  const toggleDevMode = useCallback(() => setIsDevMode(prev => !prev), []);
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
    setIsScoping(true);
    setPhase(LearningPhase.SCOPING);
    
    // Generate Syllabus first
    const syllabus = await geniusEngine.generateSyllabus(topic, complexityLevel);
    
    const newProgram: LearningProgram = {
        id: crypto.randomUUID(),
        topic,
        syllabus,
        currentSessionIndex: 0,
        status: 'ACTIVE',
        lastEngagedAt: Date.now(),
        progress: 0
    };

    setPrograms(prev => [newProgram, ...prev]);
    setUserState(prev => ({ ...prev, activeProgramId: newProgram.id, currentSubject: topic }));

    // Now start scoping for Session 1
    await _startScopingForSession(newProgram, 0);
  };

  // 2. Resume Existing Program -> Scoping Next Session
  const resumeProgram = async (programId: string) => {
     const program = programs.find(p => p.id === programId);
     if (!program) return;

     if (program.currentSessionIndex >= 7) {
         // Completed program, do nothing or reset?
         return;
     }

     setPhase(LearningPhase.SCOPING);
     setIsScoping(true);
     setUserState(prev => ({ ...prev, activeProgramId: program.id, currentSubject: program.topic }));

     await _startScopingForSession(program, program.currentSessionIndex);
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

      try {
        const data = await geniusEngine.performInitialScoping(
            sessionTopic, 
            userState.preferences,
            sessionIndex,
            7,
            program.topic
        );
        setScopingData(data);
      } catch (e) {
        console.error("Scoping error", e);
        // Fallback
        setScopingData({
            complexity: 'Analysis Failed (Offline Mode)',
            thresholdConcepts: ['Core Principle 1', 'Core Principle 2', 'Synthesis'],
            goals: [
                { id: 'err-1', text: 'Identify core concepts', isSelected: true, priority: 'Critical' },
                { id: 'err-2', text: 'Understand structural dynamics', isSelected: true, priority: 'Useful' },
                { id: 'err-3', text: 'Apply learning to context', isSelected: true, priority: 'Useful' }
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

  // Placeholder for the old API
  const prepareSprint = async (topic: string) => {
      // Not used anymore directly, kept for safety or redirected
      await initializeProgram(topic);
  }

  return (
    <GeniusContext.Provider value={{
      phase, status, userState, activeUnit, scopingData, currentLog, timer, hasOnboarded, 
      isGenerating, isScoping, loadingProgress, complexityLevel,
      isDevMode, showDebugLogs, logs, toggleDevMode, toggleDebugLogs,
      programs, roadmap, sprintHistory, addRoadmapItem, deleteRoadmapItem,
      prepareSprint, initializeProgram, resumeProgram,
      updateScopingGoals, launchSprint, triggerZenPulse, endZenPulse, completeSprint, 
      setPhase, completeOnboarding, updatePreferences, updateName, dismissExplainer, setComplexityLevel
    }}>
      {children}
    </GeniusContext.Provider>
  );
};

export const useGenius = () => {
  const context = useContext(GeniusContext);
  if (!context) throw new Error("useGenius must be used within a GeniusProvider");
  return context;
};