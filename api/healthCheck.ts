import { withJsonHandler } from './_lib/genaiClient';

export default withJsonHandler(async () => ({
  ok: true,
  region: 'vercel',
  timestamp: Date.now()
}));
