import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';
import { DocumentProcessorService } from './document-processor.service';
import { IntelligenceRuntimeClient } from './intelligence-runtime.client';

@Module({ imports: [PersistenceModule], controllers: [DocumentController], providers: [DocumentService, DocumentProcessorService, IntelligenceRuntimeClient], exports: [DocumentProcessorService] })
export class DocumentModule {}
