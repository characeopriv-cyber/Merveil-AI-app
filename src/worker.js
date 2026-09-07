import { Container, getContainer } from '@cloudflare/containers';
import { env } from 'cloudflare:workers';

export class MachineConnectContainer extends Container {
  defaultPort = 4100;
  sleepAfter = '30m';
  enableInternet = true;

  envVars = {
    NODE_ENV: 'production',
    MACHINE_CONNECT_PORT: '4100',
    SUPABASE_URL: env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export default {
  async fetch(request, runtimeEnv) {
    const url = new URL(request.url);

    // Machine Connect is an integrated backend of the existing Developer Platform.
    // The public prefix is kept separate so existing Developer Platform APIs remain untouched.
    if (url.pathname === '/api/machine-connect' || url.pathname.startsWith('/api/machine-connect/')) {
      const upstream = new URL(url);
      upstream.pathname = url.pathname.replace(/^\/api\/machine-connect/, '') || '/';

      const container = getContainer(runtimeEnv.MACHINE_CONNECT, 'core');
      return container.fetch(new Request(upstream, request));
    }

    return runtimeEnv.ASSETS.fetch(request);
  },
};
