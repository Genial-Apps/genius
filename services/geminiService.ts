import { LearningUnit, ScopingData, ScopedGoal, SprintLog, UserPreferences } from '../types';

type LogCallback = (type: 'info' | 'request' | 'response' | 'error' | 'state', message: string, data?: any) => void;

const getBase = (): string => {
  try {
    // @ts-ignore
    const env = (import.meta as any)?.env;
    const v = env?.VITE_FUNCTIONS_BASE_URL || env?.VITE_FUNCTIONS_ORIGIN;
    if (v) return (v as string).replace(/\/$/, '');
  } catch (e) { /* ignore */ }
  return '/api';
};

const BASE = getBase();
export const FUNCTIONS_BASE = BASE;

// Build timestamp (can be overridden at build-time with VITE_BUILD_TIME)
const _env = (import.meta as any)?.env || {};
export const BUILD_TIME = _env?.VITE_BUILD_TIME || new Date().toISOString();
let logger: LogCallback | null = null;
export const setLogger = (cb: LogCallback | null) => { logger = cb; };

const log = (type: Parameters<LogCallback>[0], message: string, data?: any) => {
  if (logger) {
    try { logger(type, message, data); } catch { /* ignore */ }
  } else {
    if (type === 'error') console.error('[GENIUS]', message, data);
    else console.log('[GENIUS]', message, data);
  }
};

const callFunction = async (name: string, payload: any) => {
  const base = BASE;
  const url = `${base.replace(/\/$/, '')}/${name}`.replace(/:\/\//, '://');
  log('request', `POST ${url}`, payload);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  } catch (err) {
    // Network error, try fallback if available
    log('info', `Primary function URL failed, attempting fallback: ${err}`);
    // attempt fallback base from env: VITE_FUNCTIONS_EMULATOR or VITE_FUNCTIONS_PROJECT
    // @ts-ignore
    const env = (import.meta as any)?.env || {};
    const project = env?.VITE_FUNCTIONS_PROJECT as string | undefined;
    const emulator = env?.VITE_FUNCTIONS_EMULATOR as string | undefined;
    const fallbackBase = emulator ? emulator.replace(/\/$/, '') : (project ? `http://127.0.0.1:5001/${project}/us-central1` : undefined);
    if (!fallbackBase) {
      throw err;
    }
    const fallbackUrl = `${fallbackBase}/${name}`;
    log('request', `POST fallback ${fallbackUrl}`, payload);
    res = await fetch(fallbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
  }
  const text = await res.text();

  // When running Vite with `/api` proxy but the Functions emulator isn't running,
  // Vite commonly responds with a bare 500 and an empty body.
  if (!res.ok && res.status === 500 && (!text || text.trim() === '') && base === '/api') {
    const hint = 'Functions backend not reachable. Start the Functions emulator (`cd firebase/functions && npm run serve` or `firebase emulators:start --only functions`) and set `VITE_FUNCTIONS_ORIGIN=http://127.0.0.1:5001/<PROJECT_ID>/us-central1` before `npm run dev`.';
    log('error', hint, { status: res.status, body: null });
    throw new Error(hint);
  }

  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = { raw: text }; }
  if (!res.ok) {
    // A common misconfiguration in static hosting (e.g. GitHub Pages) is calling /api/* without
    // any server-side rewrites or a configured Functions origin/base URL.
    if (res.status === 405 && base === '/api') {
      const details = typeof json?.raw === 'string' ? json.raw.slice(0, 120) : undefined;
      const hint = 'Backend not configured: set VITE_FUNCTIONS_BASE_URL (or VITE_FUNCTIONS_ORIGIN) to your deployed Functions URL, or host behind Firebase Hosting rewrites for /api/*.';
      log('error', hint, { status: res.status, body: json, details });
      throw new Error(hint);
    }

    // if 404 try a secondary fallback if possible
    if (res.status === 404) {
      log('info', `Received 404 from ${url} for ${name}. Trying hosting-style /api/${name} fallback.`);
      try {
        const apiFallback = `/api/${name}`;
        const res2 = await fetch(apiFallback, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload || {}) });
        const text2 = await res2.text();
        let json2: any = null;
        try { json2 = text2 ? JSON.parse(text2) : null; } catch { json2 = { raw: text2 }; }
        if (res2.ok) {
          const result2 = json2?.result ?? json2;
          log('response', `Response from fallback /api/${name}`, result2);
          return result2;
        }
      } catch (e) {
        log('info', `Fallback /api/${name} also failed: ${e}`);
      }
    }

    const errMsg = json?.error?.message || `Function ${name} failed with ${res.status}`;
    log('error', errMsg, { status: res.status, body: json });
    throw new Error(errMsg);
  }
  const result = json?.result ?? json;
  log('response', `Response from ${name}`, result);
  return result;
};

export const checkBackendHealth = async (): Promise<{ ok: boolean; details?: any }> => {
  try {
    const r = await callFunction('healthCheck', {});
    return { ok: !!(r as any)?.ok, details: r };
  } catch (e: any) {
    return { ok: false, details: e?.message || String(e) };
  }
};

export const geniusEngine = {
  setLogger,
  resolveWebPageTitle: async (url: string) => {
    try {
      const r = await callFunction('resolveWebPageTitle', { url });
      return typeof r === 'string' ? r : (r as any)?.result ?? '';
    } catch (e: any) {
      log('error', `Title resolution error: ${e?.message || e}`, e);
      return 'External Resource';
    }
  },
  generateSyllabus: async (topic: string, complexity: string) => {
    const r = await callFunction('generateSyllabus', { topic, complexity });
    return r as { title: string; syllabus: string[] };
  },
  performInitialScoping: async (topic: string, prefs: UserPreferences, sessionIndex: number, totalSessions: number, programTopic: string) => {
    const payload = { topic, prefs, sessionIndex, totalSessions, programTopic };
    const r = await callFunction('performInitialScoping', payload);
    return r as ScopingData;
  },
  generateSprintContent: async (topic: string, priming: SprintLog['primingAnswers'], scopingData: ScopingData, prefs: UserPreferences) => {
    const payload = { topic, priming, scopingData, prefs };
    const r = await callFunction('generateSprintContent', payload);
    return r as LearningUnit;
  }
};
