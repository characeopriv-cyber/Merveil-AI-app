import { Module } from '@nestjs/common';
import { OperationsMetricsController } from './operations-metrics.controller';
import { OperationsMetricsService } from './operations-metrics.service';
import { PersistenceModule } from '../persistence/persistence.module';

@Module({ imports: [PersistenceModule], controllers: [OperationsMetricsController], providers: [OperationsMetricsService], exports: [OperationsMetricsService] })
export class ObservabilityModule {}
