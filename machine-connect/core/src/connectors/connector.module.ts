import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { IntelligenceModule } from '../intelligence/intelligence.module';
import { ConnectorController } from './connector.controller';
import { ConnectorService } from './connector.service';
import { ConnectorRegistry } from './connector.registry';
import { ConnectorSyncService } from './connector-sync.service';

@Module({
  imports: [PersistenceModule, TelemetryModule, IntelligenceModule],
  controllers: [ConnectorController],
  providers: [ConnectorService, ConnectorRegistry, ConnectorSyncService],
  exports: [ConnectorService, ConnectorRegistry, ConnectorSyncService],
})
export class ConnectorModule {}
