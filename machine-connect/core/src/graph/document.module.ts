import { Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module';
import { DocumentController } from './document.controller';
import { DocumentService } from './document.service';

@Module({ imports: [PersistenceModule], controllers: [DocumentController], providers: [DocumentService] })
export class DocumentModule {}
