import { Module, forwardRef } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { ExecutionWorkerService } from './execution-worker.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { OperationsModule } from '../operations/operations.module';

@Module({
  imports: [PersistenceModule, forwardRef(() => OperationsModule)],
  controllers: [WorkflowController],
  providers: [WorkflowService, ExecutionWorkerService],
  exports: [WorkflowService],
})
export class WorkflowModule {}
