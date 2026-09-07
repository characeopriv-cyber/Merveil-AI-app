import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { OffensiveSecurityService } from './offensive-security.service';

@Controller('api/security/offensive')
export class OffensiveSecurityController {
  constructor(private readonly service: OffensiveSecurityService) {}

  @Post('jobs')
  create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-actor-id') requestedBy: string,
    @Body() body: {
      name: string;
      scanType: 'network' | 'web' | 'api' | 'cloud';
      mode: 'discovery' | 'assessment' | 'validation';
      targets: { target: string; targetType: 'ip' | 'cidr' | 'domain' | 'url' | 'cloud-account' }[];
    },
  ) {
    return this.service.createJob({ ...body, tenantId, requestedBy });
  }

  @Get('jobs')
  list(@Headers('x-tenant-id') tenantId: string) {
    return this.service.listJobs(tenantId);
  }

  @Get('jobs/:jobId')
  get(@Headers('x-tenant-id') tenantId: string, @Param('jobId') jobId: string) {
    const job = this.service.getJob(jobId, tenantId);
    if (!job) return { error: 'not_found' };
    return job;
  }

  @Post('jobs/:jobId/approve')
  approve(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') approverId: string, @Param('jobId') jobId: string) {
    return this.service.approveJob(jobId, tenantId, approverId);
  }
}
