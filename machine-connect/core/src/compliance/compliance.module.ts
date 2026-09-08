import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';

@Module({ imports: [PersistenceModule], providers: [ComplianceService], controllers: [ComplianceController] })
export class ComplianceModule {}
