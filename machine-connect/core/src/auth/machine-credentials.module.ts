import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineModule } from '../machine/machine.module';
import { SecurityEventModule } from '../security/security-event.module';
import { MachineCredentialsController } from './machine-credentials.controller';
import { MachineCredentialsService } from './machine-credentials.service';

@Module({
  imports: [PersistenceModule, MachineModule, SecurityEventModule],
  controllers: [MachineCredentialsController],
  providers: [MachineCredentialsService],
  exports: [MachineCredentialsService],
})
export class MachineCredentialsModule {}
