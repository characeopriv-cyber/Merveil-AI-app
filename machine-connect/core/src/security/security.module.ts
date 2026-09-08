import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { RateLimitService } from './rate-limit.service';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  imports: [PersistenceModule],
  providers: [RateLimitService, RateLimitMiddleware],
  exports: [RateLimitService, RateLimitMiddleware],
})
export class SecurityModule {}
