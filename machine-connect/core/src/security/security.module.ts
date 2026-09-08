import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { RateLimitService } from './rate-limit.service';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { MfaPolicyModule } from './mfa-policy.module';

@Module({
  imports: [PersistenceModule, MfaPolicyModule],
  providers: [RateLimitService, RateLimitMiddleware],
  exports: [RateLimitService, RateLimitMiddleware, MfaPolicyModule],
})
export class SecurityModule {}
