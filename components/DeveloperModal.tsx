import React, { useState } from 'react';
import { useGenius } from '../store/GeniusContext';
import { X, Map, History, Trash2, Plus, Download, Bug, Terminal, Power, Database, Copy } from 'lucide-react';
import { toast } from '../services/toastService';

type Tab = 'CONTROLS' | 'ROADMAP' | 'HISTORY' | 'LOGS';

export const DeveloperModal: React.FC = () => {
    const { 
            isDeveloperModalOpen, setDeveloperModalOpen, developerModalTab, setDeveloperModalTab,
            isTestingMode, toggleTestingMode, 
            showDebugLogs, toggleDebugLogs,
            resetOnboarding, loadSampleData,
            roadmap, addRoadmapItem, deleteRoadmapItem, sprintHistory, logs
    } = useGenius();
  
  // Roadmap State
  const [roadmapHeading, setRoadmapHeading] = useState('');
  const [roadmapContent, setRoadmapContent] = useState('');

  if (!isDeveloperModalOpen) return null;

  const formatDateNZ = (ts: number) => {
      const d = new Date(ts);
      const day = d.getDate().toString().padStart(2, '0');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mon = months[d.getMonth()];
      const year = d.getFullYear().toString().slice(-2);
      return `${day}-${mon}-${year}`;
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
      a.download = `genius_roadmap_${formatDateNZ(Date.now())}.md`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-primary/30 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900 z-10 flex flex-col">
            <div className="p-6 flex justify-between items-center pb-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
                    <Terminal size={20} className="text-primary" /> Developer Console
                </h2>
                <button onClick={() => setDeveloperModalOpen(false)} className="text-slate-500 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            
                <div className="flex px-6 gap-6">
                <button 
                    onClick={() => setDeveloperModalTab('CONTROLS')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${developerModalTab === 'CONTROLS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    System Controls
                </button>
                <button 
                    onClick={() => setDeveloperModalTab('ROADMAP')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${developerModalTab === 'ROADMAP' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Roadmap
                </button>
                <button 
                    onClick={() => setDeveloperModalTab('HISTORY')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${developerModalTab === 'HISTORY' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Archives
                </button>
                <button 
                    onClick={() => setDeveloperModalTab('LOGS')}
                    className={`pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${developerModalTab === 'LOGS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    Logs
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-hide">
            
            {/* --- CONTROLS TAB --- */}
            {developerModalTab === 'CONTROLS' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Testing Mode Toggle */}
                        <div className={`p-6 rounded-xl border-2 transition-all ${isTestingMode ? 'border-accent bg-accent/10' : 'border-slate-800 bg-slate-900/50'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Bug size={20} /> Testing Mode
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Bypasses AI generation. Uses mock data for Scoping and Sprints. Enables "Skip" buttons in all phases.
                                    </p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${isTestingMode ? 'bg-accent animate-pulse' : 'bg-slate-700'}`} />
                            </div>
                            <button 
                                onClick={toggleTestingMode}
                                className={`w-full py-3 rounded-lg font-bold transition-all ${isTestingMode ? 'bg-accent text-black hover:bg-amber-400' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                            >
                                {isTestingMode ? 'DISABLE TESTING MODE' : 'ENABLE TESTING MODE'}
                            </button>
                        </div>

                         {/* Debug Logs Toggle */}
                         <div className={`p-6 rounded-xl border-2 transition-all ${showDebugLogs ? 'border-primary bg-primary/10' : 'border-slate-800 bg-slate-900/50'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Terminal size={20} /> Live Logger
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Shows the floating log console at the bottom of the screen. Tracks all Engine events.
                                    </p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${showDebugLogs ? 'bg-primary animate-pulse' : 'bg-slate-700'}`} />
                            </div>
                            <button 
                                onClick={toggleDebugLogs}
                                className={`w-full py-3 rounded-lg font-bold transition-all ${showDebugLogs ? 'bg-primary text-white hover:bg-teal-500' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                            >
                                {showDebugLogs ? 'HIDE LOGS' : 'SHOW LOGS'}
                            </button>
                        </div>
                    </div>

                    {/* Data Injection */}
                    <div className="border-t border-slate-800 pt-8">
                        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">Data Injection</h3>
                        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 flex items-center justify-between">
                             <div>
                                <h4 className="text-white font-bold flex items-center gap-2"><Database size={16}/> Seed Sample Data</h4>
                                <p className="text-xs text-slate-500 mt-1">Loads 3 active and 4 completed sample trajectories.</p>
                             </div>
                             <button 
                                onClick={() => {
                                    if(window.confirm("Load sample data? This will overwrite existing programs.")) {
                                        loadSampleData();
                                        setDeveloperModalOpen(false);
                                    }
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                             >
                                 LOAD SAMPLES
                             </button>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-8">
                        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest mb-4">Danger Zone</h3>
                         <button 
                            onClick={() => {
                                if (window.confirm("Reset all onboarding data? This will return you to the calibration wizard.")) {
                                    resetOnboarding();
                                    setDeveloperModalOpen(false);
                                }
                            }}
                            className="flex items-center gap-2 text-red-400 hover:text-red-300 border border-red-900/50 hover:bg-red-900/20 px-4 py-3 rounded-lg transition-colors w-full md:w-auto justify-center"
                        >
                            <Power size={16} /> RESTART ONBOARDING WIZARD
                        </button>
                    </div>

                </div>
            )}

            {/* --- ROADMAP TAB --- */}
            {developerModalTab === 'ROADMAP' && (
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
                             <h3 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-2"> Roadmap Items</h3>
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
                                <span className="text-[10px] text-slate-600 mt-2 block">{formatDateNZ(item.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- ARCHIVES TAB --- */}
            {developerModalTab === 'HISTORY' && (
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
                                    <span className="text-xs text-slate-500">{formatDateNZ(sprint.date)}</span>
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
            {/* --- LOGS TAB --- */}
            {developerModalTab === 'LOGS' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h3 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-2"> Engine Logs</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{logs.length} events</span>
                            <button onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
                                    toast({ title: 'Copied', message: 'Logs copied to clipboard', type: 'success', duration: 3000 });
                                } catch (e) {
                                    toast({ title: 'Copy failed', message: 'Unable to copy logs to clipboard', type: 'error', duration: 5000 });
                                }
                            }} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 flex items-center gap-2 text-xs">
                                <Copy size={14} /> Copy All
                            </button>
                        </div>
                    </div>

                    {logs.length === 0 && <div className="text-slate-600 italic">No logs yet.</div>}

                    <div className="space-y-3">
                        {logs.map(log => (
                            <div key={log.id} className="group border-l-2 pl-3 py-1 relative hover:bg-white/5 rounded-r">
                                <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${log.type === 'error' ? 'bg-red-500' : log.type === 'request' ? 'bg-blue-500' : log.type === 'response' ? 'bg-green-500' : 'bg-slate-500'}`} />
                                <div className="flex items-baseline justify-between mb-1">
                                    <span className={`uppercase font-bold ${log.type === 'error' ? 'text-red-400' : log.type === 'request' ? 'text-blue-400' : log.type === 'response' ? 'text-green-400' : 'text-slate-400'}`}>[{log.type}]</span>
                                    <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-slate-300 break-words">{log.message}</div>
                                {log.data && (
                                    <details className="mt-2">
                                        <summary className="cursor-pointer text-slate-500 hover:text-slate-300">View Data Payload</summary>
                                        <pre className="mt-2 p-2 bg-black/30 rounded text-slate-400 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(log.data, null, 2)}</pre>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};