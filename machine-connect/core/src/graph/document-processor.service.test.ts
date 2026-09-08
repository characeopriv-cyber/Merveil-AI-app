import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentProcessorService } from './document-processor.service';

test('document processor is single-flight', async () => {
  const db = { request: async () => [] } as any;
  const runtime = { extract: async () => ({ text: '', sha256: 'x', byteSize: 0, entities: [] }) } as any;
  const service = new DocumentProcessorService(db, runtime);
  const [a, b] = await Promise.all([service.processNext(), service.processNext()]);
  assert.equal(a + b, 0);
});
