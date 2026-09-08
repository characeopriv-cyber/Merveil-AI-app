import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentProcessorService } from './document-processor.service';

@Module({ imports: [PersistenceModule], controllers: [DocumentController], providers: [DocumentService, DocumentProcessorService], exports: [DocumentProcessorService] })
export class DocumentModule {}
