import test from 'node:test';
import assert from 'node:assert/strict';
import {
  practiceInsights,
  submissionInsights,
  contestState,
  contestInsights,
} from '../src/lib/insights.js';
test('practice progress includes only supplied problems and prioritizes unsolved lower difficulties', () => {
  const rows = [
    { id: 'a', category_id: 'x', category: 'Mảng', difficulty: 3, solved: false, title: 'A' },
    {
      id: 'b',
      category_id: 'x',
      category: 'Mảng',
      difficulty: 1,
      solved: true,
      starred: true,
      title: 'B',
    },
    { id: 'c', category_id: 'y', category: 'Chuỗi', difficulty: 1, solved: false, title: 'C' },
  ];
  const s = practiceInsights(rows);
  assert.equal(s.total, 3);
  assert.equal(s.solved, 1);
  assert.equal(s.starred, 1);
  assert.equal(s.categories.find((c) => c.id === 'x').solved, 1);
  assert.deepEqual(
    s.next.map((p) => p.id),
    ['c', 'a'],
  );
  assert.equal(rows[0].id, 'a');
});
test('acceptance rate excludes trial runs, pending jobs and system errors', () => {
  const s = submissionInsights([
    { mode: 'OFFICIAL', status: 'AC', score: 100, language: 'PY311' },
    { mode: 'OFFICIAL', status: 'WA', score: 40, language: 'PY311' },
    { mode: 'OFFICIAL', status: 'SE', language: 'CPP17' },
    { mode: 'OFFICIAL', status: 'QUEUED', language: 'CPP17' },
    { mode: 'PRECHECK', status: 'AC', score: 100 },
  ]);
  assert.equal(s.total, 4);
  assert.equal(s.ac, 1);
  assert.equal(s.rate, 50);
  assert.equal(s.pending, 1);
  assert.equal(s.best, 100);
  assert.equal(s.languages.length, 2);
  assert.equal(submissionInsights([]).rate, null);
});
test('contest boundaries distinguish live, awaiting settlement and finalized events', () => {
  const c = { startsAt: 100, endsAt: 200, participants: ['u'], pending: ['v'] };
  assert.equal(contestState(c, 99), 'upcoming');
  assert.equal(contestState(c, 100), 'live');
  assert.equal(contestState(c, 200), 'grading');
  assert.equal(contestState({ ...c, settled: true }, 201), 'finished');
  assert.equal(contestInsights([c], 50, 'u').joined, 1);
  assert.equal(contestInsights([c], 50, 'v').pending, 1);
});
