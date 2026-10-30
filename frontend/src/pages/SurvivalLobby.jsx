import { Button as ActionLink, Button as UiButton } from '../components/ui/button';
import Icon from '../components/Icon';
import { Input as UiInput } from '../components/ui/input';
import { Label as UiLabel } from '../components/ui/label';
import { NativeSelect as UiNativeSelect } from '../components/ui/native-select';
import { DataTable as UiTable } from '../components/DataTable';
import {
  TableBody as UiTableBody,
  TableCell as UiTableCell,
  TableHead as UiTableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from '../components/ui/table';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import ProgressionStrip from '../components/ProgressionStrip';
import RankEmblem from '../components/RankEmblem';
import { live } from '../lib/live';
import { Badge, ErrorBox, Loading, useResource, go, TimeLeft } from '../components/ui';
const MODES = [
  {
    id: 'PRACTICE',
    name: 'Giao lưu',
    tag: 'CUSTOM ROOM',
    icon: 'fa-terminal',
    detail: 'Lập đội cùng bạn bè, luyện kỹ năng qua từng vòng.',
    facts: [
      '2–10 người · Phòng riêng',
      'Tùy chọn độ khó & thời gian',
      'Không cộng EXP · Không tính Rank',
    ],
  },
  {
    id: 'NORMAL',
    name: 'Đấu thường',
    tag: 'QUICK MATCH',
    icon: 'fa-bolt',
    detail: 'Vào trận, giải đề và trở thành người trụ lại.',
    facts: ['5 người · Ghép trận tự động', 'Nhận EXP theo thứ hạng', 'Không thay đổi điểm Rank'],
  },
  {
    id: 'RANKED',
    name: 'Đấu Rank',
    tag: 'RANKED ARENA',
    icon: 'fa-trophy',
    detail: 'Đối đầu xứng tầm. Chinh phục thứ hạng mới.',
    facts: ['5 người · Ghép theo rating', 'Tích lũy EXP & điểm Rank', 'Tiến lên bảng xếp hạng'],
  },
];
function ModeCard({ item, selected, disabled, onSelect }) {
  return (
    <UiButton
      type="button"
      className={cn(
        'mode-card flex h-auto min-h-[280px] w-full flex-col items-stretch justify-start gap-[22px] rounded-2xl border border-t-4 bg-card p-[30px] text-left whitespace-normal text-foreground shadow-panel transition-all hover:-translate-y-[3px]',
        'mode-' + item.id.toLowerCase(),
        item.id === 'PRACTICE'
          ? 'border-t-success [&_.mode-icon]:bg-success-soft [&_.mode-icon]:text-success [&_.mode-status]:text-success [&_.mode-copy>small]:text-success hover:border-success hover:bg-success-soft'
          : item.id === 'NORMAL'
            ? 'border-t-action [&_.mode-icon]:bg-action-soft [&_.mode-icon]:text-action [&_.mode-status]:text-action-text [&_.mode-copy>small]:text-action-text hover:border-action hover:bg-action-soft'
            : 'border-t-gold [&_.mode-icon]:bg-warning-soft [&_.mode-icon]:text-warning [&_.mode-status]:text-warning [&_.mode-copy>small]:text-warning hover:border-warning hover:bg-warning-soft',
        selected && 'selected ring-1',
        selected &&
          (item.id === 'PRACTICE'
            ? 'border-success bg-success-soft ring-success [&_.mode-icon]:bg-success [&_.mode-icon]:text-white'
            : item.id === 'NORMAL'
              ? 'border-action bg-action-soft ring-action [&_.mode-icon]:bg-action [&_.mode-icon]:text-white'
              : 'border-warning bg-warning-soft ring-warning [&_.mode-icon]:bg-gold [&_.mode-icon]:text-warning'),
      )}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      variant="outline"
    >
      <span
        className="mode-icon flex size-[68px] shrink-0 items-center justify-center rounded-2xl [&>svg]:size-[34px]"
        aria-hidden="true"
      >
        <Icon name={'fa-solid ' + item.icon} />
      </span>
      <span className="mode-copy flex min-w-0 flex-col gap-2.5 [&>small]:font-mono [&>small]:text-[10px] [&>small]:font-normal [&>small]:tracking-[.1em] [&>strong]:font-heading [&>strong]:text-[30px] [&>strong]:leading-tight [&>strong]:font-extrabold [&>span]:text-[13px] [&>span]:leading-[1.7] [&>span]:font-normal [&>span]:text-muted-foreground">
        <small>{item.tag}</small>
        <strong>{item.name}</strong>
        <span>{item.detail}</span>
      </span>
      <span className="mode-status mt-auto flex w-full items-center justify-between gap-3 border-t pt-[18px] text-xs font-semibold">
        {selected ? 'Đang chọn' : 'Chọn chế độ'}
        <Icon
          name={'fa-solid ' + (selected ? 'fa-circle-check' : 'fa-arrow-right')}
          aria-hidden="true"
        />
      </span>
    </UiButton>
  );
}
function MatchmakingPanel({ mode, queue, waiting, found, waited, busy, user, action }) {
  return (
    <section
      className={
        'arena-box matchmaking-panel min-w-0 space-y-4 rounded-[14px] border bg-card p-5 ' +
        (waiting ? 'is-searching' : found ? 'match-found' : '')
      }
      aria-label="Tìm trận"
    >
      <div className="queue-heading flex flex-wrap items-center justify-between gap-3">
        <span className="eyebrow text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {mode === 'RANKED' ? 'RANKED MATCH' : 'QUICK MATCH'}
        </span>
        <Badge>MỤC TIÊU 5/5 CODER</Badge>
      </div>
      <div
        className="queue-visual flex items-center justify-center gap-2 rounded-[14px] bg-accent p-6 text-primary"
        aria-hidden="true"
      >
        <span />
        <Icon
          name={
            'fa-solid ' +
            (found
              ? 'fa-check'
              : waiting
                ? 'fa-satellite-dish'
                : mode === 'RANKED'
                  ? 'fa-trophy'
                  : 'fa-bolt')
          }
        />
      </div>
      <h3>
        {found
          ? 'Đã tìm thấy trận!'
          : waiting
            ? 'Đang tìm đối thủ'
            : mode === 'RANKED'
              ? 'Sẵn sàng leo hạng?'
              : 'Sẵn sàng vào đấu trường?'}
      </h3>
      {!found && (
        <div
          className="queue-squad flex items-center justify-center gap-2 [&>span]:flex [&>span]:size-9 [&>span]:items-center [&>span]:justify-center [&>span]:rounded-full [&>span]:border"
          aria-hidden="true"
        >
          {Array.from(
            {
              length: 5,
            },
            (_, i) => (
              <span key={i}>
                <Icon name="fa-solid fa-user" />
              </span>
            ),
          )}
        </div>
      )}
      {waiting ? (
        <div role="status" aria-live="polite">
          <div className="queue-elapsed">
            {String(Math.floor(waited / 60)).padStart(2, '0')}
            <span>:</span>
            {String(waited % 60).padStart(2, '0')}
          </div>
          <p>
            {queue.waiting} người đang chờ trong hàng đợi {queue.mode}.
          </p>
          {mode === 'RANKED' && (
            <p>
              Chênh lệch rating tối đa: {queue.ratingRange}. Phạm vi được nới theo thời gian chờ.
            </p>
          )}
          <UiButton
            className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
            disabled={busy}
            onClick={() => action('MATCH_QUEUE_CANCEL')}
            variant="outline"
          >
            Hủy tìm trận
          </UiButton>
        </div>
      ) : found ? (
        <div role="status">
          <p>{queue.accepted}/5 người đã xác nhận · Nhận trận trước khi hết thời gian</p>
          <div
            className="accept-slots flex items-center justify-center gap-2 [&>span]:flex [&>span]:size-9 [&>span]:items-center [&>span]:justify-center [&>span]:rounded-full [&>span]:border"
            aria-label={queue.accepted + ' trên 5 người đã xác nhận'}
          >
            {Array.from(
              {
                length: 5,
              },
              (_, i) => (
                <span
                  key={i}
                  className={
                    i < queue.accepted
                      ? 'confirmed border-emerald-200 bg-emerald-50 text-emerald-800'
                      : ''
                  }
                  aria-hidden="true"
                >
                  <Icon name={'fa-solid ' + (i < queue.accepted ? 'fa-check' : 'fa-user')} />
                </span>
              ),
            )}
          </div>
          <TimeLeft deadline={queue.acceptDeadline} />
          <div className="inline-group items-center queue-actions flex flex-wrap justify-center gap-3">
            <UiButton
              className="arena-game-button min-h-12 rounded-[9px] border border-action-active bg-action px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_4px_0_var(--action-active),0_7px_14px_rgb(198_83_22/.14)] hover:-translate-y-px hover:bg-action-hover active:translate-y-[3px] disabled:translate-y-0 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
              disabled={busy || queue.state === 'ACCEPTED'}
              onClick={() =>
                action('MATCH_ACCEPT', {
                  roomId: queue.roomId,
                })
              }
              variant="default"
            >
              {queue.state === 'ACCEPTED' ? 'Đã xác nhận · Chờ đủ 5 người' : 'Nhận trận'}
              <Icon name="fa-solid fa-check" aria-hidden="true" />
            </UiButton>
            <UiButton
              className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
              disabled={busy}
              onClick={() => action('MATCH_DECLINE')}
              variant="outline"
            >
              Từ chối
            </UiButton>
          </div>
        </div>
      ) : (
        <>
          <p>
            {mode === 'RANKED'
              ? 'Ghép với đối thủ theo rating. Kết quả trận quyết định EXP và điểm Rank của bạn.'
              : 'Đủ 5 Coder, trận đấu bắt đầu sau khi tất cả xác nhận. Sẵn sàng thử sức?'}
          </p>
          <UiButton
            className="arena-game-button min-h-12 rounded-[9px] border border-action-active bg-action px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_4px_0_var(--action-active),0_7px_14px_rgb(198_83_22/.14)] hover:-translate-y-px hover:bg-action-hover active:translate-y-[3px] disabled:translate-y-0 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none queue-play"
            disabled={busy || user.role !== 'CODER'}
            onClick={() =>
              action('MATCH_QUEUE_JOIN', {
                mode,
              })
            }
            variant="default"
          >
            <Icon name="fa-solid fa-play" aria-hidden="true" />
            {busy ? 'Đang xử lý…' : mode === 'RANKED' ? 'Tìm trận Ranked' : 'Tìm trận'}
            <Icon name="fa-solid fa-arrow-right" aria-hidden="true" />
          </UiButton>
          <small className="queue-reward">
            <Icon name="fa-solid fa-star" aria-hidden="true" /> EXP theo thứ hạng
            {mode === 'RANKED' ? ' · Có tính điểm Rank' : ' · Không tính điểm Rank'}
          </small>
        </>
      )}
      <details className="queue-policy">
        <summary>Quy tắc ghép trận & phần thưởng</summary>
        <p>
          Trận chỉ đếm ngược sau khi cả 5 người xác nhận. EXP theo hạng: 100 / 80 / 60 / 40 / 20;
          người đồng hạng nhận EXP theo vị trí thấp nhất của nhóm hòa. Ví dụ: một người nhất nhận
          100 EXP, bốn người còn lại hòa nhau nhận 20 EXP mỗi người. Chỉ Ranked thay đổi điểm Rank.
          Elo Contest được tính riêng. Phạm vi ghép Ranked tăng từ 150 → 250 → 350 → 400 điểm ở các
          mốc 10s, 20s, 30s.
        </p>
      </details>
    </section>
  );
}
export default function SurvivalLobby({ user, revision }) {
  const [rooms, roomError] = useResource('ROOM_LIST', {}, revision),
    [stats, statsError] = useResource('PROGRESSION_GET', {}, revision);
  const [leaders, leaderError] = useResource('RANKED_LEADERBOARD', {}, revision),
    [history, historyError] = useResource('MATCH_HISTORY', {}, revision);
  const [mode, M] = useState('PRACTICE'),
    [queue, Q] = useState(null),
    [error, E] = useState(null),
    [busy, B] = useState(false);
  const [name, N] = useState(''),
    [capacity, C] = useState(5),
    [levels, L] = useState([1, 2, 3]),
    [code, S] = useState(''),
    [clock, T] = useState(Date.now());
  useEffect(() => {
    if (user.role !== 'CODER') return;
    let active = true;
    const refresh = () =>
      live
        .call('MATCH_QUEUE_STATUS')
        .then((q) => {
          if (active) {
            Q(q);
            if (q.mode && ['WAITING', 'MATCH_FOUND', 'ACCEPTED', 'STARTED'].includes(q.state))
              M(q.mode);
            if (q.state === 'STARTED') go('/room/' + q.roomId);
          }
        })
        .catch((e) => {
          if (active) E(e);
        });
    refresh();
    const timer = setInterval(refresh, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user.id, revision]);
  useEffect(() => {
    const timer = setInterval(() => T(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function action(type, p = {}) {
    B(true);
    E(null);
    try {
      const q = await live.call(type, p);
      if (type === 'ROOM_CREATE' || type === 'ROOM_JOIN') {
        go('/room/' + q.id);
        return;
      }
      Q(q);
      if (q.state === 'STARTED') go('/room/' + q.roomId);
    } catch (e) {
      E(e);
    } finally {
      B(false);
    }
  }
  const waiting = queue?.state === 'WAITING',
    found = ['MATCH_FOUND', 'ACCEPTED'].includes(queue?.state),
    occupied = waiting || found;
  const waited = waiting
    ? Math.max(0, Math.floor((clock + (live.offset || 0) - queue.joinedAt) / 1000))
    : 0;
  const selectedMode = MODES.find((item) => item.id === mode);
  function focusModes(e) {
    e.preventDefault();
    document.getElementById('survival-modes')?.scrollIntoView({
      behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    document.querySelector('.mode-card[aria-pressed="true"]')?.focus({
      preventScroll: true,
    });
  }
  return (
    <div className="arena-lobby min-w-0 space-y-10">
      <section className="arena-hero relative isolate grid items-center gap-6 overflow-hidden rounded-2xl border border-b-[3px] border-b-primary bg-card px-5 py-6 shadow-panel sm:px-10 sm:py-8 min-[851px]:grid-cols-[minmax(0,1fr)_300px]">
        <div className="arena-hero-copy min-w-0 [&>h1]:mt-[18px] [&>h1]:mb-3 [&>h1]:font-heading [&>h1]:text-[clamp(32px,4.2vw,60px)] [&>h1]:leading-[1.05] [&>h1]:font-black [&>h1]:tracking-[-.055em] [&>h1>span]:text-action [&>p]:text-sm [&>p]:text-muted-foreground">
          <span className="arena-lobby-label inline-flex items-center gap-2 rounded-md border px-2.5 py-[5px] font-mono text-[10px] tracking-[.08em] text-success [&_svg]:text-action">
            <Icon name="fa-solid fa-gamepad" aria-hidden="true" /> MULTIPLAYER CODING ARENA
          </span>
          <h1>
            CODE <span>SURVIVAL</span>
            <span className="arena-title-dot !text-gold" aria-hidden="true">
              .
            </span>
          </h1>
          <p>Giải đề. Vượt vòng. Trở thành Coder trụ lại cuối cùng.</p>
          <div className="arena-hero-actions mt-6 flex flex-wrap items-center gap-5 pb-1">
            <ActionLink asChild variant="default">
              <a
                className="button arena-game-button min-h-12 rounded-[9px] border border-action-active bg-action px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_4px_0_var(--action-active),0_7px_14px_rgb(198_83_22/.14)] hover:-translate-y-px hover:bg-action-hover active:translate-y-[3px] disabled:translate-y-0 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                href="#survival-modes"
                onClick={focusModes}
              >
                <Icon name="fa-solid fa-play" aria-hidden="true" /> Chọn đấu trường{' '}
                <Icon name="fa-solid fa-arrow-down" aria-hidden="true" />
              </a>
            </ActionLink>
            <span className="arena-room-count inline-flex items-center gap-2 text-xs text-muted-foreground [&_svg]:text-success">
              <Icon name="fa-solid fa-door-open" aria-hidden="true" />
              {rooms ? rooms.length + ' phòng giao lưu' : 'Đang tải phòng…'}
            </span>
          </div>
        </div>
        <div
          className="arena-hero-art relative hidden min-h-[230px] flex-col items-center justify-center min-[851px]:flex before:absolute before:size-[170px] before:rotate-[18deg] before:rounded-3xl before:border before:border-success before:opacity-20 after:absolute after:size-[198px] after:-rotate-12 after:rounded-[34px] after:border after:border-dashed after:border-action after:opacity-30"
          aria-hidden="true"
        >
          <span className="code-left arena-art-code absolute top-[30px] left-2 -rotate-12 font-mono text-2xl text-success">
            &lt;/&gt;
          </span>
          <div className="arena-emblem z-10 flex h-44 w-[156px] flex-col items-center justify-center gap-3.5 bg-linear-[140deg,var(--warning-soft),#ffe291] [clip-path:polygon(24%_0,76%_0,100%_24%,100%_76%,50%_100%,0_76%,0_24%)] [&>svg]:size-[50px] [&>svg]:text-success [&>span]:text-center [&>span]:font-mono [&>span]:text-[10px] [&>span]:leading-normal [&>span]:font-bold [&>span]:tracking-[.12em] [&>span]:text-warning">
            <Icon name="fa-solid fa-trophy" />
            <span>
              LAST CODER
              <br />
              STANDING
            </span>
          </div>
          <span className="code-right arena-art-code absolute right-1 bottom-12 rotate-12 font-mono text-2xl text-action">
            {}
          </span>
          <div className="arena-art-caption absolute bottom-0 flex items-center gap-2 font-mono text-[8px] tracking-[.08em] text-muted-foreground [&>span]:h-[3px] [&>span]:w-3.5 [&>span]:bg-gold">
            <span /> CODE · COMPETE · SURVIVE <span />
          </div>
        </div>
      </section>
      <ErrorBox error={error || roomError || statsError || leaderError || historyError} />
      <div className="arena-player-banner min-w-0 overflow-hidden rounded-[14px] border border-t-[4px] border-t-primary bg-card shadow-panel [&>section]:m-0 [&>section]:border-0 [&>section]:shadow-none">
        {stats ? <ProgressionStrip stats={stats} user={user} showRankGuide /> : <Loading />}
      </div>
      <div className="arena-command-layout grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-9">
        <section className="arena-mode-picker min-w-0 space-y-5" aria-label="Chọn chế độ Survival">
          <div className="arena-section-heading mb-[22px] flex flex-wrap items-center justify-between gap-3.5 [&>div]:flex [&>div]:items-center [&>div]:gap-2.5 [&_h2]:text-lg [&>span]:text-[11px] [&>span]:text-muted-foreground">
            <div>
              <span className="arena-step inline-grid size-[30px] shrink-0 place-items-center rounded-lg border bg-success-soft font-mono text-[11px] font-bold text-success">
                01
              </span>
              <h2>Chọn chế độ</h2>
            </div>
            <span>Ba đấu trường. Một mục tiêu.</span>
          </div>
          <div
            id="survival-modes"
            className="survival-modes grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-3 sm:gap-7"
            aria-label="Chế độ Code Survival"
          >
            {MODES.map((item) => (
              <ModeCard
                key={item.id}
                item={item}
                selected={mode === item.id}
                disabled={busy || (occupied && mode !== item.id)}
                onSelect={() => M(item.id)}
              />
            ))}
          </div>
        </section>
        <section
          className="arena-stage arena-box min-w-0 space-y-4 rounded-[14px] border bg-card p-5 shadow-panel sm:p-8"
          aria-label="Thiết lập trận đấu"
        >
          <div className="arena-section-heading mb-[22px] flex flex-wrap items-center justify-between gap-3.5 [&>div]:flex [&>div]:items-center [&>div]:gap-2.5 [&_h2]:text-lg [&>span]:text-[11px] [&>span]:text-muted-foreground">
            <div>
              <span className="arena-step inline-grid size-[30px] shrink-0 place-items-center rounded-lg border bg-success-soft font-mono text-[11px] font-bold text-success">
                02
              </span>
              <h2>{mode === 'PRACTICE' ? 'Thiết lập phòng' : 'Chuẩn bị vào trận'}</h2>
            </div>
            <span
              className={
                'arena-selected-mode flex flex-wrap items-center justify-between gap-3 selected-' +
                mode.toLowerCase()
              }
            >
              <Icon name={'fa-solid ' + selectedMode.icon} aria-hidden="true" />
              {selectedMode.name}
            </span>
          </div>
          <ul
            className="arena-mode-facts mb-8 flex flex-wrap gap-x-6 gap-y-3 border-b pb-6 text-[11px] text-muted-foreground [&>li]:flex [&>li]:items-baseline [&>li]:gap-2 [&_svg]:text-success"
            aria-label={'Thông tin chế độ ' + selectedMode.name}
          >
            {selectedMode.facts.map((f) => (
              <li key={f}>
                <Icon name="fa-solid fa-check" aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>
          {mode === 'PRACTICE' ? (
            <>
              <div className="arena-practice block min-w-0">
                <section className="arena-create min-w-0 space-y-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      action('ROOM_CREATE', {
                        mode: 'PRACTICE',
                        ...(name.trim()
                          ? {
                              name: name.trim(),
                            }
                          : {}),
                        capacity,
                        selectedDifficulties: levels,
                      });
                    }}
                  >
                    <div className="arena-form-row grid grid-cols-[minmax(0,1fr)_85px] gap-3 sm:grid-cols-[minmax(0,1fr)_150px] sm:gap-6">
                      <UiLabel className="arena-form-field mb-6 grid gap-2.5 text-[11px] [&_input]:rounded-lg [&_input]:border-border [&_input]:text-xs [&_select]:rounded-lg [&_select]:border-border [&_select]:text-xs">
                        Tên phòng
                        <UiInput
                          maxLength={100}
                          value={name}
                          onChange={(e) => N(e.target.value)}
                          placeholder="Đặt tên cho đấu trường"
                        />
                      </UiLabel>
                      <UiLabel className="arena-form-field mb-6 grid gap-2.5 text-[11px] [&_input]:rounded-lg [&_input]:border-border [&_input]:text-xs [&_select]:rounded-lg [&_select]:border-border [&_select]:text-xs">
                        Số người
                        <UiNativeSelect value={capacity} onChange={(e) => C(+e.target.value)}>
                          {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <option key={n}>{n}</option>
                          ))}
                        </UiNativeSelect>
                      </UiLabel>
                    </div>
                    <fieldset disabled={busy || occupied}>
                      <legend>Độ khó đề bài</legend>
                      <div className="arena-levels grid max-w-[520px] grid-cols-6 gap-1.5 sm:gap-3">
                        {[1, 2, 3, 4, 5, 6].map((d) => (
                          <UiLabel
                            className="arena-level relative flex min-h-10 items-center justify-center gap-[5px] rounded-[7px] border bg-card px-1 font-mono text-xs font-bold text-muted-foreground has-checked:border-success has-checked:bg-success-soft has-checked:text-success has-checked:shadow-[inset_0_-2px_var(--success)] [&_input]:size-3"
                            key={d}
                          >
                            <input
                              type="checkbox"
                              aria-label={'Mức ' + d}
                              checked={levels.includes(d)}
                              onChange={(e) =>
                                L(e.target.checked ? [...levels, d] : levels.filter((x) => x !== d))
                              }
                              className="size-4 rounded border-input accent-primary"
                            />
                            <span>{d}</span>
                          </UiLabel>
                        ))}
                      </div>
                    </fieldset>
                    <div className="arena-launch-footer flex flex-wrap items-center justify-between gap-5 pt-2 pb-1 [&>small]:flex [&>small]:items-center [&>small]:gap-1.5 [&>small]:text-[10px] [&_svg]:text-success">
                      <small>
                        <Icon name="fa-solid fa-shield-halved" aria-hidden="true" /> Luyện tập tự do
                        · Không tính EXP / điểm Rank
                      </small>
                      <UiButton
                        className="arena-game-button min-h-12 rounded-[9px] border border-action-active bg-action px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_4px_0_var(--action-active),0_7px_14px_rgb(198_83_22/.14)] hover:-translate-y-px hover:bg-action-hover active:translate-y-[3px] disabled:translate-y-0 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                        disabled={busy || occupied || user.role !== 'CODER' || !levels.length}
                        variant="default"
                      >
                        <Icon name="fa-solid fa-plus" aria-hidden="true" />
                        Tạo phòng
                        <Icon name="fa-solid fa-arrow-right" aria-hidden="true" />
                      </UiButton>
                    </div>
                  </form>
                </section>
                <section className="arena-join mt-8 grid min-w-0 grid-cols-[38px_minmax(0,1fr)] items-start gap-x-3.5 border-t pt-7 sm:grid-cols-[38px_minmax(150px,1fr)_minmax(260px,1.1fr)] [&>span.arena-small-icon]:col-start-1 [&>span.arena-small-icon]:row-span-3 [&>span.eyebrow]:col-start-2 [&>h3]:col-start-2 [&>h3]:text-[17px] [&>p]:col-start-2 [&>p]:text-[11px] [&>p]:text-muted-foreground [&>form]:col-span-full [&>form]:mt-5 [&>form]:grid [&>form]:gap-3 sm:[&>form]:col-span-1 sm:[&>form]:col-start-3 sm:[&>form]:row-start-1 sm:[&>form]:row-end-4 sm:[&>form]:mt-0 sm:[&>form]:grid-cols-[minmax(0,1fr)_auto] sm:[&>form]:items-end [&_input]:font-mono [&_input]:text-xs [&_label]:text-[11px]">
                  <span className="arena-small-icon inline-grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-success-soft text-success [&>svg]:size-4">
                    <Icon name="fa-solid fa-ticket" aria-hidden="true" />
                  </span>
                  <span className="eyebrow text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    PARTY INVITE
                  </span>
                  <h3>Đã có đồng đội?</h3>
                  <p>Nhập mã mời và bước vào phòng cùng bạn bè.</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      action('ROOM_JOIN', {
                        roomId: code.trim(),
                      });
                    }}
                  >
                    <UiLabel className="grid gap-2 text-sm font-medium">
                      Mã phòng
                      <UiInput
                        value={code}
                        maxLength={36}
                        required
                        placeholder="Nhập mã mời"
                        autoComplete="off"
                        onChange={(e) => S(e.target.value.toUpperCase())}
                      />
                    </UiLabel>
                    <UiButton
                      className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
                      disabled={busy || occupied}
                      variant="outline"
                    >
                      Tham gia phòng
                      <Icon name="fa-solid fa-arrow-right" aria-hidden="true" />
                    </UiButton>
                  </form>
                </section>
              </div>
            </>
          ) : (
            <MatchmakingPanel
              mode={mode}
              queue={queue}
              waiting={waiting}
              found={found}
              waited={waited}
              busy={busy}
              user={user}
              action={action}
            />
          )}
        </section>
      </div>
      {mode === 'PRACTICE' && (
        <section className="arena-room-browser mt-12 space-y-5" aria-label="Phòng giao lưu">
          <div className="arena-section-heading mb-[22px] flex flex-wrap items-center justify-between gap-3.5 [&>div]:flex [&>div]:items-center [&>div]:gap-2.5 [&_h2]:text-lg [&>span]:text-[11px] [&>span]:text-muted-foreground">
            <div>
              <Icon name="fa-solid fa-door-open" aria-hidden="true" />
              <h2>Phòng đang mở</h2>
            </div>
            <Badge>{rooms?.length ?? '—'} phòng</Badge>
          </div>
          {!rooms ? (
            <Loading />
          ) : (
            <div className="room-grid grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((r) => (
                <UiButton
                  key={r.id}
                  className="room-card flex h-auto min-w-0 flex-col items-stretch justify-start gap-0 rounded-xl border border-b-[3px] border-b-primary bg-card p-5 text-left whitespace-normal text-foreground shadow-subtle [&_h3]:my-4 [&_h3]:text-base [&_p]:text-[11px] [&_p]:text-muted-foreground"
                  disabled={busy || occupied}
                  onClick={() =>
                    action('ROOM_JOIN', {
                      roomId: r.id,
                    })
                  }
                  variant="default"
                >
                  <div className="inline-group between flex flex-wrap items-center justify-between gap-3">
                    <Badge>{r.state}</Badge>
                    <span className="arena-room-capacity">
                      <Icon name="fa-solid fa-users" aria-hidden="true" /> {r.count}/{r.capacity}
                    </span>
                  </div>
                  <h3 data-user-content>{r.name}</h3>
                  <p data-user-content>
                    {r.hostName} · Mã {r.code}
                  </p>
                  <span className="room-enter mt-3.5 flex items-center justify-between gap-2 border-t pt-3 text-[11px] text-action-text">
                    Tham gia / xem{' '}
                    <Icon name="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                  </span>
                </UiButton>
              ))}
              {!rooms.length && (
                <div className="arena-box min-w-0 space-y-4 bg-card arena-empty rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
                  <span className="arena-small-icon inline-grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-success-soft text-success [&>svg]:size-4">
                    <Icon name="fa-solid fa-door-open" aria-hidden="true" />
                  </span>
                  <div>
                    <h3>Phòng đầu tiên đang chờ bạn</h3>
                    <p>Tạo phòng ở trên và gửi mã mời cho đồng đội.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
      <details className="arena-howto border-t pt-5 [&>summary]:flex [&>summary]:items-center [&>summary]:gap-3">
        <summary>
          <span className="arena-small-icon inline-grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-success-soft text-success [&>svg]:size-4">
            <Icon name="fa-solid fa-book-open" aria-hidden="true" />
          </span>
          <span>Luật chơi nhanh</span>
          <Icon name="fa-solid fa-chevron-down" aria-hidden="true" />
        </summary>
        <div className="arena-howto-content grid gap-4 md:grid-cols-3">
          <h3>Luật đơn giản. Thử thách thật.</h3>
          <ol>
            <li>
              <span>01</span>
              <div>
                <b>Giải đúng</b>
                <small>Chinh phục đề trong thời gian vòng đấu.</small>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <b>Vượt vòng</b>
                <small>AC nhanh để tranh suất đi tiếp.</small>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <b>Trụ lại</b>
                <small>Hướng tới vị trí Coder cuối cùng.</small>
              </div>
            </li>
          </ol>
        </div>
      </details>
      <div className="arena-results-grid grid gap-8 min-[851px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="arena-match-history arena-box min-w-0 space-y-3 rounded-[14px] border bg-card p-7 shadow-panel">
          <div className="arena-section-heading mb-[22px] flex flex-wrap items-center justify-between gap-3.5 [&>div]:flex [&>div]:items-center [&>div]:gap-2.5 [&_h2]:text-lg [&>span]:text-[11px] [&>span]:text-muted-foreground">
            <div>
              <span className="arena-small-icon inline-grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-success-soft text-success [&>svg]:size-4">
                <Icon name="fa-solid fa-clock-rotate-left" aria-hidden="true" />
              </span>
              <h2>Lịch sử chiến đấu</h2>
            </div>
            <span>Thành tích qua từng trận</span>
          </div>
          {!history ? (
            <Loading />
          ) : history.length ? (
            <div className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card">
              <UiTable>
                <UiTableHeader>
                  <UiTableRow>
                    <UiTableHead>Chế độ</UiTableHead>
                    <UiTableHead>Thứ hạng</UiTableHead>
                    <UiTableHead>EXP nhận được</UiTableHead>
                    <UiTableHead>Điểm Rank</UiTableHead>
                    <UiTableHead>Trận đấu</UiTableHead>
                  </UiTableRow>
                </UiTableHeader>
                <UiTableBody>
                  {history.map((h) => (
                    <UiTableRow key={h.room_id}>
                      <UiTableCell>
                        <Badge>{MODES.find((item) => item.id === h.mode)?.name || h.mode}</Badge>
                      </UiTableCell>
                      <UiTableCell>
                        <span
                          className={'arena-history-rank ' + (h.placement === 1 ? 'winner' : '')}
                        >
                          {h.placement === 1 && (
                            <Icon name="fa-solid fa-trophy" aria-hidden="true" />
                          )}{' '}
                          #{h.placement}
                        </span>
                      </UiTableCell>
                      <UiTableCell>
                        <span className="arena-history-exp">+{h.exp} EXP</span>
                      </UiTableCell>
                      <UiTableCell>
                        {h.mode === 'RANKED' ? `${h.rating_before} → ${h.rating_after}` : '—'}
                      </UiTableCell>
                      <UiTableCell>
                        <a href={'#/room/' + h.room_id}>
                          Xem trận <Icon name="fa-solid fa-arrow-right" aria-hidden="true" />
                        </a>
                      </UiTableCell>
                    </UiTableRow>
                  ))}
                </UiTableBody>
              </UiTable>
            </div>
          ) : (
            <div className="arena-history-empty rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
              <Icon name="fa-solid fa-flag-checkered" aria-hidden="true" />
              <div>
                <h3>Mỗi trận đấu là một bước tiến</h3>
                <p>
                  Kết quả, EXP và thay đổi điểm Rank sẽ xuất hiện tại đây sau khi trận kết thúc.
                </p>
              </div>
            </div>
          )}
        </section>
        <section className="arena-leaderboard arena-box min-w-0 space-y-4 rounded-[14px] border bg-card p-6 shadow-panel">
          <div className="arena-sidebar-heading flex flex-wrap items-center justify-between gap-3">
            <span>
              <Icon name="fa-solid fa-trophy" aria-hidden="true" /> TOP RANKED
            </span>
            <a href="#/leaderboard?metric=rank" aria-label="Xem bảng xếp hạng">
              <Icon name="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
            </a>
          </div>
          {!leaders ? (
            <Loading />
          ) : leaders.length ? (
            <ol className="arena-leaders space-y-3">
              {leaders.slice(0, 5).map((p, i) => (
                <li key={p.user_id}>
                  <span
                    className={
                      'arena-place flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-semibold place-' +
                      (i + 1)
                    }
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <RankEmblem rank={p.rank} className="rank-emblem-small" decorative />
                  <div>
                    <b data-user-content>{p.display_name}</b>
                    <small>
                      {p.rank} · Level {p.level}
                    </small>
                  </div>
                  <strong>
                    {p.rating}
                    <small>RANK</small>
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="arena-sidebar-empty rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
              Chưa có trận Ranked được chốt. Đấu trường đang chờ những cái tên đầu tiên.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
