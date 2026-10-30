import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'node:url';

const frontendDir = fileURLToPath(new URL('..', import.meta.url));
const bundle = await build({
  stdin: {
    contents: `import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {Room} from './src/pages/Survival.jsx';const root=createRoot(document.getElementById('root'));window.harness={act,render:p=>root.render(<Room {...p}/>),unmount:()=>root.unmount()};`,
    resolveDir: frontendDir,
    loader: 'jsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'survival-fixture',
      setup(b) {
        b.onResolve({ filter: /lib\/live$/ }, () => ({ path: 'live', namespace: 'fixture' }));
        b.onResolve({ filter: /lib\/locale$/ }, () => ({ path: 'locale', namespace: 'fixture' }));
        b.onResolve({ filter: /components\/CodeEditor$/ }, () => ({
          path: 'editor',
          namespace: 'fixture',
        }));
        b.onResolve(
          {
            filter:
              /components\/(SubmissionHistory|ProblemRanking)$|\.\/Community$|\.\/SurvivalLobby$/,
          },
          () => ({ path: 'empty', namespace: 'fixture' }),
        );
        b.onLoad({ filter: /.*/, namespace: 'fixture' }, (a) => ({
          loader: 'jsx',
          resolveDir: frontendDir,
          contents:
            a.path === 'live'
              ? 'export const live=window.client;'
              : a.path === 'locale'
                ? "export const t=s=>s;export const locale='vi';"
                : a.path === 'editor'
                  ? `import React from 'react';export default p=><textarea data-editor readOnly={p.readOnly} value={p.value} onChange={e=>p.onChange(e.target.value)}/>;`
                  : 'export default ()=>null;export const Discussion=()=>null;',
        }));
      },
    },
  ],
});

async function mount(userId = 'u') {
  const dom = new JSDOM('<div id="root"></div>', {
      url: 'http://localhost/#/room/a',
      runScripts: 'outside-only',
    }),
    w = dom.window,
    calls = [];
  const state = {
    room: {
      id: 'a',
      mode: 'PRACTICE',
      code: 'ABC123',
      name: 'Match',
      hostId: 'u',
      selectedDifficulties: [1],
      state: 'ROUND_ACTIVE',
      participants: ['u', 'v', 'w', 'x'],
      players: [
        { id: 'u', name: 'Coder U', status: 'ALIVE' },
        { id: 'v', name: 'Coder V', status: 'ALIVE' },
        { id: 'w', name: 'Coder W', status: 'ALIVE' },
        { id: 'x', name: 'Coder X', status: 'SPECTATOR' },
      ],
      current: {
        id: 'r1',
        number: 2,
        problemId: 'p',
        players: ['u', 'v', 'w'],
        deadline: Date.now() + 120000,
      },
      problem: {
        languages: ['PY311'],
        general: { questionName: 'Sum', questionText: 'Read numbers' },
        difficulty: 1,
        examples: [],
      },
      liveStandings: [
        {
          userId: 'v',
          rank: 1,
          ac: true,
          status: 'AC',
          score: 100,
          attempts: 1,
          pending: 0,
          effectiveMs: 1000,
        },
        {
          userId: 'u',
          rank: null,
          ac: false,
          status: 'QUEUED',
          score: 0,
          attempts: 1,
          pending: 1,
          effectiveMs: null,
        },
        {
          userId: 'w',
          rank: null,
          ac: false,
          status: 'NOT_SUBMITTED',
          score: 0,
          attempts: 0,
          pending: 0,
          effectiveMs: null,
        },
      ],
    },
  };
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.HTMLElement.prototype.scrollIntoView = () => {};
  w.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    }
  };
  w.client = {
    offset: 0,
    call: async (type, payload) => {
      calls.push({ type, payload });
      if (['ROOM_JOIN', 'ROOM_SNAPSHOT'].includes(type)) return state.room;
      if (type === 'SUBMIT') return { id: 's1', receivedAt: Date.now() };
      return [];
    },
  };
  w.eval(bundle.outputFiles[0].text);
  const { act } = w.harness;
  let revision = 0;
  const render = () =>
    w.harness.render({
      id: 'a',
      user: { id: userId, role: 'CODER' },
      revision,
      onNotice: () => {},
    });
  await act(async () => render());
  return {
    w,
    state,
    calls,
    act,
    refresh: async () => {
      revision++;
      await act(async () => render());
    },
    close: async () => {
      await act(async () => w.harness.unmount());
      w.close();
    },
  };
}

