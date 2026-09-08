import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { EntityService } from './entity.service';
import { RelationshipService } from './relationship.service';
import { AnalyticsService } from './analytics.service';
import { GraphController } from './graph.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [GraphController],
  providers: [EntityService, RelationshipService, AnalyticsService],
  exports: [EntityService, RelationshipService, AnalyticsService],
})
export class GraphModule {}
