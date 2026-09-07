import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineModule } from '../machine/machine.module';
import { MachineCredentialsController } from './machine-credentials.controller';
import { MachineCredentialsService } from './machine-credentials.service';

@Module({
  imports: [PersistenceModule, MachineModule],
  controllers: [MachineCredentialsController],
  providers: [MachineCredentialsService],
  exports: [MachineCredentialsService],
})
export class MachineCredentialsModule {}
