import { Module } from '@nestjs/common';
import { MfaPolicyService } from './mfa-policy.service';

@Module({ providers: [MfaPolicyService], exports: [MfaPolicyService] })
export class MfaPolicyModule {}
