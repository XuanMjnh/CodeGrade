import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCountdown } from '../src/lib/time.js';
test('contest countdown uses hours, minutes, seconds with hours exceeding a day', () => {
  assert.equal(formatCountdown(3661000, 0, true), '01:01:01');
  assert.equal(formatCountdown(90061000, 0, true), '25:01:01');
  assert.equal(formatCountdown(59000, 0, true), '00:00:59');
  assert.equal(formatCountdown(999, 0, true), '00:00:01');
  assert.equal(formatCountdown(1000, 1001, true), '00:00:00');
});
test('survival countdown keeps its minutes and seconds format', () => {
  assert.equal(formatCountdown(150000, 0), '02:30');
  assert.equal(formatCountdown(3600000, 0), '60:00');
});
