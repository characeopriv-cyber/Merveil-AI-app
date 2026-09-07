import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { MachineService } from '../machine/machine.service';
import { PolicyService } from '../safety/policy.service';

@Module({
  controllers: [CommandController],
  providers: [CommandService, MachineService, PolicyService],
})
export class CommandModule {}
