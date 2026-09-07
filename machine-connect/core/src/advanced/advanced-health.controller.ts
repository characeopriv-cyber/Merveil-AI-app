import { Controller, Get } from '@nestjs/common';
import { AdvancedHealthService } from './advanced-health.service';

@Controller('api/advanced')
export class AdvancedHealthController {
  constructor(private readonly health: AdvancedHealthService) {}

  @Get('health')
  healthcheck() {
    return this.health.snapshot();
  }
}
