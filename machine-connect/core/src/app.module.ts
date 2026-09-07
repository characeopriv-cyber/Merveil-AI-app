import { Module } from '@nestjs/common';
import { MachineController } from './machine/machine.controller';
import { MachineService } from './machine/machine.service';
import { PolicyService } from './safety/policy.service';

@Module({
  controllers: [MachineController],
  providers: [MachineService, PolicyService],
  exports: [MachineService, PolicyService],
})
export class AppModule {}
