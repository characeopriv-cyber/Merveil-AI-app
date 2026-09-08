import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { AdvancedAnalyticsController } from './advanced-analytics.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [AdvancedAnalyticsController],
  providers: [AdvancedAnalyticsService],
  exports: [AdvancedAnalyticsService],
})
export class AdvancedAnalyticsModule {}
