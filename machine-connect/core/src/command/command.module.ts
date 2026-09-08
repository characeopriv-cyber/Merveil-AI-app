import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { CommandDispatcherService } from './command-dispatcher.service';
import { CommandRetryWorker } from './command-retry.worker';
import { MachineModule } from '../machine/machine.module';
import { PolicyService } from '../safety/policy.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { EmergencyStopModule } from '../safety/emergency-stop.module';
import { MachineAckModule } from '../security/machine-ack.module';

@Module({
  imports: [MachineModule, PersistenceModule, EmergencyStopModule, MachineAckModule],
  controllers: [CommandController],
  providers: [CommandService, CommandDispatcherService, CommandRetryWorker, PolicyService],
  exports: [CommandService, CommandDispatcherService],
})
export class CommandModule {}
