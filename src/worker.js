import { Container, getContainer } from '@cloudflare/containers';

export class MachineConnectContainer extends Container {
  defaultPort = 4100;
  sleepAfter = '30m';
  enableInternet = true;

  envVars = {
    NODE_ENV: 'production',
    MACHINE_CONNECT_PORT: '4100',
  };
}

async function requiredSecret(binding, name) {
  const value = await binding.get();
  if (!value) throw new Error(`${name} is not configured in Cloudflare Secrets Store`);
  return value;
}

export default {
  async fetch(request, runtimeEnv) {
    const url = new URL(request.url);

    if (url.pathname === '/api/machine-connect' || url.pathname.startsWith('/api/machine-connect/')) {
      const upstream = new URL(url);
      upstream.pathname = url.pathname.replace(/^\/api\/machine-connect/, '') || '/';

      const container = getContainer(runtimeEnv.MACHINE_CONNECT, 'core');

      await container.startAndWaitForPorts({
        startOptions: {
          envVars: {
            SUPABASE_URL: await requiredSecret(runtimeEnv.SUPABASE_URL_STORE, 'SUPABASE_URL'),
            SUPABASE_SERVICE_ROLE_KEY: await requiredSecret(
              runtimeEnv.SUPABASE_SERVICE_ROLE_KEY_STORE,
              'SUPABASE_SERVICE_ROLE_KEY',
            ),
          },
        },
      });

      return container.fetch(new Request(upstream, request));
    }

    return runtimeEnv.ASSETS.fetch(request);
  },
};
