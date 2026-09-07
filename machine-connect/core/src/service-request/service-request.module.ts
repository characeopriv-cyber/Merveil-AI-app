import { Module } from '@nestjs/common';
import { WorkflowModule } from '../workflow/workflow.module';
import { ServiceRequestController } from './service-request.controller';
import { ServiceRequestService } from './service-request.service';

@Module({
  imports: [WorkflowModule],
  controllers: [ServiceRequestController],
  providers: [ServiceRequestService],
  exports: [ServiceRequestService],
})
export class ServiceRequestModule {}
