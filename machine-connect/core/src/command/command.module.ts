import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { MachineModule } from '../machine/machine.module';
import { PolicyService } from '../safety/policy.service';

@Module({
  imports: [MachineModule],
  controllers: [CommandController],
  providers: [CommandService, PolicyService],
  exports: [CommandService],
})
export class CommandModule {}
