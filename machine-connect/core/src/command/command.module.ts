import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { CommandDispatcherService } from './command-dispatcher.service';
import { MachineModule } from '../machine/machine.module';
import { PolicyService } from '../safety/policy.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { EmergencyStopModule } from '../safety/emergency-stop.module';

@Module({
  imports: [MachineModule, PersistenceModule, EmergencyStopModule],
  controllers: [CommandController],
  providers: [CommandService, CommandDispatcherService, PolicyService],
  exports: [CommandService, CommandDispatcherService],
})
export class CommandModule {}
