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

test('bilingual translation covers all contest terms in both VI and EN', () => {
  const extra = JSON.parse(readFileSync(join(frontendDir, 'src/lib/translations.json'), 'utf8'));
  const pairs = Object.assign({}, extra);
  const viToEn = {}, enToVi = {};
  for (const [a, b] of Object.entries(pairs)) {
    if (/[À-ỹ]/.test(a) && !/[À-ỹ]/.test(b)) {
      viToEn[a.trim()] = b.trim();
      enToVi[b.trim()] = a.trim();
    } else if (!/[À-ỹ]/.test(a) && /[À-ỹ]/.test(b)) {
      viToEn[b.trim()] = a.trim();
      enToVi[a.trim()] = b.trim();
    }
  }

  const contestKeys = [
    'Đang diễn ra',
    'Sắp diễn ra',
    'Đang chốt điểm',
    'Đã kết thúc',
    'Của bạn',
    'Tất cả',
    'Đã tham gia',
    'Chờ duyệt',
    'Tạo contest',
    'Luyện tập trước kỳ thi',
    'Đăng ký tham gia',
    'Quay lại danh sách contest',
    'Quay lại danh sách',
    'Không gian cuộc thi',
    'Chi tiết cuộc thi',
    'Danh sách bài thi',
    'Bảng điểm trực tiếp',
    'Thể lệ & Thông tin',
    'Đề bài đang được bảo mật',
    'Làm bài ngay',
    'Bắt đầu',
    'Kết thúc',
    'Thời lượng',
    'Hình thức tham gia',
    'Điểm xếp hạng',
    'Tự lưu nháp thi đấu',
    'Đã AC',
    'Làm lại →'
  ];

  for (const key of contestKeys) {
    assert.ok(viToEn[key], `Missing English translation for: "${key}"`);
    assert.ok(enToVi[viToEn[key]], `Missing Vietnamese reverse mapping for: "${viToEn[key]}"`);
  }
});

