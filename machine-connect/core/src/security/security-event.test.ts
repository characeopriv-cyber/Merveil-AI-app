import test from 'node:test';
import assert from 'node:assert/strict';
import { SecurityEventService } from './security-event.service';

test('security events require an event type', async () => {
  const service = new SecurityEventService({ request: async () => [] } as never);
  await assert.rejects(() => service.record({ eventType: '', service: 'core' } as never), /event type is required/);
});
