import { Module } from '@nestjs/common';
import { AdvancedController } from './advanced.controller';
import { AdvancedHealthController } from './advanced-health.controller';
import { AdvancedHealthService } from './advanced-health.service';
import { AiFormBuilderService } from './ai-form-builder.service';
import { OpenAiFormProvider } from './openai-form-provider';
import { LandRegistryService } from './land-registry.service';
import { ProvenanceService } from './provenance.service';

@Module({
  controllers: [AdvancedController, AdvancedHealthController],
  providers: [AdvancedHealthService, OpenAiFormProvider, AiFormBuilderService, LandRegistryService, ProvenanceService],
  exports: [AdvancedHealthService, AiFormBuilderService, LandRegistryService, ProvenanceService],
})
export class AdvancedModule {}
