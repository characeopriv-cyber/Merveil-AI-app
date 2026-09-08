import { Module } from '@nestjs/common';
import { OfflineSyncController } from './offline-sync.controller';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({ imports: [TelemetryModule, PersistenceModule], controllers: [OfflineSyncController] })
export class SyncModule {}
