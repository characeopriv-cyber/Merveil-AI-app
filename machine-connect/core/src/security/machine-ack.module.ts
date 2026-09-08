import { Module } from '@nestjs/common';
import { MachineAckSignatureService } from './machine-ack-signature.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({ imports: [PersistenceModule], providers: [MachineAckSignatureService], exports: [MachineAckSignatureService] })
export class MachineAckModule {}
