import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { DocumentEntityController } from './document-entity.controller';
import { DocumentEntityService } from './document-entity.service';

@Module({
  imports: [PersistenceModule],
  controllers: [DocumentEntityController],
  providers: [DocumentEntityService],
})
export class DocumentEntityModule {}
