import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendDir = join(__dirname, '..');

test('bilingual translation covers all practice and submission terms in both VI and EN', () => {
  const extra = JSON.parse(readFileSync(join(frontendDir, 'src/lib/translations.json'), 'utf8'));
  const pairs = Object.assign({}, extra);
  const viToEn = {},
    enToVi = {};
  for (const [a, b] of Object.entries(pairs)) {
    if (/[À-ỹ]/.test(a) && !/[À-ỹ]/.test(b)) {
      viToEn[a.trim()] = b.trim();
      enToVi[b.trim()] = a.trim();
    } else if (!/[À-ỹ]/.test(a) && /[À-ỹ]/.test(b)) {
      viToEn[b.trim()] = a.trim();
      enToVi[a.trim()] = b.trim();
    }
  }

  const terms = [
    'Kho bài thực hành',
    'Đã hoàn thành',
    'Bài tập yêu thích',
    'Chủ đề thuật toán',
    'Tổng bài đã gửi',
    'Lời giải chính xác',
    'Đang xử lý',
    'Thành tích tối đa',
    'Tạo câu hỏi',
  ];

  for (const term of terms) {
    assert.ok(viToEn[term], `Missing English translation for: "${term}"`);
    assert.ok(enToVi[viToEn[term]], `Missing Vietnamese reverse mapping for: "${viToEn[term]}"`);
  }
});

test('practice component renders modern stats grid with interactive filtering', async () => {
  const bundle = await build({
    stdin: {
      contents: `
        import React, { act } from 'react';
        import { createRoot } from 'react-dom/client';
        import Practice from './src/pages/Practice.jsx';

        const root = createRoot(document.getElementById('root'));
        window.harness = {
          act,
          render: (props) => root.render(React.createElement(Practice, props)),
          unmount: () => root.unmount(),
        };
      `,
      resolveDir: frontendDir,
      loader: 'jsx',
    },
    bundle: true,
    write: false,
    format: 'iife',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'practice-stubs',
        setup(b) {
          b.onResolve({ filter: /lib\/live$/ }, () => ({ path: 'live', namespace: 'stub' }));
          b.onResolve({ filter: /lib\/locale$/ }, () => ({ path: 'locale', namespace: 'stub' }));
          b.onResolve({ filter: /components\/ui$/ }, () => ({ path: 'ui', namespace: 'stub' }));
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => {
            if (a.path === 'live') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export const live = { call: () => Promise.resolve(), offset: 0 };`,
              };
            }
            if (a.path === 'locale') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export const t = (s) => s;`,
              };
            }
            if (a.path === 'ui') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `
                  import React from 'react';
                  import PageBanner from './src/components/PageBanner.jsx';
                  export { default as Heading } from './src/components/PageBanner.jsx';
                  export const Badge = ({ children, tone }) => <span className={'badge ' + (tone || '')}>{children}</span>;
                  export const ErrorBox = ({ error }) => error ? <div className="error">{error.message}</div> : null;
                  export const Loading = () => <div className="loading">Loading...</div>;
                  export const go = () => {};
                  export function useResource(name) {
                    if (name === 'PROBLEMS') {
                      return [[
                        { id: 'p1', publicId: 'CG-0001', title: 'Two Sum', category: 'Array', categoryId: 'cat1', difficulty: 1, solved: true, starred: false },
                        { id: 'p2', publicId: 'CG-0002', title: 'Binary Search', category: 'Search', categoryId: 'cat2', difficulty: 2, solved: false, starred: true },
                        { id: 'p3', publicId: 'CG-0003', title: 'Graph Traversal', category: 'Graph', categoryId: 'cat3', difficulty: 3, solved: false, starred: false },
                      ], null, () => {}];
                    }
                    if (name === 'CATEGORIES') {
                      return [[
                        { id: 'cat1', name: 'Array' },
                        { id: 'cat2', name: 'Search' },
                        { id: 'cat3', name: 'Graph' },
                      ], null];
                    }
                    return [null, null];
                  }
                `,
              };
            }
          });
        },
      },
    ],
  });

  const dom = new JSDOM('<div id="root"></div>', {
    url: 'https://codegrade.test/#/practice',
    runScripts: 'outside-only',
  });
  const w = dom.window;
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    }
  };
  w.eval(bundle.outputFiles[0].text);

  await w.harness.act(async () => {
    w.harness.render({ user: { role: 'CODER' }, revision: 1 });
  });

  const doc = w.document;
  const banner = doc.querySelector('.page-banner.practice-banner');
  assert.ok(banner, 'Practice banner should be rendered with banner-practice class');

  const statGrid = doc.querySelector('.stat-grid.practice-stats-grid');
  assert.ok(statGrid, 'Practice stat grid should have practice-stats-grid class');

  const statCards = Array.from(statGrid.querySelectorAll('.stat-card'));
  assert.equal(statCards.length, 4, 'Should render 4 stat cards');

  // Verify labels
  const labels = statCards.map((c) => c.querySelector('.stat-card-label')?.textContent?.trim());
  assert.ok(labels.includes('Bài có thể luyện'));
  assert.ok(labels.includes('Bài đã AC'));
  assert.ok(labels.includes('Đã đánh dấu'));
  assert.ok(labels.includes('Danh mục'));

  // Verify icons
  const icons = statCards.map((c) =>
    c.querySelector('.stat-card-icon svg')?.getAttribute('data-icon'),
  );
  assert.ok(icons.some((c) => c?.includes('book-open')));
  assert.ok(icons.some((c) => c?.includes('circle-check')));
  assert.ok(icons.some((c) => c?.includes('star')));
  assert.ok(icons.some((c) => c?.includes('layer-group')));

  // Test interactive filter clicking: click AC card
  const acCard = statCards.find(
    (c) => c.querySelector('.stat-card-label')?.textContent?.trim() === 'Bài đã AC',
  );
  assert.ok(acCard.classList.contains('is-clickable'));

  await w.harness.act(async () => {
    acCard.click();
  });

  // Table rows should now show only solved problems (1 problem)
  const rows = doc.querySelectorAll('.problem-library-table tbody tr');
  assert.equal(rows.length, 1, 'Only AC problems should be shown after clicking AC stat card');
  assert.ok(rows[0].textContent.includes('Two Sum'));
});

