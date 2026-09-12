import service from '../server/developer-build-execution.js';
import { sendJson } from '../lib/supabaseServer.js';

export default async function handler(req, res) {
  try {
    const result = await service(req, res);
    return sendJson(res, result.status, result.body);
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'Developer build execution failed' });
  }
}
