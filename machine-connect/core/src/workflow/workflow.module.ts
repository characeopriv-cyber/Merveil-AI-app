import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { PersistenceModule } from '../persistence/persistence.module';
import { OperationsModule } from '../operations/operations.module';

@Module({ imports:[PersistenceModule,OperationsModule], controllers:[WorkflowController], providers:[WorkflowService], exports:[WorkflowService] })
export class WorkflowModule {}
