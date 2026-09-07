import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { MachineCredentialsController } from './machine-credentials.controller';
import { MachineCredentialsService } from './machine-credentials.service';

@Module({
  imports: [PersistenceModule],
  controllers: [MachineCredentialsController],
  providers: [MachineCredentialsService],
  exports: [MachineCredentialsService],
})
export class MachineCredentialsModule {}
