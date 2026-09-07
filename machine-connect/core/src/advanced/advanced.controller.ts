import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AiFormBuilderService } from './ai-form-builder.service';
import { LandRegistryService } from './land-registry.service';
import { ProvenanceService } from './provenance.service';

@Controller('api/advanced')
export class AdvancedController {
  constructor(private readonly forms: AiFormBuilderService, private readonly land: LandRegistryService, private readonly provenance: ProvenanceService) {}

  @Post('forms/generate')
  generateForm(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') actorId: string, @Body() body: { prompt: string }) {
    if (!tenantId || !actorId) return { error: 'missing_principal' };
    return this.forms.generate({ tenantId, actorId, prompt: body.prompt });
  }

  @Post('forms/publish')
  publishForm(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') actorId: string, @Body() body: { formId: string }) {
    return this.forms.publish(tenantId, actorId, body.formId);
  }

  @Get('forms/:formId')
  getForm(@Headers('x-tenant-id') tenantId: string, @Param('formId') formId: string) {
    return this.forms.get(tenantId, formId);
  }

  @Post('land/:parcelId/provenance')
  landProvenance(@Headers('x-tenant-id') tenantId: string, @Param('parcelId') parcelId: string, @Body() body: Record<string, unknown>) {
    return { parcelId, hash: this.provenance.hash({ tenantId, parcelId, ...body }) };
  }

  @Post('land/:parcelId/anchor')
  anchorLand(@Headers('x-tenant-id') tenantId: string, @Param('parcelId') parcelId: string) {
    return this.land.anchorParcel(tenantId, parcelId);
  }
}
