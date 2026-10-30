import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { defaults } from '../src/lib/coderunner.js';

// Component fixtures exercise UI state. Actual server journeys live in survival-ui.cjs.
const bundle = await build({
  stdin: {
    contents: `import React,{act} from 'react';import {createRoot} from 'react-dom/client';import Studio from './src/pages/QuestionEditor.jsx';import Lobby from './src/pages/SurvivalLobby.jsx';import {Room} from './src/pages/Survival.jsx';import {Admin} from './src/pages/Records.jsx';const root=createRoot(document.getElementById('root'));window.harness={act,render:(kind,p)=>root.render(React.createElement({Studio,Lobby,Room,Admin}[kind],p)),unmount:()=>root.unmount()};`,
    resolveDir: process.cwd(),
    loader: 'jsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'component-adapters',
      setup(b) {
        b.onResolve({ filter: /lib\/live$/ }, () => ({ path: 'live', namespace: 'adapter' }));
        b.onResolve({ filter: /lib\/locale$/ }, () => ({ path: 'locale', namespace: 'adapter' }));
        b.onResolve({ filter: /components\/CodeEditor$/ }, () => ({
          path: 'editor',
          namespace: 'adapter',
        }));
        b.onResolve({ filter: /^\.\/Workspace$|components\/SubmissionHistory$/ }, () => ({
          path: 'empty',
          namespace: 'adapter',
        }));
        b.onLoad({ filter: /.*/, namespace: 'adapter' }, (a) => ({
          loader: 'jsx',
          resolveDir: process.cwd(),
          contents:
            a.path === 'live'
              ? 'export const live=window.client;'
              : a.path === 'locale'
                ? "export const t=s=>s;export const locale='vi';"
                : a.path === 'editor'
                  ? `import React from 'react';export default p=><textarea disabled={p.readOnly} aria-label={p.label} value={p.value} onChange={e=>p.onChange(e.target.value)}/>;`
                  : `import React from 'react';export default ()=>null;export const Result=()=>null;`,
        }));
      },
    },
  ],
});
function fixture() {
  const q = defaults();
  q.id = 'question';
  q.version = 7;
  q.validatedVersion = 7;
  q.coderunnertype = 'python3_program';
  q.general.questionName = 'Unicode ∑';
  q.general.questionText = 'Keep every field';
  q.customise = true;
  q.precheck = 3;
  q.tags = ['arrays'];
  q.datafiles = [{ filename: 'data.txt', content: 'hello' }];
  q.testcases.forEach((t, i) => {
    t.stdin = ` ${i}\n`;
    t.expected = ` ${i * 2}\n\n`;
    t.ordering = 50 - i;
    t.mark = i + 1;
    t.extra = 'extra ' + i;
    t.testtype = i % 3;
    t.useasexample = i === 0;
    t.display = i === 0 ? 'HIDE' : 'SHOW';
  });
  return q;
}
const user = { id: 'u', role: 'CODER', displayName: 'Coder' };
function room(state) {
  return {
    id: 'room',
    code: 'ABC123',
    name: 'Arena',
    hostId: 'u',
    hostName: 'Coder',
    mode: 'PRACTICE',
    state,
    selectedDifficulties: [1, 2],
    roundSeconds: 120,
    finalSeconds: 150,
    players: [
      { id: 'u', name: 'Coder', status: 'ALIVE' },
      { id: 'v', name: 'Other', status: 'SPECTATOR' },
    ],
    participants: ['u', 'v'],
    nextAt: Date.now() + 10000,
    current: { id: 'round', number: 2, kind: 'NORMAL', deadline: Date.now() + 60000 },
  };
}
async function mount(kind, options = {}) {
  const dom = new JSDOM('<div id="root"></div>', {
      url: 'http://localhost/#/edit/question',
      runScripts: 'outside-only',
      pretendToBeVisual: true,
    }),
    w = dom.window,
    calls = [];
  const state = { question: fixture(), queue: { state: 'IDLE' }, room: room('LOBBY'), ...options };
  w.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    }
  };
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.structuredClone = structuredClone;
  w.confirm = () => true;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.fetch = async () => ({
    json: async () => ({
      questionTypes: [{ id: 'python3_program', description: 'Python program' }],
    }),
  });
  w.client = {
    offset: 0,
    call: async (type, payload) => {
      calls.push({ type, payload });
      if (type === 'CATEGORIES') return [{ id: 'algorithms', name: 'Algorithms' }];
      if (type === 'QUESTION_EDIT') {
        if (state.rejectEdit) throw Error('Not permitted');
        return state.question;
      }
      if (type === 'QUESTION_SAVE') {
        if (state.rejectSave) throw Error('Server rejected configuration');
        if (state.deferSave)
          return new Promise((resolve) => {
            state.saveResolve = resolve;
          });
        return { ...payload, id: 'question', version: 8, validatedVersion: null };
      }
      if (type === 'MATCH_QUEUE_STATUS') return state.queue;
      if (
        [
          'MATCH_QUEUE_JOIN',
          'MATCH_ACCEPT',
          'MATCH_DECLINE',
          'MATCH_QUEUE_CANCEL',
          'ROOM_CREATE',
          'ROOM_JOIN',
          'ROOM_SNAPSHOT',
        ].includes(type)
      ) {
        if (type === 'ROOM_JOIN' || type === 'ROOM_SNAPSHOT') return state.room;
        return state.actionResult || state.queue;
      }
      if (type === 'PROGRESSION_GET')
        return {
          level: 3,
          exp: 420,
          nextLevelExp: 900,
          rank: 'Silver',
          rating: 1200,
          badges: ['First win'],
          avatarFrame: 'silver',
        };
      return [];
    },
  };
  if (state.initialDraft)
    w.localStorage.setItem('cg-question-draft-question', JSON.stringify(state.initialDraft));
  w.eval(bundle.outputFiles[0].text);
  const act = w.harness.act;
  let revision = 0;
  const props = { id: 'question', user, revision, onNotice: () => {}, ...options.props };
  await act(async () => w.harness.render(kind, props));
  const click = async (text) =>
    act(async () => {
      const b = [...w.document.querySelectorAll('button')].find(
        (e) => e.textContent.trim() === text,
      );
      assert.ok(b, `Button: ${text}`);
      b.click();
    });
  const edit = async (label, value) =>
    act(async () => {
      const el = w.document.querySelector(`[aria-label="${label}"]`);
      assert.ok(el, label);
      const proto =
        el.tagName === 'TEXTAREA'
          ? w.HTMLTextAreaElement.prototype
          : el.tagName === 'SELECT'
            ? w.HTMLSelectElement.prototype
            : w.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
      el.dispatchEvent(
        new w.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }),
      );
    });
  const refresh = async () =>
    act(async () => w.harness.render(kind, { ...props, revision: ++revision }));
  return {
    w,
    state,
    calls,
    act,
    click,
    edit,
    refresh,
    close: async () => {
      await act(async () => w.harness.unmount());
      w.close();
    },
  };
}
test('studio keeps every configured field and whitespace across panels and save', async () => {
  const h = await mount('Studio');
  try {
    assert.equal(h.w.document.querySelectorAll('[role=tab]').length, 5);
    assert.equal(h.w.document.querySelectorAll('[role=tabpanel]:not([hidden])').length, 1);
    await h.edit('general.questionName', 'Edited ∑');
    await h.click('3Đáp án mẫuLời giải tham chiếu & preload');
    await h.edit('answer.sampleAnswer', 'print(42)\n');
    await h.click('4Bộ kiểm thửInput, output & thuộc tính');
    const first = h.w.document.querySelector('.test-block');
    assert.match(first.textContent, /Public Example/);
    assert.match(first.textContent, /Display: Hide/);
    assert.match(
      h.w.document.querySelectorAll('.test-block')[1].textContent,
      /Không phải ví dụ công khai/,
    );
    await h.click('Lưu và tiếp tục sửa');
    const saved = h.calls.find((c) => c.type === 'QUESTION_SAVE').payload;
    const expected = fixture();
    expected.testcases = h.state.question.testcases;
    expected.general.questionName = 'Edited ∑';
    expected.answer.sampleAnswer = 'print(42)\n';
    assert.deepEqual(JSON.parse(JSON.stringify(saved)), expected);
    assert.equal(h.w.localStorage.getItem('cg-question-draft-question'), null);
  } finally {
    await h.close();
  }
});
test('studio import/export preserves schema, IDs, example/display flags and identity', async () => {
  const h = await mount('Studio');
  try {
    const incoming = fixture();
    incoming.id = 'other';
    incoming.publicId = 'CG-9999';
    incoming.version = 99;
    incoming.general.questionName = 'Imported';
    const input = h.w.document.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', {
      value: [{ size: 100, text: async () => JSON.stringify(incoming) }],
      configurable: true,
    });
    await h.act(async () => input.dispatchEvent(new h.w.Event('change', { bubbles: true })));
    let blob;
    h.w.Blob = Blob;
    h.w.URL.createObjectURL = (b) => {
      blob = b;
      return 'blob:test';
    };
    h.w.URL.revokeObjectURL = () => {};
    h.w.HTMLAnchorElement.prototype.click = () => {};
    await h.click('Export JSON');
    const exported = JSON.parse(await blob.text());
    assert.equal(exported.id, undefined);
    assert.equal(exported.publicId, undefined);
    assert.equal(exported.version, undefined);
    assert.deepEqual(exported.testcases, incoming.testcases);
    assert.deepEqual(exported.datafiles, incoming.datafiles);
    await h.click('Lưu và tiếp tục sửa');
    assert.equal(
      h.calls.find((c) => c.type === 'QUESTION_SAVE').payload.general.questionName,
      'Imported',
    );
  } finally {
    await h.close();
  }
});
test('invalid JSON or invalid configuration never replaces or saves the current document', async () => {
  const h = await mount('Studio');
  try {
    const input = h.w.document.querySelector('input[type=file]');
    Object.defineProperty(input, 'files', { value: [{ size: 2, text: async () => '{bad' }] });
    await h.act(async () => input.dispatchEvent(new h.w.Event('change', { bubbles: true })));
    assert.equal(
      h.w.document.querySelector('[aria-label="general.questionName"]').value,
      'Unicode ∑',
    );
    await h.edit('general.questionName', '');
    await h.click('Lưu thay đổi →');
    assert.equal(
      h.calls.some((c) => c.type === 'QUESTION_SAVE'),
      false,
    );
    assert.ok(h.w.document.querySelector('.editor-errors'));
  } finally {
    await h.close();
  }
});
test('failed save retains local draft and cancelled navigation; tab keyboard works', async () => {
  const h = await mount('Studio', { rejectSave: true });
  try {
    await h.edit('general.questionName', 'Keep draft');
    await h.click('Lưu thay đổi →');
    assert.match(h.w.document.querySelector('[role=alert]').textContent, /Server rejected/);
    assert.equal(
      JSON.parse(h.w.localStorage.getItem('cg-question-draft-question')).general.questionName,
      'Keep draft',
    );
    h.w.confirm = () => false;
    const event = new h.w.CustomEvent('codegrade:before-navigate', { cancelable: true });
    h.w.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    const tab = h.w.document.querySelector('[role=tab]');
    await h.act(async () =>
      tab.dispatchEvent(new h.w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
    );
    assert.equal(h.w.document.querySelector('[role=tab][aria-selected=true]').id, 'studio-tab-1');
  } finally {
    await h.close();
  }
});
test('lobby uses official progression and keeps practice creation separate from queues', async () => {
  const h = await mount('Lobby');
  try {
    assert.equal(h.w.document.querySelectorAll('.mode-card').length, 3);
    assert.match(h.w.document.querySelector('.progression-strip').textContent, /420 EXP/);
    assert.ok(h.w.document.querySelector('.avatar-frame-silver'));
    await h.act(async () => h.w.document.querySelector('.mode-ranked').click());
    assert.equal(h.w.document.querySelector('.arena-practice'), null);
    await h.click('Tìm trận Ranked');
    assert.deepEqual(
      JSON.parse(JSON.stringify(h.calls.find((c) => c.type === 'MATCH_QUEUE_JOIN').payload)),
      { mode: 'RANKED' },
    );
  } finally {
    await h.close();
  }
});
test('queue confirmation and waiting states render only official counts and deadlines', async () => {
  const h = await mount('Lobby', {
    queue: {
      mode: 'RANKED',
      state: 'WAITING',
      joinedAt: Date.now() - 12000,
      waiting: 3,
      ratingRange: 250,
    },
  });
  try {
    assert.ok(h.w.document.querySelector('.is-searching'));
    assert.match(h.w.document.querySelector('.matchmaking-panel').textContent, /3 người đang chờ/);
    assert.match(h.w.document.querySelector('.matchmaking-panel').textContent, /250/);
    h.state.queue = {
      mode: 'RANKED',
      state: 'MATCH_FOUND',
      roomId: 'match',
      accepted: 2,
      acceptDeadline: Date.now() + 10000,
    };
    await h.refresh();
    assert.equal(h.w.document.querySelectorAll('.accept-slots .confirmed').length, 2);
    await h.click('Nhận trận');
    assert.deepEqual(
      JSON.parse(JSON.stringify(h.calls.find((c) => c.type === 'MATCH_ACCEPT').payload)),
      { roomId: 'match' },
    );
  } finally {
    await h.close();
  }
});
for (const state of [
  'COUNTDOWN',
  'ROUND_ACTIVE',
  'ROUND_GRADING',
  'ROUND_RESULT',
  'FINISHED',
  'UNRESOLVED',
])
  test(`arena renders official ${state} without inventing a winner`, async () => {
    const r = room(state);
    if (state === 'FINISHED') r.winnerId = 'u';
    if (state === 'UNRESOLVED') r.reason = 'No player achieved AC';
    const h = await mount('Room', { room: r });
    try {
      assert.ok(h.w.document.querySelector('.arena-hud'));
      assert.equal(!!h.w.document.querySelector('.victory'), state === 'FINISHED');
      assert.equal(!!h.w.document.querySelector('.unresolved'), state === 'UNRESOLVED');
      if (['ROUND_ACTIVE', 'COUNTDOWN', 'ROUND_RESULT'].includes(state))
        assert.ok(h.w.document.querySelector('.hud-clock .timer'));
      if (state === 'ROUND_GRADING')
        assert.match(h.w.document.querySelector('.arena-state-notice').textContent, /Chờ bộ chấm/);
    } finally {
      await h.close();
    }
  });
for (const nextKind of ['TIE_BREAK', 'RESCUE'])
  test(`round transition follows server ${nextKind}`, async () => {
    const h = await mount('Room', { room: { ...room('ROUND_RESULT'), nextKind } });
    try {
      assert.match(
        h.w.document.querySelector('.arena-state-notice').textContent,
        nextKind === 'RESCUE' ? /cứu hộ/ : /đồng hạng/,
      );
    } finally {
      await h.close();
    }
  });

test('local draft restoration recovers all test metadata', async () => {
  const draft = fixture();
  draft.general.questionName = 'Recovered draft';
  const h = await mount('Studio', { initialDraft: draft });
  try {
    await h.click('Khôi phục nháp cục bộ');
    assert.equal(
      h.w.document.querySelector('[aria-label="general.questionName"]').value,
      'Recovered draft',
    );
    await h.click('Lưu và tiếp tục sửa');
    assert.deepEqual(
      JSON.parse(JSON.stringify(h.calls.find((c) => c.type === 'QUESTION_SAVE').payload.testcases)),
      draft.testcases,
    );
  } finally {
    await h.close();
  }
});
test('save locks reference editor; a new edit after save still requires navigation confirmation', async () => {
  const h = await mount('Studio', { deferSave: true });
  try {
    await h.edit('general.questionName', 'Saving');
    await h.click('Lưu và tiếp tục sửa');
    assert.equal(h.w.document.querySelector('[aria-label="answer.sampleAnswer"]').disabled, true);
    const blocked = new h.w.CustomEvent('codegrade:before-navigate', { cancelable: true });
    h.w.dispatchEvent(blocked);
    assert.equal(blocked.defaultPrevented, true);
    await h.act(async () => h.state.saveResolve({ ...h.state.question, version: 8 }));
    await h.edit('general.questionName', 'New edit');
    h.w.confirm = () => false;
    const changed = new h.w.CustomEvent('codegrade:before-navigate', { cancelable: true });
    h.w.dispatchEvent(changed);
    assert.equal(changed.defaultPrevented, true);
  } finally {
    await h.close();
  }
});
test('validation metadata refresh never replaces unsaved fields', async () => {
  const h = await mount('Studio');
  try {
    await h.edit('general.questionName', 'Keep my edits');
    h.state.question = { ...h.state.question, validatedVersion: 7 };
    await h.refresh();
    assert.equal(
      h.w.document.querySelector('[aria-label="general.questionName"]').value,
      'Keep my edits',
    );
    assert.equal(
      JSON.parse(h.w.localStorage.getItem('cg-question-draft-question')).general.questionName,
      'Keep my edits',
    );
  } finally {
    await h.close();
  }
});
test('failed existing-question load disables save instead of creating a replacement', async () => {
  const h = await mount('Studio', { rejectEdit: true });
  try {
    assert.equal(
      h.w.document.querySelector('[aria-label="general.questionName"]').closest('fieldset')
        .disabled,
      true,
    );
    await h.click('Lưu thay đổi →');
    assert.equal(
      h.calls.some((c) => c.type === 'QUESTION_SAVE'),
      false,
    );
  } finally {
    await h.close();
  }
});

test('admin requests only audit summaries after expanding the activity table', async () => {
  const h = await mount('Admin');
  try {
    assert.equal(
      h.calls.some((c) => c.type === 'AUDIT'),
      false,
    );
    const details =
      h.w.document.querySelector('main details') || h.w.document.querySelector('details');
    await h.act(async () => {
      details.open = true;
      details.dispatchEvent(new h.w.Event('toggle', { bubbles: true }));
    });
    assert.deepEqual(JSON.parse(JSON.stringify(h.calls.find((c) => c.type === 'AUDIT').payload)), {
      summaryOnly: true,
    });
  } finally {
    await h.close();
  }
});
