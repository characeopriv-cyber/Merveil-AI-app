import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { ConnectorController } from './connector.controller';
import { ConnectorService } from './connector.service';
import { ConnectorRegistry } from './connector.registry';

@Module({
  imports: [PersistenceModule],
  controllers: [ConnectorController],
  providers: [ConnectorService, ConnectorRegistry],
  exports: [ConnectorService, ConnectorRegistry],
})
export class ConnectorModule {}
