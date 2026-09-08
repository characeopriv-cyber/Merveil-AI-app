import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { SecurityEventModule } from './security-event.module';
import { MfaPolicyModule } from './mfa-policy.module';
import { RateLimitService } from './rate-limit.service';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  imports: [PersistenceModule, SecurityEventModule, MfaPolicyModule],
  providers: [RateLimitService, RateLimitMiddleware],
  exports: [RateLimitService, RateLimitMiddleware, MfaPolicyModule],
})
export class SecurityModule {}
