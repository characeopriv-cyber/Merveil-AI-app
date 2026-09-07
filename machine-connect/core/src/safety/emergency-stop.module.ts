import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { EmergencyStopController } from './emergency-stop.controller';
import { EmergencyStopService } from './emergency-stop.service';

@Module({ imports: [AuditModule], controllers: [EmergencyStopController], providers: [EmergencyStopService], exports: [EmergencyStopService] })
export class EmergencyStopModule {}
