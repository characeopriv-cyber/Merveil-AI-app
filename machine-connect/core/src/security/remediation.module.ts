import { Module } from '@nestjs/common';
import { RemediationController } from './remediation.controller';
import { RemediationService } from './remediation.service';

@Module({ controllers: [RemediationController], providers: [RemediationService], exports: [RemediationService] })
export class RemediationModule {}
