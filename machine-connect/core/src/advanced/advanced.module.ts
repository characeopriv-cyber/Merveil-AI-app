import { Module } from '@nestjs/common';
import { AdvancedController } from './advanced.controller';
import { AiFormBuilderService } from './ai-form-builder.service';
import { OpenAiFormProvider } from './openai-form-provider';
import { LandRegistryService } from './land-registry.service';
import { ProvenanceService } from './provenance.service';

@Module({
  controllers: [AdvancedController],
  providers: [OpenAiFormProvider, AiFormBuilderService, LandRegistryService, ProvenanceService],
  exports: [AiFormBuilderService, LandRegistryService, ProvenanceService],
})
export class AdvancedModule {}
