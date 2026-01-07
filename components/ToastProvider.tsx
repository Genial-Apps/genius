import React, { useEffect, useState } from 'react';
import { registerToastHandler, unregisterToastHandler } from '../services/toastService';

type Toast = { id: string; title?: string; message: string; type?: string; duration?: number };

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (p: { title?: string; message: string; type?: string; duration?: number }) => {
      const t: Toast = { id: crypto.randomUUID(), title: p.title, message: p.message, type: p.type || 'info', duration: p.duration || 5000 };
      setToasts(prev => [t, ...prev]);
      if (t.duration! > 0) {
        setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), t.duration);
      }
    };

    registerToastHandler(handler);
    return () => unregisterToastHandler();
  }, []);

  return (
    <>
      {children}
      <div className="fixed right-4 bottom-6 z-[9999] flex flex-col gap-3">
        {toasts.map(t => (
          <div key={t.id} className={`max-w-sm w-full px-4 py-3 rounded shadow-lg border ${t.type === 'error' ? 'bg-red-900/90 border-red-700' : 'bg-slate-900/95 border-slate-800'}`}>
            {t.title && <div className="font-bold text-sm">{t.title}</div>}
            <div className="text-sm text-slate-200 mt-1">{t.message}</div>
          </div>
        ))}
      </div>
    </>
  );
};

export default ToastProvider;
