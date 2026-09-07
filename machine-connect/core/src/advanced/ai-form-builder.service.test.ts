import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AiFormBuilderService } from './ai-form-builder.service';

const provider = { generate: async () => ({
  formName: 'Business License',
  fields: [
    { name: 'business_name', label: 'Business name', type: 'text', required: true },
    { name: 'business_type', label: 'Business type', type: 'select', required: true, options: ['LLC', 'Sole proprietor'] },
  ],
}) };

describe('AiFormBuilderService', () => {
  it('accepts a constrained schema and isolates forms by tenant', async () => {
    const service = new AiFormBuilderService(provider as never);
    const form = await service.generate({ tenantId: 'org-a', actorId: 'user-a', prompt: 'business license' });
    assert.equal(form.published, false);
    assert.equal(service.get('org-a', form.id).tenantId, 'org-a');
    assert.throws(() => service.get('org-b', form.id), /form not found/);
  });

  it('rejects executable or malformed schema content', () => {
    const service = new AiFormBuilderService(provider as never);
    assert.throws(() => service.validate({ formName: 'X', fields: [{ name: 'x', label: 'X', type: 'sql', required: false }] }), /invalid field type/);
    assert.throws(() => service.validate({ formName: 'X', fields: [{ name: 'x', label: 'X', type: 'select', required: true }] }), /select options required/);
  });

  it('requires the creator to publish', async () => {
    const service = new AiFormBuilderService(provider as never);
    const form = await service.generate({ tenantId: 'org-a', actorId: 'user-a', prompt: 'business license' });
    assert.throws(() => service.publish('org-a', 'user-b', form.id), /only the form owner/);
    assert.equal(service.publish('org-a', 'user-a', form.id).published, true);
  });
});
