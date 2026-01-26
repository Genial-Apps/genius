import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

let cachedKey: string | null = null;
let cachedClient: GoogleGenAI | null = null;

const requireKey = (): string => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY is missing. Set it in your Vercel project settings.');
  }
  return key;
};

export const getClient = () => {
  const key = requireKey();
  if (!cachedClient || cachedKey !== key) {
    cachedClient = new GoogleGenAI({ apiKey: key });
    cachedKey = key;
  }
  return cachedClient;
};

type Handler<TPayload, TResult> = (payload: TPayload) => Promise<TResult>;

type Method = 'POST' | 'OPTIONS';

const applyCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
};

export const withJsonHandler = <TPayload, TResult>(handler: Handler<TPayload, TResult>) =>
  async (req: VercelRequest, res: VercelResponse) => {
    const method = (req.method || 'GET').toUpperCase() as Method | string;
    applyCors(res);

    if (method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (method !== 'POST') {
      res.status(405).json({ error: { message: 'Method not allowed. Use POST.' } });
      return;
    }

    try {
      const payload = (req.body || {}) as TPayload;
      const result = await handler(payload);
      res.status(200).json({ result });
    } catch (error: any) {
      const message = error?.message || 'Unexpected error';
      const stack = error?.stack || 'No stack trace available';
      console.error('Serverless handler failed', { message, stack });
      res.status(500).json({ error: { message, stack } });
    }
  };

export const normalizeTitle = (raw: unknown, fallback: string) => {
  const base = typeof raw === 'string' ? raw : '';
  let title = (base || fallback || 'Program').trim();

  title = title
    .replace(/[+]/g, ' ')
    .replace(/^[`"']+|[`"']+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const suspiciousMarkers = ['return only', 'schema', 'session 1', 'complexity level', 'act as', 'protocol', '{', '}', '"syllabus"', '"title"'];
  const lower = title.toLowerCase();
  const looksSuspicious = suspiciousMarkers.some((m) => lower.includes(m));
  if (looksSuspicious || title.length > 80) {
    const words = title
      .replace(/[\{\}\[\]\(\):,._/\\|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((w) => w.trim())
      .filter(Boolean)
      .filter((w) => w.length <= 24)
      .filter((w) => !/(plus){2,}/i.test(w))
      .filter((w) => /^[a-z0-9\-']+$/i.test(w));

    title = words.slice(0, 6).join(' ').trim();
  }

  if (title.split(' ').filter(Boolean).length < 2) {
    title = (fallback || 'Program').trim();
  }
  if (title.length > 80) title = title.slice(0, 80).trim();
  return title;
};

export const normalizeSyllabus = (raw: unknown) => {
  if (!Array.isArray(raw)) return [] as string[];
  return raw
    .filter((x) => typeof x === 'string')
    .map((x: string) => x.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 7);
};
