import { Module } from '@nestjs/common';
import { ChrysalisController } from './chrysalis.controller';
import { ChrysalisService } from './chrysalis.service';
import { MachineModule } from '../machine/machine.module';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({
  imports: [PersistenceModule, MachineModule],
  controllers: [ChrysalisController],
  providers: [ChrysalisService],
  exports: [ChrysalisService],
})
export class ChrysalisModule {}