test('live standings update and the submitted editor stays visible through grading and elimination', async () => {
  const h = await mount();
  try {
    const doc = h.w.document,
      editor = doc.querySelector('[data-editor]');
    assert.ok(editor);
    assert.equal(doc.querySelectorAll('.arena-live-standings tbody tr').length, 4);
    assert.match(doc.querySelector('.arena-live-standings tr.my-rank').textContent, /Chờ chấm/);
    assert.match(doc.querySelector('.arena-live-standings tr.my-rank').textContent, /1 \/ 2/);
    await h.act(async () => {
      Object.getOwnPropertyDescriptor(h.w.HTMLTextAreaElement.prototype, 'value').set.call(
        editor,
        'print(42)',
      );
      editor.dispatchEvent(new h.w.Event('input', { bubbles: true }));
    });
    await h.act(async () =>
      [...doc.querySelectorAll('button')].find((b) => b.textContent.includes('Nộp bài')).click(),
    );
    assert.equal(editor.value, 'print(42)');
    assert.ok(h.calls.some((c) => c.type === 'SUBMIT' && c.payload.source === 'print(42)'));
    h.state.room = {
      ...h.state.room,
      state: 'ROUND_GRADING',
      liveStandings: h.state.room.liveStandings.map((r) =>
        r.userId === 'u' ? { ...r, status: 'RUNNING' } : r,
      ),
    };
    await h.refresh();
    assert.equal(doc.querySelector('[data-editor]'), editor);
    assert.equal(editor.value, 'print(42)');
    assert.equal(editor.readOnly, true);
    assert.ok(
      [...doc.querySelectorAll('button')].find((b) => b.textContent.includes('Nộp bài')).disabled,
    );
    assert.match(doc.querySelector('.arena-live-standings tr.my-rank').textContent, /Đang chấm/);
    h.state.room = {
      ...h.state.room,
      state: 'ROUND_RESULT',
      players: h.state.room.players.map((p) => (p.id === 'u' ? { ...p, status: 'SPECTATOR' } : p)),
      liveStandings: h.state.room.liveStandings.map((r) =>
        r.userId === 'u' ? { ...r, status: 'WA', rank: 2, score: 40, pending: 0 } : r,
      ),
    };
    await h.refresh();
    assert.equal(doc.querySelector('[data-editor]'), editor);
    assert.equal(editor.value, 'print(42)');
    assert.match(
      doc.querySelector('.arena-live-standings tr.my-rank').textContent,
      /#2.*Đã bị loại.*WA.*40/,
    );
  } finally {
    await h.close();
  }
});

test('spectators can view the live table without gaining an editor or submission controls', async () => {
  const h = await mount('x');
  try {
    assert.ok(h.w.document.querySelector('.arena-live-standings'));
    assert.equal(h.w.document.querySelector('[data-editor]'), null);
    assert.match(
      h.w.document.querySelector('.arena-live-standings tr.my-rank').textContent,
      /Coder X.*Đã bị loại/,
    );
    assert.equal(h.w.document.querySelectorAll('.arena-live-standings .my-rank').length, 1);
  } finally {
    await h.close();
  }
});

test('voided rounds do not present provisional ranks as finalized results', async () => {
  const h = await mount('x');
  try {
    h.state.room = {
      ...h.state.room,
      state: 'ROUND_RESULT',
      nextKind: 'RESCUE',
      history: [{ round: h.state.room.current, type: 'INFRASTRUCTURE_VOID' }],
    };
    await h.refresh();
    const board = h.w.document.querySelector('.arena-live-standings');
    assert.match(board.textContent, /Đã hủy/);
    assert.match(board.textContent, /không dùng để loại/);
    for (const cell of board.querySelectorAll('tbody td:first-child'))
      assert.equal(cell.textContent, '—');
  } finally {
    await h.close();
  }
});
