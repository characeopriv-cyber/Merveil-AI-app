import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { OperationsService } from './operations.service';

@Controller('api/operations')
export class OperationsController {
  constructor(private readonly operations: OperationsService) {}

  @Post('events')
  publish(@Req() req: any, @Body() body: any) {
    return this.operations.publish({ ...body, tenantId: req.principal?.tenantId ?? body.tenantId });
  }

  @Post('rules')
  createRule(@Req() req: any, @Body() body: any) {
    return this.operations.createRule({ ...body, tenantId: req.principal?.tenantId ?? body.tenantId });
  }

  @Get('health')
  health() {
    return { service: 'operations', status: 'ready', bounded: true };
  }

  @Post('machines/:machineId/evaluate')
  evaluate(@Req() req: any, @Param('machineId') machineId: string, @Body() body: any) {
    return this.operations.publish({ ...body, machineId, tenantId: req.principal?.tenantId ?? body.tenantId });
  }
}