test('contest component toggles between list view and dedicated arena space', async () => {
  const bundle = await build({
    stdin: {
      contents: `
        import React, { act } from 'react';
        import { createRoot } from 'react-dom/client';
        import Contests from './src/pages/Contests.jsx';

        const root = createRoot(document.getElementById('root'));
        window.harness = {
          act,
          render: (props) => root.render(React.createElement(Contests, props)),
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
        name: 'contest-stubs',
        setup(b) {
          b.onResolve({ filter: /lib\/live$/ }, () => ({ path: 'live', namespace: 'stub' }));
          b.onResolve({ filter: /lib\/locale$/ }, () => ({ path: 'locale', namespace: 'stub' }));
          b.onResolve({ filter: /components\/Insights$/ }, () => ({ path: 'insights', namespace: 'stub' }));
          b.onResolve({ filter: /components\/ui$/ }, () => ({ path: 'ui', namespace: 'stub' }));
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => {
            if (a.path === 'live') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export const live = { call: () => Promise.resolve({ contest: { id: 'c1', title: 'Contest 1 Alpha', startsAt: 1000, endsAt: 3000, participants: ['u1'], problemIds: ['p1'] }, standings: [] }), offset: 0 };`,
              };
            }
            if (a.path === 'locale') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export const t = (s) => s; export const locale = 'vi';`,
              };
            }
            if (a.path === 'insights') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `
                  import React from 'react';
                  export const useNow = () => 1500;
                  export const StatGrid = () => <div className="stat-grid-mock" />;
                  export const InsightPanel = ({ title, children }) => <section><h3>{title}</h3>{children}</section>;
                  export const contestState = (c, now) => { if (c.settled) return 'finished'; if (now < c.startsAt) return 'upcoming'; if (now < c.endsAt) return 'live'; return 'grading'; };
                  export const contestInsights = (contests, now, uid) => ({ live: 1, upcoming: 1, joined: 1, pending: 0, next: contests[0] });
                `,
              };
            }
            if (a.path === 'ui') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `
                  import React from 'react';
                  export const Heading = ({ children, title }) => <header><h1>{title}</h1>{children}</header>;
                  export const ErrorBox = () => null;
                  export const Loading = () => <div>Loading</div>;
                  export const Badge = ({ children }) => <span>{children}</span>;
                  export const Check = ({ label }) => <label>{label}</label>;
                  export const TimeLeft = () => <span>00:10:00</span>;
                  export const go = (p) => { window.location.hash = p; };
                  export const useResource = (type) => {
                    if (type === 'CONTEST_LIST') {
                      return [[
                        { id: 'c1', title: 'Contest 1 Alpha', startsAt: 1000, endsAt: 3000, participants: ['u1'], problemIds: ['p1', 'p2'], rated: true },
                        { id: 'c2', title: 'Contest 2 Beta', startsAt: 4000, endsAt: 6000, participants: [], problemIds: ['p2'], rated: false }
                      ], null];
                    }
                    if (type === 'CONTEST_GET') {
                      return [{
                        contest: { id: 'c1', title: 'Contest 1 Alpha', startsAt: 1000, endsAt: 3000, participants: ['u1'], problemIds: ['p1', 'p2'], rated: true, problemCount: 2, problemTitles: { p1: 'Problem One Alpha', p2: 'Problem Two Beta' } },
                        standings: [{ userId: 'u1', name: 'User 1', score: 100, ac: 1, penalty: 120 }]
                      }, null];
                    }
                    if (type === 'SUBMISSIONS') {
                      return [window.mockSubmissions || [
                        { id: 's1', problem_id: 'p1', status: 'AC', contest_id: 'c1' },
                        { id: 's2', problem_id: 'p2', status: 'WA', contest_id: 'c1' }
                      ], null];
                    }
                    if (type === 'PROBLEMS') {
                      return [[
                        { id: 'p1', title: 'Problem One Alpha', publicId: 'CG-0001', difficulty: 1, category: 'Mảng' },
                        { id: 'p2', title: 'Problem Two Beta', publicId: 'CG-0002', difficulty: 2, category: 'Chuỗi' }
                      ], null];
                    }
                    return [[], null];
                  };
                `,
              };
            }
          });
        },
      },
    ],
  });

  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  const w = dom.window;
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    }
  };
  w.eval(bundle.outputFiles[0].text);

  const act = w.harness.act;

  // 1. Initial render with no contestId -> shows list view
  await act(async () => {
    w.harness.render({
      user: { id: 'u1', role: 'CODER' },
      revision: 0,
      onNotice: () => {},
      contestId: null,
    });
  });

  // Verify list view elements are present and arena is absent
  assert.ok(w.document.querySelector('.contest-cards'), 'Contest cards grid should be visible in list view');
  assert.equal(w.document.querySelectorAll('.contest-card').length, 2, 'Should display 2 contest cards');
  assert.equal(w.document.querySelector('#contest-space'), null, 'Dedicated arena should NOT be rendered in list view');

  // 2. Click the first contest card
  const firstCard = w.document.querySelectorAll('.contest-card')[0];
  await act(async () => {
    firstCard.click();
  });

  // Verify dedicated arena is now visible and list is hidden
  assert.ok(w.document.querySelector('#contest-space'), 'Dedicated contest space should be visible');
  assert.equal(w.document.querySelector('.contest-cards'), null, 'Contest cards list should be hidden in dedicated space');
  assert.equal(w.document.querySelector('.tabs'), null, 'Filter tabs should be hidden in dedicated space');
  assert.ok(w.document.body.textContent.includes('Contest 2 Beta'), 'Contest title should be shown in dedicated space');

  // 3. Click back button
  const backBtn = w.document.querySelector('.contest-back-btn');
  assert.ok(backBtn, 'Back button should be present in dedicated space');
  await act(async () => {
    backBtn.click();
  });

  // Verify it returns to contest list view
  assert.ok(w.document.querySelector('.contest-cards'), 'Contest cards grid should be restored after back click');
  assert.equal(w.document.querySelector('#contest-space'), null, 'Dedicated arena should be hidden after back click');

  await act(async () => {
    w.harness.unmount();
  });
  w.close();
});

test('contest problems that are AC are styled with green color, check badge, and retry button', async () => {
  const bundle = await build({
    stdin: {
      contents: `
        import React, { act } from 'react';
        import { createRoot } from 'react-dom/client';
        import Contests from './src/pages/Contests.jsx';

        const root = createRoot(document.getElementById('root'));
        window.harness = {
          act,
          render: (props) => root.render(React.createElement(Contests, props)),
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
        name: 'contest-stubs',
        setup(b) {
          b.onResolve({ filter: /lib\/live$/ }, () => ({ path: 'live', namespace: 'stub' }));
          b.onResolve({ filter: /lib\/locale$/ }, () => ({ path: 'locale', namespace: 'stub' }));
          b.onResolve({ filter: /components\/Insights$/ }, () => ({ path: 'insights', namespace: 'stub' }));
          b.onResolve({ filter: /components\/ui$/ }, () => ({ path: 'ui', namespace: 'stub' }));
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (a) => {
            if (a.path === 'live') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export const live = { call: () => Promise.resolve({ contest: { id: 'c1', title: 'Contest 1 Alpha', startsAt: 1000, endsAt: 3000, participants: ['u1'], problemIds: ['p1', 'p2'] }, standings: [] }), offset: 0 };`,
              };
            }
            if (a.path === 'locale') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `export const t = (s) => s; export const locale = 'vi';`,
              };
            }
            if (a.path === 'insights') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `
                  import React from 'react';
                  export const useNow = () => 1500;
                  export const StatGrid = () => <div className="stat-grid-mock" />;
                  export const InsightPanel = ({ title, children }) => <section><h3>{title}</h3>{children}</section>;
                  export const contestState = (c, now) => { if (c.settled) return 'finished'; if (now < c.startsAt) return 'upcoming'; if (now < c.endsAt) return 'live'; return 'grading'; };
                  export const contestInsights = (contests, now, uid) => ({ live: 1, upcoming: 1, joined: 1, pending: 0, next: contests[0] });
                `,
              };
            }
            if (a.path === 'ui') {
              return {
                loader: 'jsx',
                resolveDir: frontendDir,
                contents: `
                  import React from 'react';
                  export const Heading = ({ children, title }) => <header><h1>{title}</h1>{children}</header>;
                  export const ErrorBox = () => null;
                  export const Loading = () => <div>Loading</div>;
                  export const Badge = ({ children, tone }) => <span className={'badge ' + (tone || '')}>{children}</span>;
                  export const Check = ({ label }) => <label>{label}</label>;
                  export const TimeLeft = () => <span>00:10:00</span>;
                  export const go = (p) => { window.location.hash = p; };
                  export const useResource = (type) => {
                    if (type === 'CONTEST_LIST') {
                      return [[
                        { id: 'c1', title: 'Contest 1 Alpha', startsAt: 1000, endsAt: 3000, participants: ['u1'], problemIds: ['p1', 'p2'], rated: true },
                        { id: 'c2', title: 'Contest 2 Beta', startsAt: 4000, endsAt: 6000, participants: [], problemIds: ['p2'], rated: false }
                      ], null];
                    }
                    if (type === 'CONTEST_GET') {
                      return [{
                        contest: { id: 'c1', title: 'Contest 1 Alpha', startsAt: 1000, endsAt: 3000, participants: ['u1'], problemIds: ['p1', 'p2'], rated: true, problemCount: 2, problemTitles: { p1: 'Problem One Alpha', p2: 'Problem Two Beta' } },
                        standings: [{ userId: 'u1', name: 'User 1', score: 100, ac: 1, penalty: 120 }]
                      }, null];
                    }
                    if (type === 'SUBMISSIONS') {
                      return [[
                        { id: 's1', problem_id: 'p1', status: 'AC', contest_id: 'c1' },
                        { id: 's2', problem_id: 'p2', status: 'WA', contest_id: 'c1' }
                      ], null];
                    }
                    if (type === 'PROBLEMS') {
                      return [[
                        { id: 'p1', title: 'Problem One Alpha', publicId: 'CG-0001', difficulty: 1, category: 'Mảng' },
                        { id: 'p2', title: 'Problem Two Beta', publicId: 'CG-0002', difficulty: 2, category: 'Chuỗi' }
                      ], null];
                    }
                    return [[], null];
                  };
                `,
              };
            }
          });
        },
      },
    ],
  });

  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', runScripts: 'outside-only' });
  const w = dom.window;
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.MessageChannel = class {
    constructor() {
      this.port1 = { onmessage: null };
      this.port2 = { postMessage: () => setTimeout(() => this.port1.onmessage?.(), 0) };
    }
  };
  w.eval(bundle.outputFiles[0].text);

  const act = w.harness.act;

  // Mount directly with contestId: 'c1'
  await act(async () => {
    w.harness.render({
      user: { id: 'u1', role: 'CODER' },
      revision: 0,
      onNotice: () => {},
      contestId: 'c1',
    });
  });

  // Verify problem cards
  const cards = w.document.querySelectorAll('.contest-problem-card');
  assert.equal(cards.length, 2, 'Should display 2 problem cards');

  // Problem 1: Solved with AC in contest 'c1'
  const acCard = cards[0];
  assert.ok(acCard.classList.contains('is-ac'), 'First problem should have is-ac class');
  const acBadge = acCard.querySelector('.contest-letter-badge');
  assert.ok(acBadge.classList.contains('is-ac'), 'Letter badge should have is-ac class');
  assert.ok(acCard.textContent.includes('Đã AC'), 'Card should display "Đã AC" indicator');
  assert.ok(acCard.textContent.includes('Làm lại →'), 'Card button should show "Làm lại →"');

  // Problem 2: WA in contest 'c1'
  const waCard = cards[1];
  assert.equal(waCard.classList.contains('is-ac'), false, 'Second problem should NOT have is-ac class');
  const waBadge = waCard.querySelector('.contest-letter-badge');
  assert.equal(waBadge.classList.contains('is-ac'), false, 'Letter badge should NOT have is-ac class');
  assert.equal(waCard.textContent.includes('Đã AC'), false, 'Unsolved problem should NOT display "Đã AC"');
  assert.ok(waCard.textContent.includes('Làm bài →'), 'Card button should show "Làm bài →"');

  // Verify contest AC progress chip
  const chipAc = w.document.querySelector('.contest-chip.ac');
  assert.ok(chipAc, 'Should display progress chip for AC problems');
  assert.ok(chipAc.textContent.includes('Đã AC: 1/2'), 'Progress chip should report 1/2 AC');

  await act(async () => {
    w.harness.unmount();
  });
  w.close();
});
