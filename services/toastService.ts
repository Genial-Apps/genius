type ToastPayload = {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warn';
  duration?: number;
};

let _handler: ((p: ToastPayload) => void) | null = null;

export const registerToastHandler = (fn: (p: ToastPayload) => void) => {
  _handler = fn;
};

export const unregisterToastHandler = () => { _handler = null; };

export const toast = (p: ToastPayload) => {
  if (_handler) {
    try { _handler(p); } catch (e) { console.error('Toast handler error', e); }
  } else {
    // Fallback to console
    if (p.type === 'error') console.error('[TOAST]', p.title || 'Error', p.message);
    else console.info('[TOAST]', p.title || 'Info', p.message);
  }
};

export default toast;
