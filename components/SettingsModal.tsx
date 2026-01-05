import React, { useState } from 'react';
import { useGenius, RoadmapItem, ArchivedSprint } from '../store/GeniusContext';
import { UserPreferences } from '../types';
import { X, Sliders, Check, Layers, Zap, Clock, Activity, Map, History, Trash2, Plus, Download, FileText } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

type Tab = 'ENGINE' | 'ROADMAP' | 'HISTORY';

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
  const { userState, updatePreferences, roadmap, addRoadmapItem, deleteRoadmapItem, sprintHistory } = useGenius();
  const [activeTab, setActiveTab] = useState<Tab>('ENGINE');
  
  // Engine State
  const [prefs, setPrefs] = useState<UserPreferences>(userState.preferences);

  // Roadmap State
  const [roadmapHeading, setRoadmapHeading] = useState('');
  const [roadmapContent, setRoadmapContent] = useState('');

  const handleSaveEngine = () => {
    updatePreferences(prefs);
    onClose();
  };

  const handleAddRoadmap = () => {
      if (roadmapHeading && roadmapContent) {
          addRoadmapItem(roadmapHeading, roadmapContent);
          setRoadmapHeading('');
          setRoadmapContent('');
      }
  };

  const handleExportRoadmap = () => {
      const text = roadmap.map(item => `# ${item.heading}\n\n${item.content}\n\n---`).join('\n');
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `genius_roadmap_${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header with Tabs */}
        <div className="border-b border-slate-800 bg-slate-900 z-10 flex flex-col">
            <div className="p-6 flex justify-between items-center pb-2">
                <h2 className="text-xl font-light text-white flex items-center gap-2">
                    <Sliders size={20} className="text-primary" /> Control Center
                </h2>
                <button onClick={onClose} className="text-slate-500 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex px-6 gap-6">
                <button 
                    onClick={() => setActiveTab('ENGINE')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'ENGINE' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Calibration
                </button>
                <button 
                    onClick={() => setActiveTab('ROADMAP')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'ROADMAP' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Roadmap
                </button>
                <button 
                    onClick={() => setActiveTab('HISTORY')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === 'HISTORY' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Archives
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>

            {/* --- ENGINE TAB --- */}
            {activeTab === 'ENGINE' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-sm text-slate-400">
                        These settings adjust how the Genius Engine generates your learning sprints. Changing them will affect future sprints only.
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
            )}

            {/* --- ROADMAP TAB --- */}
            {activeTab === 'ROADMAP' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-800 space-y-3">
                        <input 
                            value={roadmapHeading}
                            onChange={(e) => setRoadmapHeading(e.target.value)}
                            placeholder="Objective Heading"
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-primary outline-none"
                        />
                        <textarea 
                            value={roadmapContent}
                            onChange={(e) => setRoadmapContent(e.target.value)}
                            placeholder="Detailed strategy or content..."
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-primary outline-none resize-none"
                        />
                        <div className="flex justify-end">
                            <button 
                                onClick={handleAddRoadmap}
                                disabled={!roadmapHeading || !roadmapContent}
                                className="bg-slate-700 hover:bg-primary text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                <Plus size={14} /> ADD TO ROADMAP
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                             <h3 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-2"><Map size={14}/> Trajectory</h3>
                             {roadmap.length > 0 && (
                                 <button onClick={handleExportRoadmap} className="text-xs text-primary hover:text-white flex items-center gap-1">
                                     <Download size={12} /> Export .MD
                                 </button>
                             )}
                        </div>
                        
                        {roadmap.length === 0 && <p className="text-slate-600 text-sm italic">No items yet.</p>}
                        
                        {roadmap.map(item => (
                            <div key={item.id} className="group relative bg-slate-800/20 border border-slate-800 hover:border-slate-600 p-4 rounded-lg transition-colors">
                                <button 
                                    onClick={() => deleteRoadmapItem(item.id)}
                                    className="absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <h4 className="font-bold text-slate-200 mb-1">{item.heading}</h4>
                                <p className="text-sm text-slate-400 whitespace-pre-wrap">{item.content}</p>
                                <span className="text-[10px] text-slate-600 mt-2 block">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- ARCHIVES TAB --- */}
            {activeTab === 'HISTORY' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                         <h3 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-2"><History size={14}/> Sprint Log</h3>
                    </div>

                    {sprintHistory.length === 0 && <p className="text-slate-600 text-sm italic">No sprints completed yet.</p>}

                    {sprintHistory.map(sprint => (
                        <div key={sprint.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-primary text-lg">{sprint.topic}</h4>
                                    <span className="text-xs text-slate-500">{new Date(sprint.date).toLocaleString()}</span>
                                </div>
                                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">
                                    {sprint.unit.complexity}
                                </span>
                            </div>
                            
                            <div className="mt-4 border-t border-slate-800 pt-3">
                                <h5 className="text-[10px] text-secondary uppercase tracking-widest mb-2 font-bold">Generated DLO Prompts</h5>
                                <div className="space-y-2">
                                    {sprint.prompts.map((p, idx) => (
                                        <div key={idx} className="text-[10px] font-mono bg-black/30 p-2 rounded text-slate-500 overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                                            {p}
                                        </div>
                                    ))}
                                    {sprint.prompts.length === 0 && <span className="text-xs text-slate-600">No prompts recorded.</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};