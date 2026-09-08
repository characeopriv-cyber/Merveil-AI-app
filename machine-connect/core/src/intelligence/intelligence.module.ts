import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { DocumentModule } from '../graph/document.module';
import { IntelligenceJobController } from './intelligence-job.controller';
import { IntelligenceJobService } from './intelligence-job.service';

@Module({imports:[PersistenceModule,DocumentModule],controllers:[IntelligenceJobController],providers:[IntelligenceJobService],exports:[IntelligenceJobService]})
export class IntelligenceModule {}
