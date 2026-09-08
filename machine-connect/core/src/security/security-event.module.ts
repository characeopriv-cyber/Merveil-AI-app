import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { SecurityEventService } from './security-event.service';

@Module({ imports: [PersistenceModule], providers: [SecurityEventService], exports: [SecurityEventService] })
export class SecurityEventModule {}