test('submissions component renders modern stats grid with filter actions', async () => {
  const bundle = await build({
    stdin: {
      contents: `
        import React, { act } from 'react';
        import { createRoot } from 'react-dom/client';
        import { SubmissionsPage } from './src/pages/Records.jsx';

        const root = createRoot(document.getElementById('root'));
        window.harness = {
          act,
          render: (props) => root.render(React.createElement(SubmissionsPage, props)),
          unmount: () => root.unmount(),
        };
      `,
      resolveDir: frontendDir,
      loader: 'jsx',
    },
    bundle: true,
    write: false,
    format: 'iife',
    define: { 'process.env.NODE_ENV': '"development"' },
    plugins: [
      {
        name: 'submissions-stubs',
        setup(b) {
          b.onResolve({ filter: /lib\/live$/ }, () => ({ path: 'live', namespace: 'stub' }));
          b.onResolve({ filter: /lib\/locale$/ }, () => ({ path: 'locale', namespace: 'stub' }));
          b.onResolve({ filter: /components\/ui$/ }, () => ({ path: 'ui', namespace: 'stub' }));
          b.onResolve({ filter: /components\/SubmissionStatus$/ }, () => ({
            path: 'status',
            namespace: 'stub',
          }));
          b.onResolve({ filter: /components\/SubmissionResult$/ }, () => ({
            path: 'result',
            namespace: 'stub',
          }));
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => {
            if (a.path === 'live') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export const live = { call: () => Promise.resolve(), offset: 0 };`,
              };
            }
            if (a.path === 'locale') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export const t = (s) => s;`,
              };
            }
            if (a.path === 'status') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `import React from 'react'; export default function SubmissionStatus({ submission }) { return <span>{submission.status}</span>; }`,
              };
            }
            if (a.path === 'result') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export default () => null;`,
              };
            }
            if (a.path === 'ui') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `
                  import React from 'react';
                  export { default as Heading } from './src/components/PageBanner.jsx';
                  export const Badge = ({ children, tone }) => <span className={'badge ' + (tone || '')}>{children}</span>;
                  export const ErrorBox = () => null;
                  export const Loading = () => <div className="loading">Loading...</div>;
                  export const Check = () => null;
                  export function useResource(name, params) {
                    if (name === 'SUBMISSIONS') {
                      return [[
                        { id: 's1', problem_id: 'p1', title: 'Two Sum', language: 'cpp11', status: 'WA', mode: 'PRACTICE', received_at: Date.now(), score: 0 },
                        { id: 's2', problem_id: 'p2', title: 'Binary Search', language: 'cpp17', status: 'AC', mode: 'PRACTICE', received_at: Date.now(), score: 100 },
                      ], null];
                    }
                    if (name === 'SUBMISSIONS_PAGE') {
                      const filter = params?.filter || 'all';
                      const items = filter === 'ac'
                        ? [{ id: 's2', problem_id: 'p2', title: 'Binary Search', language: 'cpp17', status: 'AC', mode: 'PRACTICE', received_at: Date.now(), score: 100 }]
                        : [{ id: 's1', problem_id: 'p1', title: 'Two Sum', language: 'cpp11', status: 'WA', mode: 'PRACTICE', received_at: Date.now(), score: 0 },
                           { id: 's2', problem_id: 'p2', title: 'Binary Search', language: 'cpp17', status: 'AC', mode: 'PRACTICE', received_at: Date.now(), score: 100 }];
                      return [{ filter, pageSize: params?.pageSize || 20, page: 1, totalPages: 1, total: items.length, items }, null];
                    }
                    return [null, null];
                  }
                `,
              };
            }
          });
        },
      },
    ],
  });

  const dom = new JSDOM('<div id="root"></div>', {
    url: 'https://codegrade.test/#/submissions',
    runScripts: 'outside-only',
  });
  const w = dom.window;
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    }
  };
  w.eval(bundle.outputFiles[0].text);

  await w.harness.act(async () => {
    w.harness.render({ revision: 1 });
  });

  const doc = w.document;
  const banner = doc.querySelector('.page-banner.submissions-banner');
  assert.ok(banner, 'Submissions banner should be rendered with banner-submissions class');

  const statGrid = doc.querySelector('.stat-grid.submissions-stats-grid');
  assert.ok(statGrid, 'Submissions stat grid should have submissions-stats-grid class');

  const statCards = Array.from(statGrid.querySelectorAll('.stat-card'));
  assert.equal(statCards.length, 4, 'Should render 4 stat cards');

  // Verify labels
  const labels = statCards.map((c) => c.querySelector('.stat-card-label')?.textContent?.trim());
  assert.ok(labels.includes('Lượt nộp chính thức'));
  assert.ok(labels.includes('Lượt đạt AC'));
  assert.ok(labels.includes('Đang chờ chấm'));
  assert.ok(labels.includes('Điểm cao nhất'));

  // Verify notes
  const notes = statCards.map((c) => c.querySelector('.stat-card-note')?.textContent?.trim());
  assert.ok(notes.includes('Tổng bài đã gửi'));
  assert.ok(notes.includes('Lời giải chính xác'));
  assert.ok(notes.includes('Đang xử lý'));
  assert.ok(notes.includes('Thành tích tối đa'));

  // Test interactive click on AC card
  const acCard = statCards.find(
    (c) => c.querySelector('.stat-card-label')?.textContent?.trim() === 'Lượt đạt AC',
  );
  assert.ok(acCard.classList.contains('is-clickable'));

  await w.harness.act(async () => {
    acCard.click();
  });

  // Active tab should now be "Đã AC"
  const activeTab = doc.querySelector('.tabs button.active');
  assert.equal(activeTab?.textContent?.trim(), 'Đã AC');
});
