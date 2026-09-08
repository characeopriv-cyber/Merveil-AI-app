import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { ConnectorController } from './connector.controller';
import { ConnectorService } from './connector.service';

@Module({
  imports: [PersistenceModule],
  controllers: [ConnectorController],
  providers: [ConnectorService],
  exports: [ConnectorService],
})
export class ConnectorModule {}
