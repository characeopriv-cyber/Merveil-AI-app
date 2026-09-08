import { Module } from '@nestjs/common';
import { CommandController } from './command.controller';
import { CommandService } from './command.service';
import { CommandDispatcherService } from './command-dispatcher.service';
import { CommandRetryWorker } from './command-retry.worker';
import { MachineModule } from '../machine/machine.module';
import { PolicyService } from '../safety/policy.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { EmergencyStopModule } from '../safety/emergency-stop.module';
import { MachineCredentialsModule } from '../auth/machine-credentials.module';
import { MachineAckSignatureService } from '../security/machine-ack-signature.service';

@Module({
  imports: [MachineModule, PersistenceModule, EmergencyStopModule, MachineCredentialsModule],
  controllers: [CommandController],
  providers: [CommandService, CommandDispatcherService, CommandRetryWorker, PolicyService, MachineAckSignatureService],
  exports: [CommandService, CommandDispatcherService],
})
export class CommandModule {}
