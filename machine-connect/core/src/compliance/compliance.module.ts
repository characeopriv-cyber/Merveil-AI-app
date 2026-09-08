import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { EvidenceIntegrityService } from './evidence-integrity.service';

@Module({ imports: [PersistenceModule], providers: [ComplianceService, EvidenceIntegrityService], controllers: [ComplianceController] })
export class ComplianceModule {}
