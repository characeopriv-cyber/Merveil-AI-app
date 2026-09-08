import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { SecurityEventModule } from './security-event.module';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';

@Module({
  imports: [PersistenceModule, SecurityEventModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
