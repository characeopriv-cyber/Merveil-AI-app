import { Module, forwardRef } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { ClosedLoopService } from './closed-loop.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineModule } from '../machine/machine.module';
import { CommandModule } from '../command/command.module';
import { TwinModule } from '../twin/twin.module';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [PersistenceModule, MachineModule, CommandModule, TwinModule, forwardRef(() => WorkflowModule)],
  controllers: [OperationsController],
  providers: [OperationsService, ClosedLoopService],
  exports: [OperationsService, ClosedLoopService],
})
export class OperationsModule {}
