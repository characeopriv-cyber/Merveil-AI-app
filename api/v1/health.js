import { cors, json } from './_lib.js';

export default function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });
  return json(res, 200, {
    ok: true,
    service: 'Merveil API',
    version: 'v1',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
}
