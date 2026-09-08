import { Module } from '@nestjs/common';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';
import { ClosedLoopService } from './closed-loop.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineModule } from '../machine/machine.module';
import { CommandModule } from '../command/command.module';
import { TwinModule } from '../twin/twin.module';

@Module({
  imports: [PersistenceModule, MachineModule, CommandModule, TwinModule],
  controllers: [OperationsController],
  providers: [OperationsService, ClosedLoopService],
  exports: [OperationsService, ClosedLoopService],
})
export class OperationsModule {}
