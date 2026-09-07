import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { MachineModule } from '../machine/machine.module';
import { PolicyService } from '../safety/policy.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [MachineModule, PersistenceModule],
  controllers: [CommandController],
  providers: [CommandService, PolicyService],
  exports: [CommandService],
})
export class CommandModule {}
