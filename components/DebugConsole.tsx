import React, { useState } from 'react';
import { useGenius } from '../store/GeniusContext';
import { Terminal, X, ChevronDown, ChevronUp, Bug, Trash2 } from 'lucide-react';

export const DebugConsole: React.FC = () => {
  const { isDevMode, showDebugLogs, logs, toggleDevMode, toggleDebugLogs } = useGenius();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isDevMode) return null;

  return (
    <>
      {/* Dev Settings Modal / Toggle Area */}
      {isDevMode && !showDebugLogs && (
         <div className="fixed bottom-4 right-4 z-[9999]">
             <button 
                onClick={toggleDebugLogs}
                className="bg-slate-900 border border-primary/50 text-primary px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-xs font-mono hover:bg-slate-800"
             >
                 <Bug size={14} /> DEV MODE ACTIVE
             </button>
         </div>
      )}

      {/* Full Console */}
      {showDebugLogs && (
        <div className={`fixed bottom-0 left-0 right-0 z-[9999] bg-slate-950 border-t border-slate-800 shadow-2xl transition-all duration-300 ${isExpanded ? 'h-96' : 'h-12'}`}>
           {/* Toolbar */}
           <div className="h-12 bg-slate-900 flex items-center justify-between px-4 border-b border-slate-800">
               <div className="flex items-center gap-3">
                   <Terminal size={16} className="text-primary" />
                   <span className="font-mono text-sm font-bold text-slate-200">Genius Engine Logs</span>
                   <span className="bg-slate-800 text-xs px-2 py-0.5 rounded text-slate-400">{logs.length} events</span>
               </div>
               
               <div className="flex items-center gap-2">
                   <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:text-white text-slate-400">
                       {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                   </button>
                   <button onClick={toggleDevMode} className="p-1 hover:text-red-400 text-slate-400">
                       <X size={16} />
                   </button>
               </div>
           </div>

           {/* Log List */}
           {isExpanded && (
               <div className="h-[calc(100%-3rem)] overflow-y-auto p-4 space-y-3 font-mono text-xs">
                   {logs.length === 0 && (
                       <div className="text-slate-600 italic">No interactions recorded yet.</div>
                   )}
                   {logs.map((log) => (
                       <div key={log.id} className="group border-l-2 pl-3 py-1 relative hover:bg-white/5 rounded-r">
                           <div className={`
                               absolute left-0 top-0 bottom-0 w-0.5
                               ${log.type === 'error' ? 'bg-red-500' : 
                                 log.type === 'request' ? 'bg-blue-500' : 
                                 log.type === 'response' ? 'bg-green-500' : 'bg-slate-500'}
                           `} />
                           
                           <div className="flex items-baseline justify-between mb-1">
                               <span className={`uppercase font-bold ${
                                   log.type === 'error' ? 'text-red-400' : 
                                   log.type === 'request' ? 'text-blue-400' : 
                                   log.type === 'response' ? 'text-green-400' : 'text-slate-400'
                               }`}>
                                   [{log.type}]
                               </span>
                               <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                           </div>
                           
                           <div className="text-slate-300 break-words">{log.message}</div>
                           
                           {log.data && (
                               <details className="mt-2">
                                   <summary className="cursor-pointer text-slate-500 hover:text-slate-300">View Data Payload</summary>
                                   <pre className="mt-2 p-2 bg-black/30 rounded text-slate-400 overflow-x-auto whitespace-pre-wrap">
                                       {JSON.stringify(log.data, null, 2)}
                                   </pre>
                               </details>
                           )}
                       </div>
                   ))}
               </div>
           )}
        </div>
      )}
    </>
  );
};
