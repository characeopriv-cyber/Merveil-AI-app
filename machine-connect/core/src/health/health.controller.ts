import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'machine-connect-core',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  ready() {
    const supabaseConfigured = Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    return {
      status: supabaseConfigured ? 'ready' : 'degraded',
      service: 'machine-connect-core',
      persistence: supabaseConfigured ? 'configured' : 'not-configured',
      timestamp: new Date().toISOString(),
    };
  }
}
