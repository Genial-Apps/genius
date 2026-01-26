import { withJsonHandler } from './_lib/genaiClient.js';

export default withJsonHandler(async () => ({
  ok: true,
  region: 'vercel',
  timestamp: Date.now()
}));
