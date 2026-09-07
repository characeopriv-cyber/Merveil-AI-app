import { Module } from '@nestjs/common';
import { MachineModule } from './machine/machine.module';
import { CommandModule } from './command/command.module';

@Module({
  imports: [MachineModule, CommandModule],
})
export class AppModule {}
