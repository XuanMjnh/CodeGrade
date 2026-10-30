import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendDir = join(__dirname, '..');

// Render the real Workspace state/effects with a textarea editor and controlled ACKs.
const bundle = await build({
  stdin: {
    contents: `import React,{act} from 'react';import {createRoot} from 'react-dom/client';import Workspace from './src/pages/Workspace.jsx';const root=createRoot(document.getElementById('root'));window.harness={act,render:p=>root.render(React.createElement(Workspace,p)),unmount:()=>root.unmount()};`,
    resolveDir: frontendDir,
    loader: 'jsx',
  },
  bundle: true,
  write: false,
  format: 'iife',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [
    {
      name: 'workspace-adapters',
      setup(b) {
        b.onResolve({ filter: /lib\/live$/ }, () => ({ path: 'live', namespace: 'stub' }));
        b.onResolve({ filter: /lib\/locale$/ }, () => ({ path: 'locale', namespace: 'stub' }));
        b.onResolve({ filter: /components\/CodeEditor$/ }, () => ({
          path: 'editor',
          namespace: 'stub',
        }));
        b.onResolve({ filter: /(^|\/)ui$/ }, () => ({ path: 'ui', namespace: 'stub' }));
        b.onResolve(
          { filter: /components\/(SubmissionHistory|ProblemRanking)$|\.\/Community$/ },
          () => ({ path: 'empty', namespace: 'stub' }),
        );
        b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => ({
          loader: 'jsx',
          resolveDir: frontendDir,
          contents:
            a.path === 'live'
              ? 'export const live=window.client;'
              : a.path === 'locale'
                ? 'export const t=s=>s;'
                : a.path === 'empty'
                  ? 'export default function Empty(){return null;}export const Discussion=()=>null;'
                  : a.path === 'editor'
                    ? `import React from 'react';export default p=><textarea aria-label="code" value={p.value} onChange={e=>p.onChange(e.target.value)}/>;`
                    : `import React from 'react';export const Heading=()=>null,Badge=p=><span>{p.children}</span>,ErrorBox=p=>p.error?<p role="alert">{p.error.message}</p>:null,Loading=()=>null,TimeLeft=()=>null,go=()=>{};export const useResource=()=>[[],null];`,
        }));
      },
    },
  ],
});
const code = bundle.outputFiles[0].text;
const q = {
  languages: ['PY311', 'CPP17'],
  general: { questionName: 'Sum', questionText: 'Read two numbers' },
  difficulty: 1,
  examples: [],
  precheck: 2,
};
async function mount(extra = {}) {
  const dom = new JSDOM('<div id="root"></div>', {
      url: 'http://localhost',
      runScripts: 'outside-only',
    }),
    w = dom.window,
    calls = [];
  let pending;
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    }
  };
  w.client = {
    call: (type, payload, id) => {
      calls.push({ type, payload, id });
      if (['SUBMIT', 'RUN_EXAMPLES', 'PRECHECK'].includes(type))
        return new Promise((resolve, reject) => {
          pending = { resolve, reject };
        });
      return Promise.resolve(
        type === 'DRAFT_GET' ? [{ language: 'PY311', source_code: 'server old code' }] : {},
      );
    },
  };
  w.localStorage.setItem(
    'cg-code-u-p',
    JSON.stringify({ source: 'local old code', language: 'PY311' }),
  );
  w.eval(code);
  const props = {
    id: 'p',
    user: { id: 'u', role: 'CODER' },
    problem: q,
    room: { id: 'room1', current: { id: 'r1' } },
    onNotice: () => {},
    ...extra,
  };
  const act = w.harness.act;
  await act(async () => {
    w.harness.render(props);
  });
  const edit = async (value) =>
    act(async () => {
      const e = w.document.querySelector('[aria-label=code]');
      Object.getOwnPropertyDescriptor(w.HTMLTextAreaElement.prototype, 'value').set.call(e, value);
      e.dispatchEvent(new w.Event('input', { bubbles: true }));
    });
  const click = async (text) =>
    act(async () => {
      const b = [...w.document.querySelectorAll('button')].find((b) =>
        b.textContent.includes(text),
      );
      assert.ok(b, text);
      b.click();
    });
  const finish = async (ok = true) =>
    act(async () => {
      ok
        ? pending.resolve({ id: 's', receivedAt: Date.now() })
        : pending.reject(Object.assign(Error('rejected'), { code: 'VALIDATION' }));
    });
  return {
    w,
    calls,
    props,
    act,
    edit,
    click,
    finish,
    source: () => w.document.querySelector('[aria-label=code]').value,
    close: async () => {
      await act(async () => w.harness.unmount());
      w.close();
    },
  };
}
test('room submit retains code and saves a separate round draft', async () => {
  const h = await mount();
  try {
    assert.equal(h.source().includes('old code'), false);
    assert.equal(
      h.calls.some((c) => c.type === 'DRAFT_GET'),
      false,
    );
    await h.edit('print(123)');
    await h.click('Nộp bài');
    assert.equal(h.source(), 'print(123)');
    await h.finish();
    assert.equal(h.source(), 'print(123)');
    assert.equal(
      JSON.parse(h.w.localStorage.getItem('cg-code-room:room1:r1:p-u')).source,
      'print(123)',
    );
    assert.equal(JSON.parse(h.w.localStorage.getItem('cg-code-u-p')).source, 'local old code');
    assert.equal(
      h.calls.some((c) => c.type === 'DRAFT_SAVE'),
      false,
    );
  } finally {
    await h.close();
  }
});
test('rejected submissions and examples preserve the current code', async () => {
  const h = await mount();
  try {
    await h.edit('keep me');
    await h.click('Nộp bài');
    await h.finish(false);
    assert.equal(h.source(), 'keep me');
    await h.click('Chạy ví dụ');
    await h.finish();
    assert.equal(h.source(), 'keep me');
  } finally {
    await h.close();
  }
});
test('late ACK never deletes newer edits or code in a new round', async () => {
  const h = await mount();
  try {
    await h.edit('submitted');
    await h.click('Nộp bài');
    await h.edit('new draft');
    await h.finish();
    assert.equal(h.source(), 'new draft');
    await h.click('Nộp bài');
    await h.act(async () =>
      h.w.harness.render({ ...h.props, room: { id: 'room2', current: { id: 'r2' } } }),
    );
    await h.edit('new room code');
    await h.finish();
    assert.equal(h.source(), 'new room code');
  } finally {
    await h.close();
  }
});
test('contest precheck and submit retain code and its saved draft', async () => {
  const h = await mount({ room: null, contestId: 'contest1' });
  try {
    assert.equal(h.source().includes('old code'), false);
    await h.edit('contest code');
    await h.click('Precheck');
    await h.finish();
    assert.equal(h.source(), 'contest code');
    await h.click('Nộp bài');
    await h.finish();
    assert.equal(h.source(), 'contest code');
    assert.equal(
      JSON.parse(h.w.localStorage.getItem('cg-code-contest-contest1-u-p')).source,
      'contest code',
    );
  } finally {
    await h.close();
  }
});

