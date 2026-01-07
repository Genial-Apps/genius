import React, { useEffect } from 'react';
import { GeniusProvider, useGenius } from './store/GeniusContext';
import { Dashboard } from './pages/Dashboard';
import { Session } from './pages/Session';
import { Consolidation } from './pages/Consolidation';
import { Scoping } from './pages/Scoping';
import { ZenPulse } from './components/ZenPulse';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { DebugConsole } from './components/DebugConsole';
import { DeveloperModal } from './components/DeveloperModal';
import { LearningPhase } from './types';

// Scroll Reset Component
const ScrollReset: React.FC = () => {
  const { phase } = useGenius();
  
  useEffect(() => {
    // Reset window scroll
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Reset internal scroll containers by ID
    const containers = ['main-scroll-container', 'scoping-left-panel', 'scoping-right-panel'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.scrollTop = 0;
    });
  }, [phase]);

  return null;
};

// Main Content Switcher based on Phase
const AppContent: React.FC = () => {
  const { phase } = useGenius();

  switch (phase) {
    case LearningPhase.INGESTION:
      return <Dashboard />;
    case LearningPhase.SCOPING:
      return <Scoping />;
    case LearningPhase.SPRINT:
      return <Session />;
    case LearningPhase.CONSOLIDATION:
      return <Consolidation />;
    default:
      return <Dashboard />;
  }
};

const MainLayout: React.FC = () => {
    const { hasOnboarded } = useGenius();
    
    return (
        <div className="antialiased text-slate-200 selection:bg-primary/30 selection:text-primary-100 min-h-screen bg-background">
            <ScrollReset />
            <ZenPulse /> 
            <DebugConsole />
            <DeveloperModal />
            {!hasOnboarded && <OnboardingOverlay />}
            <AppContent />
        </div>
    );
};

const App: React.FC = () => {
  return (
    <GeniusProvider>
      <MainLayout />
    </GeniusProvider>
  );
};

export default App;
