import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { IntelligenceJobController } from './intelligence-job.controller';
import { IntelligenceJobService } from './intelligence-job.service';

@Module({imports:[PersistenceModule],controllers:[IntelligenceJobController],providers:[IntelligenceJobService],exports:[IntelligenceJobService]})
export class IntelligenceModule {}