test('room drafts restore only in the same match and round', async () => {
  const h = await mount();
  try {
    await h.edit('round one code');
    await h.click('Nộp bài');
    await h.finish();
    await h.act(async () =>
      h.w.harness.render({ ...h.props, room: { id: 'room1', current: { id: 'r2' } } }),
    );
    assert.equal(h.source().includes('round one code'), false);
    await h.edit('round two code');
    await h.act(async () => h.w.harness.render(h.props));
    assert.equal(h.source(), 'round one code');
    await h.act(async () => h.w.harness.render({ ...h.props, readOnly: true }));
    assert.equal(h.source(), 'round one code');
    assert.ok(
      [...h.w.document.querySelectorAll('button')].find((b) => b.textContent.includes('Nộp bài'))
        .disabled,
    );
  } finally {
    await h.close();
  }
});
test('independent practice still restores and retains its draft after submit', async () => {
  const h = await mount({ room: null });
  try {
    assert.equal(h.source(), 'local old code');
    assert.equal(
      h.calls.some((c) => c.type === 'DRAFT_GET'),
      true,
    );
    await h.edit('practice code');
    await h.click('Nộp bài');
    await h.finish();
    assert.equal(h.source(), 'practice code');
    assert.equal(JSON.parse(h.w.localStorage.getItem('cg-code-u-p')).source, 'practice code');
  } finally {
    await h.close();
  }
});
test('contest drafts persist locally per contest problem and never leak into practice drafts', async () => {
  const dom = new JSDOM('<div id="root"></div>', {
      url: 'http://localhost',
      runScripts: 'outside-only',
    }),
    w = dom.window;
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    }
  };
  w.client = { call: () => Promise.resolve({}) };
  // Practice has its own draft
  w.localStorage.setItem(
    'cg-code-u-p',
    JSON.stringify({ source: 'practice draft original', language: 'PY311' }),
  );
  w.eval(code);
  const act = w.harness.act;
  // 1. Mount problem p inside contest c1
  await act(async () => {
    w.harness.render({
      id: 'p',
      user: { id: 'u', role: 'CODER' },
      problem: q,
      contestId: 'c1',
      room: null,
      onNotice: () => {},
    });
  });
  const editor = w.document.querySelector('[aria-label=code]');
  assert.equal(
    editor.value.includes('practice draft original'),
    false,
    'Contest editor should not load practice draft',
  );
  // Type new code in contest
  await act(async () => {
    Object.getOwnPropertyDescriptor(w.HTMLTextAreaElement.prototype, 'value').set.call(
      editor,
      'contest draft code',
    );
    editor.dispatchEvent(new w.Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 350));
  // Verify contest key stored separately
  const contestSaved = JSON.parse(w.localStorage.getItem('cg-code-contest-c1-u-p') || '{}');
  assert.equal(
    contestSaved.source,
    'contest draft code',
    'Contest draft should be saved under contest-scoped key',
  );
  // Verify practice key untouched
  const practiceSaved = JSON.parse(w.localStorage.getItem('cg-code-u-p') || '{}');
  assert.equal(
    practiceSaved.source,
    'practice draft original',
    'Practice draft should remain untouched',
  );
  // 2. Re-render problem p in contest c1 -> should restore contest draft
  await act(async () => {
    w.harness.render({
      id: 'p',
      user: { id: 'u', role: 'CODER' },
      problem: q,
      contestId: 'c1',
      room: null,
      onNotice: () => {},
    });
  });
  assert.equal(
    w.document.querySelector('[aria-label=code]').value,
    'contest draft code',
    'Contest draft should be restored in contest',
  );
  // 3. Re-render problem p in practice -> should restore practice draft
  await act(async () => {
    w.harness.render({
      id: 'p',
      user: { id: 'u', role: 'CODER' },
      problem: q,
      contestId: null,
      room: null,
      onNotice: () => {},
    });
  });
  assert.equal(
    w.document.querySelector('[aria-label=code]').value,
    'practice draft original',
    'Practice draft should be restored in practice',
  );
  await act(async () => {
    w.harness.unmount();
  });
  w.close();
});
