import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [ApiKeyController],
  providers: [ApiKeyService],
  exports: [ApiKeyService],
})
export class ApiKeyModule {}
