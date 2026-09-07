import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { OffensiveSecurityService } from './offensive-security.service';
import { Principal, requirePrincipal } from '../auth/principal';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/security/offensive')
export class OffensiveSecurityController {
  constructor(private readonly service: OffensiveSecurityService) {}

  @Post('jobs')
  create(@Req() req: RequestWithPrincipal, @Body() body: {
    name: string;
    scanType: 'network' | 'web' | 'api' | 'cloud';
    mode: 'discovery' | 'assessment' | 'validation';
    targets: { target: string; targetType: 'ip' | 'cidr' | 'domain' | 'url' | 'cloud-account' }[];
  }) {
    const principal = requirePrincipal(req.user);
    return this.service.createJob({ ...body, tenantId: principal.tenantId, requestedBy: principal.actorId });
  }

  @Get('jobs')
  list(@Req() req: RequestWithPrincipal) {
    return this.service.listJobs(requirePrincipal(req.user).tenantId);
  }

  @Get('jobs/:jobId')
  get(@Req() req: RequestWithPrincipal, @Param('jobId') jobId: string) {
    const job = this.service.getJob(jobId, requirePrincipal(req.user).tenantId);
    if (!job) return { error: 'not_found' };
    return job;
  }

  @Post('jobs/:jobId/approve')
  approve(@Req() req: RequestWithPrincipal, @Param('jobId') jobId: string) {
    const principal = requirePrincipal(req.user);
    return this.service.approveJob(jobId, principal.tenantId, principal.actorId);
  }
}
