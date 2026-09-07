import { Module } from '@nestjs/common';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({ imports: [PersistenceModule], controllers: [TelemetryController], providers: [TelemetryService], exports: [TelemetryService] })
export class TelemetryModule {}
