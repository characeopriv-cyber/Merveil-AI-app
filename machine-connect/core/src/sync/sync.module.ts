import { Module } from '@nestjs/common';
import { OfflineSyncController } from './offline-sync.controller';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { RealtimeModule } from '../persistence/realtime.module';

@Module({ imports: [TelemetryModule, RealtimeModule], controllers: [OfflineSyncController] })
export class SyncModule {}
