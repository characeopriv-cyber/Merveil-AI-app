import health from '../server/merveil-v1/health.js';
import catalog from '../server/merveil-v1/catalog.js';
import profile from '../server/merveil-v1/profile.js';
import passport from '../server/merveil-v1/passport.js';
import connect from '../server/merveil-v1/connect.js';
import messages from '../server/merveil-v1/messages.js';
import ai from '../server/merveil-v1/ai.js';
import call from '../server/merveil-v1/call.js';
import companies from '../server/merveil-v1/companies.js';
import properties from '../server/merveil-v1/properties.js';
import world from '../server/merveil-v1/world.js';
import investors from '../server/merveil-v1/investors.js';
import credits from '../server/merveil-v1/credits.js';
import verification from '../server/merveil-v1/verification.js';
import oauth from '../server/merveil-v1/oauth.js';
import webhooks from '../server/merveil-v1/webhooks.js';
import apps from '../server/merveil-v1/apps.js';
import usage from '../server/merveil-v1/usage.js';
import commercial from '../server/merveil-v1/commercial.js';
import billing from '../server/merveil-v1/billing.js';
import developerConfig from '../server/merveil-v1/developer/config.js';
import { json, requestId } from '../server/merveil-v1/_lib.js';

const routes = new Map([
  ['health', health], ['catalog', catalog], ['profile', profile], ['passport', passport],
  ['connect', connect], ['messages', messages], ['ai', ai], ['call', call],
  ['companies', companies], ['properties', properties], ['world', world],
  ['investors', investors], ['credits', credits], ['verification', verification],
  ['oauth', oauth], ['webhooks', webhooks], ['apps', apps], ['usage', usage],
  ['organization', commercial], ['organizations', commercial], ['billing', billing],
  ['developer/config', developerConfig]
]);

function routeFromRequest(req) {
  const raw = req.query?.route;
  if (Array.isArray(raw)) return raw.join('/');
  if (raw) return String(raw).replace(/^\/+|\/+$/g, '');
  const pathname = String(req.url || '').split('?')[0];
  const marker = '/api/v1/';
  const index = pathname.indexOf(marker);
  return index >= 0 ? pathname.slice(index + marker.length).replace(/\/+$/g, '') : '';
}

export default async function handler(req, res) {
  requestId(req, res);
  const route = routeFromRequest(req);
  const target = routes.get(route);
  if (!target) return json(res, 404, { error: 'not_found', message: 'Unknown Merveil API v1 endpoint', request_id: req._merveilRequestId });
  try { return await target(req, res); }
  catch (error) { console.error('[merveil-api-v1]', route, error); return json(res, 500, { error: 'internal_server_error', request_id: req._merveilRequestId }); }
}
