import test from 'node:test';
import assert from 'node:assert/strict';
import { decideSafety } from './safety-decision';

test('unknown capability fails closed', () => {
  assert.equal(decideSafety({ authenticated: true, authorized: true, machineActive: true, capabilityKnown: false, emergencyStopped: false, critical: false }), 'deny');
});

test('emergency stop blocks commands', () => {
  assert.equal(decideSafety({ authenticated: true, authorized: true, machineActive: true, capabilityKnown: true, emergencyStopped: true, critical: false }), 'deny');
});

test('critical command requires approval', () => {
  assert.equal(decideSafety({ authenticated: true, authorized: true, machineActive: true, capabilityKnown: true, emergencyStopped: false, critical: true }), 'approval_required');
});
