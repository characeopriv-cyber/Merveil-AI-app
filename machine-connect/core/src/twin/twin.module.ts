import { Module } from '@nestjs/common';
import { MachineModule } from '../machine/machine.module';
import { TwinController } from './twin.controller';
import { TwinService } from './twin.service';

@Module({
  imports: [MachineModule],
  controllers: [TwinController],
  providers: [TwinService],
  exports: [TwinService],
})
export class TwinModule {}
