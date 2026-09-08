import test from 'node:test';
import assert from 'node:assert/strict';
import { AiFormBuilderService } from './ai-form-builder.service';
import { ProvenanceService } from './provenance.service';

const provider = { generate: async () => ({ formName: 'Business License', fields: [{ name: 'business_name', label: 'Business name', type: 'text', required: true }] }) };

test('AI form builder validates generated schema', async () => {
  const service = new AiFormBuilderService(provider as never);
  const form = await service.generate({ tenantId: 'tenant-a', actorId: 'user-a', prompt: 'business license' });
  assert.equal(form.schema.version, 1);
  assert.equal(form.schema.fields[0].name, 'business_name');
});

test('AI form builder rejects executable/schema-injection shapes', () => {
  const service = new AiFormBuilderService(provider as never);
  assert.throws(() => service.validate({ formName: 'x', fields: [{ name: 'drop_table()', label: 'x', type: 'text', required: false }] }));
});

test('provenance hashing is deterministic across object key order', () => {
  const service = new ProvenanceService();
  assert.equal(service.hash({ b: 2, a: 1 }), service.hash({ a: 1, b: 2 }));
});
