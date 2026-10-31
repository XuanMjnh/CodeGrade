import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NativeSelect } from '../components/ui/native-select';
import Icon from '../components/Icon';
import RankEmblem from '../components/RankEmblem';
import { RankTierStrip } from '../components/ProgressionStrip';
import SurvivalPlayerCard from '../components/SurvivalPlayerCard';
import {
  ArenaScene,
  GameButton,
  GameHeading,
  survivalStates,
  survivalModes,
} from '../components/SurvivalKit';
import { Badge, ErrorBox, Loading, TimeLeft, go, useResource } from '../components/ui';
import { cn } from '../lib/utils';
import { live } from '../lib/live';

const MODES = [
  {
    id: 'PRACTICE',
    name: 'Giao lưu',
    icon: 'fa-terminal',
    facts: ['2–10 Coder', 'Tùy chọn', 'Không Rank'],
  },
  {
    id: 'NORMAL',
    name: 'Đấu thường',
    icon: 'fa-bolt',
    facts: ['5 Coder', 'Ghép tự động', 'EXP'],
  },
  {
    id: 'RANKED',
    name: 'Đấu Rank',
    icon: 'fa-trophy',
    facts: ['5 Coder', 'Theo rating', 'EXP + Rank'],
  },
];

function ModeCard({ item, index, selected, disabled, onSelect }) {
  return (
    <Button
      type="button"
      variant="outline"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'mode-card relative h-auto w-full justify-start gap-3 overflow-hidden rounded-xl border p-4 text-left whitespace-normal shadow-none',
        'mode-' + item.id.toLowerCase(),
        selected
          ? 'selected border-primary bg-accent ring-1 ring-primary'
          : 'border-border bg-card hover:border-primary/50',
      )}
    >
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl border-b-[3px]',
          item.id === 'PRACTICE'
            ? 'border-primary/20 bg-success-soft text-primary'
            : item.id === 'NORMAL'
              ? 'border-action/20 bg-action-soft text-action'
              : 'border-gold bg-warning-soft text-warning',
        )}
      >
        <Icon name={'fa-solid ' + item.icon} className="size-5!" />
      </span>
      <span className="min-w-0 flex-1">
        <strong className="block font-heading text-xl font-extrabold">{item.name}</strong>
      </span>
      <span
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[9px]',
          selected ? 'border-primary bg-primary text-white' : 'text-muted-foreground',
        )}
      >
        {selected ? <Icon name="fa-solid fa-check" className="size-3!" /> : index + 1}
      </span>
    </Button>
  );
}

function MatchmakingPanel({ mode, queue, waiting, found, waited, busy, user, action }) {
  return (
    <section
      className={cn(
        'matchmaking-panel space-y-5 rounded-2xl border p-5 text-center sm:p-6',
        waiting
          ? 'is-searching border-primary/40 bg-accent/40'
          : found
            ? 'match-found border-gold bg-warning-soft/50'
            : 'border-border bg-card',
      )}
      aria-label="Tìm trận"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge className="text-sm" tone={found ? 'warning' : 'success'}>
          {found ? 'TRẬN ĐẤU ĐÃ SẴN SÀNG' : 'MỤC TIÊU 5 CODER'}
        </Badge>
      </div>
      <div>
        <h3 className="font-heading text-2xl font-extrabold sm:text-3xl">
          {found
            ? 'Đối thủ đã sẵn sàng!'
            : waiting
              ? 'Đang tìm đối thủ'
              : mode === 'RANKED'
                ? 'Sẵn sàng leo hạng?'
                : 'Thử sức ngay hôm nay'}
        </h3>
        {(found || waiting) && (
          <p className="mt-3 text-lg font-bold text-primary">
            {found ? `${queue.accepted}/5 đã xác nhận` : `${queue.waiting} người đang chờ`}
          </p>
        )}
      </div>
      <div
        className={cn(
          'flex items-center justify-center gap-2',
          found ? 'accept-slots' : 'queue-squad',
        )}
        aria-label={found ? queue.accepted + ' trên 5 người đã xác nhận' : 'Đội hình 5 Coder'}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={cn(
              'flex h-12 w-10 items-center justify-center rounded-xl border border-b-[3px] bg-card text-muted-foreground sm:h-14 sm:w-12',
              found && i < queue.accepted && 'confirmed border-primary/40 bg-accent text-primary',
            )}
          >
            <Icon
              name={'fa-solid ' + (found && i < queue.accepted ? 'fa-check' : 'fa-user')}
              className="size-5!"
            />
          </span>
        ))}
      </div>
      {waiting ? (
        <div className="space-y-4" role="status" aria-live="polite">
          <div className="queue-elapsed font-mono text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
            {String(Math.floor(waited / 60)).padStart(2, '0')}
            <span className="text-action">:</span>
            {String(waited % 60).padStart(2, '0')}
          </div>
          {mode === 'RANKED' && (
            <p className="text-sm font-semibold text-foreground">
              Chênh lệch rating: {queue.ratingRange}
            </p>
          )}
          <Button variant="outline" disabled={busy} onClick={() => action('MATCH_QUEUE_CANCEL')}>
            Hủy tìm trận
          </Button>
        </div>
      ) : found ? (
        <div className="space-y-4" role="status">
          <div className="[&_.timer]:font-mono [&_.timer]:text-5xl [&_.timer]:font-extrabold [&_.timer]:text-action">
            <TimeLeft deadline={queue.acceptDeadline} />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <GameButton
              disabled={busy || queue.state === 'ACCEPTED'}
              onClick={() => action('MATCH_ACCEPT', { roomId: queue.roomId })}
            >
              <Icon name="fa-solid fa-check" />
              {queue.state === 'ACCEPTED' ? 'Đã xác nhận · Chờ đủ 5 người' : 'Nhận trận'}
            </GameButton>
            <Button variant="outline" disabled={busy} onClick={() => action('MATCH_DECLINE')}>
              Từ chối
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <GameButton
            className="queue-play w-full"
            disabled={busy || user.role !== 'CODER'}
            onClick={() => action('MATCH_QUEUE_JOIN', { mode })}
          >
            <Icon name="fa-solid fa-play" />
            {busy ? 'Đang xử lý…' : mode === 'RANKED' ? 'Tìm trận Ranked' : 'Tìm trận'}
            <Icon name="fa-solid fa-arrow-right" />
          </GameButton>
        </div>
      )}
      <details className="border-t pt-4 text-left text-[10px] text-muted-foreground">
        <summary className="font-semibold">Quy tắc ghép trận & phần thưởng</summary>
        <p className="mt-3 leading-relaxed">
          Trận bắt đầu khi cả 5 người xác nhận. EXP theo hạng: 100 / 80 / 60 / 40 / 20. Người đồng
          hạng nhận EXP theo vị trí thấp nhất của nhóm hòa. Chỉ Ranked thay đổi điểm Rank. Elo
          Contest được tính riêng.
        </p>
      </details>
    </section>
  );
}

export default function SurvivalLobby({ user, revision }) {
  const [rooms, roomError] = useResource('ROOM_LIST', {}, revision);
  const [stats, statsError] = useResource('PROGRESSION_GET', {}, revision);
  const [leaders, leaderError] = useResource('RANKED_LEADERBOARD', {}, revision);
  const [history, historyError] = useResource('MATCH_HISTORY', {}, revision);
  const [mode, M] = useState('PRACTICE'),
    [queue, Q] = useState(null),
    [error, E] = useState(null),
    [busy, B] = useState(false);
  const [name, N] = useState(''),
    [capacity, C] = useState(5),
    [levels, L] = useState([1, 2, 3]),
    [code, S] = useState(''),
    [clock, T] = useState(Date.now()),
    [tab, setTab] = useState('rooms');
  useEffect(() => {
    if (user.role !== 'CODER') return;
    let active = true;
    const refresh = () =>
      live
        .call('MATCH_QUEUE_STATUS')
        .then((q) => {
          if (!active) return;
          Q(q);
          if (q.mode && ['WAITING', 'MATCH_FOUND', 'ACCEPTED', 'STARTED'].includes(q.state))
            M(q.mode);
          if (q.state === 'STARTED') go('/room/' + q.roomId);
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
  async function action(type, payload = {}) {
    B(true);
    E(null);
    try {
      const result = await live.call(type, payload);
      if (type === 'ROOM_CREATE' || type === 'ROOM_JOIN') {
        go('/room/' + result.id);
        return;
      }
      Q(result);
      if (result.state === 'STARTED') go('/room/' + result.roomId);
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
  const selected = MODES.find((item) => item.id === mode);
  const tabs = [
    ['rooms', 'fa-door-open', 'Phòng đang mở'],
    ['history', 'fa-clock-rotate-left', 'Lịch sử chiến đấu'],
  ];
  return (
    <div className="arena-lobby min-w-0 space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl border-b-4 border-primary/20 bg-accent text-primary">
            <Icon name="fa-solid fa-gamepad" className="size-6!" />
          </span>
          <div>
            <h1 className="font-heading text-3xl font-black tracking-tight sm:text-4xl">
              CODE <span className="text-action">SURVIVAL</span>
              <span className="text-gold">.</span>
            </h1>
          </div>
        </div>
      </header>
      {stats ? <RankTierStrip stats={stats} /> : <Loading />}
      <ErrorBox error={error || roomError || statsError || leaderError || historyError} />
      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[230px_minmax(0,1fr)_270px]">
        <aside className="order-3 min-w-0 space-y-4 xl:order-1 xl:sticky xl:top-24">
          <SurvivalPlayerCard stats={stats} user={user} />
          <section className="arena-leaderboard min-w-0 rounded-2xl border bg-card p-4">
            <GameHeading icon="fa-trophy" title="Top Ranked" />
            <ol className="mt-4 space-y-3">
              {!leaders ? (
                <Loading />
              ) : (
                leaders.slice(0, 3).map((p, i) => (
                  <li className="flex items-center gap-2.5" key={p.user_id}>
                    <span className="font-mono text-[10px] text-muted-foreground">0{i + 1}</span>
                    <RankEmblem rank={p.rank} decorative className="h-9! w-7!" />
                    <div className="min-w-0 flex-1">
                      <b className="block text-sm font-extrabold wrap-anywhere" data-user-content>
                        {p.display_name}
                      </b>
                      <small className="text-xs text-muted-foreground">{p.rank}</small>
                    </div>
                    <b className="font-mono text-sm font-extrabold text-primary">{p.rating}</b>
                  </li>
                ))
              )}
              {leaders?.length === 0 && (
                <li className="text-xs leading-relaxed text-muted-foreground">
                  Chưa có trận Ranked được chốt.
                </li>
              )}
            </ol>
            <a
              href="#/leaderboard?metric=rank"
              className="mt-4 flex items-center justify-between border-t pt-3 text-[10px] font-semibold text-primary"
            >
              Bảng xếp hạng
              <Icon name="fa-solid fa-arrow-right" className="size-3!" />
            </a>
          </section>
        </aside>
        <div className="order-2 min-w-0 space-y-4">
          <section
            className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            aria-label="Đấu trường đã chọn"
          >
            <ArenaScene mode={mode}>
              <div className="relative mt-2">
                <h2 className="mt-4 font-heading text-4xl font-black tracking-tight sm:text-5xl">
                  {selected.name}
                </h2>
              </div>
            </ArenaScene>
            <div className="grid grid-cols-3 divide-x border-t bg-muted/40">
              {selected.facts.map((fact, i) => (
                <span
                  className="flex items-center justify-center gap-2 px-2 py-4 text-center text-xs font-bold text-foreground sm:text-sm"
                  key={fact}
                >
                  <Icon
                    name={'fa-solid ' + ['fa-users', 'fa-crosshairs', 'fa-medal'][i]}
                    className="hidden size-3.5! text-primary sm:block"
                  />
                  {fact}
                </span>
              ))}
            </div>
          </section>
          {mode === 'PRACTICE' ? (
            <section
              className="arena-practice rounded-2xl border bg-card p-5"
              aria-label="Thiết lập phòng"
            >
              <div className="mb-5">
                <GameHeading icon="fa-terminal" title="Tạo phòng" />
              </div>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  action('ROOM_CREATE', {
                    mode: 'PRACTICE',
                    ...(name.trim() ? { name: name.trim() } : {}),
                    capacity,
                    selectedDifficulties: levels,
                  });
                }}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_85px] gap-3">
                  <Label className="grid gap-2 text-sm">
                    Tên phòng
                    <Input
                      maxLength={100}
                      value={name}
                      onChange={(e) => N(e.target.value)}
                      placeholder="Đặt tên cho đấu trường"
                    />
                  </Label>
                  <Label className="grid gap-2 text-sm">
                    Số người
                    <NativeSelect value={capacity} onChange={(e) => C(+e.target.value)}>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n}>{n}</option>
                      ))}
                    </NativeSelect>
                  </Label>
                </div>
                <fieldset disabled={busy || occupied}>
                  <legend className="mb-2 text-sm font-semibold">Độ khó đề bài</legend>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((d) => (
                      <label
                        className="flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border bg-card font-mono text-xs has-checked:border-primary has-checked:bg-accent has-checked:text-primary"
                        key={d}
                      >
                        <input
                          type="checkbox"
                          className="size-3 accent-primary"
                          aria-label={'Mức ' + d}
                          checked={levels.includes(d)}
                          onChange={(e) =>
                            L(e.target.checked ? [...levels, d] : levels.filter((x) => x !== d))
                          }
                        />
                        <span>{d}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <GameButton
                  className="w-full"
                  disabled={busy || occupied || user.role !== 'CODER' || !levels.length}
                >
                  <Icon name="fa-solid fa-play" />
                  {busy ? 'Đang tạo phòng…' : 'Tạo phòng'}
                  <Icon name="fa-solid fa-arrow-right" />
                </GameButton>
              </form>
            </section>
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
        </div>
        <aside className="contents xl:order-3 xl:sticky xl:top-24 xl:block xl:min-w-0 xl:space-y-4">
          <section
            className="order-1 min-w-0 rounded-2xl border bg-card p-4"
            aria-label="Chọn chế độ Survival"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold">Chọn chế độ</h2>
            </div>
            <div
              id="survival-modes"
              className="survival-modes grid gap-3 sm:grid-cols-3 xl:grid-cols-1"
            >
              {MODES.map((item, index) => (
                <ModeCard
                  key={item.id}
                  item={item}
                  index={index}
                  selected={mode === item.id}
                  disabled={busy || (occupied && mode !== item.id)}
                  onSelect={() => M(item.id)}
                />
              ))}
            </div>
          </section>
          <section className="arena-join order-4 min-w-0 rounded-2xl border bg-card p-4">
            <GameHeading icon="fa-ticket" title="Có mã mời?" />
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                action('ROOM_JOIN', { roomId: code.trim() });
              }}
            >
              <Label className="grid gap-2 text-sm">
                Mã phòng
                <Input
                  value={code}
                  maxLength={36}
                  required
                  autoComplete="off"
                  placeholder="A1B2C3"
                  onChange={(e) => S(e.target.value)}
                  className="font-mono tracking-widest"
                />
              </Label>
              <Button
                variant="outline"
                className="w-full"
                disabled={busy || occupied || !code.trim()}
              >
                Tham gia phòng
                <Icon name="fa-solid fa-arrow-right" />
              </Button>
            </form>
          </section>
          <details className="order-5 min-w-0 rounded-2xl border bg-card p-4 text-[11px]">
            <summary className="font-semibold">Luật chơi nhanh</summary>
            <ol className="mt-4 space-y-3 leading-relaxed text-muted-foreground">
              <li>
                <b className="text-primary">01.</b> Giải đề trong thời gian giới hạn. Tối đa 2 lượt
                nộp mỗi vòng.
              </li>
              <li>
                <b className="text-primary">02.</b> Vượt qua các vòng loại để đến chung kết.
              </li>
              <li>
                <b className="text-primary">03.</b> Trụ lại cuối cùng và giành chiến thắng.
              </li>
            </ol>
          </details>
        </aside>
      </div>
      <section className="min-w-0 overflow-hidden rounded-2xl border bg-card">
        <div
          className="flex overflow-x-auto border-b bg-muted/30 p-2"
          role="tablist"
          aria-label="Khám phá Survival"
        >
          {tabs.map(([key, icon, label]) => (
            <Button
              key={key}
              id={'survival-tab-' + key}
              role="tab"
              aria-selected={tab === key}
              aria-controls={'survival-panel-' + key}
              tabIndex={tab === key ? 0 : -1}
              onClick={() => setTab(key)}
              onKeyDown={(e) => {
                const i = tabs.findIndex((t) => t[0] === key);
                const next =
                  e.key === 'ArrowRight'
                    ? (i + 1) % tabs.length
                    : e.key === 'ArrowLeft'
                      ? (i + tabs.length - 1) % tabs.length
                      : e.key === 'Home'
                        ? 0
                        : e.key === 'End'
                          ? tabs.length - 1
                          : null;
                if (next !== null) {
                  e.preventDefault();
                  setTab(tabs[next][0]);
                  document.getElementById('survival-tab-' + tabs[next][0])?.focus();
                }
              }}
              variant="ghost"
              className={cn(
                'h-11 shrink-0 rounded-lg px-4 text-sm font-bold',
                tab === key ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground',
              )}
            >
              <Icon name={'fa-solid ' + icon} className="size-3.5!" />
              {label}
              {key === 'rooms' && (
                <span className="rounded bg-accent px-2 py-0.5 font-mono text-sm font-bold text-primary">
                  {rooms?.length ?? '—'}
                </span>
              )}
            </Button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={'survival-panel-' + tab}
          aria-labelledby={'survival-tab-' + tab}
          tabIndex={0}
          className="min-w-0 p-4 outline-none sm:p-5"
        >
          {tab === 'rooms' && (
            <div className="arena-room-browser">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-extrabold">Phòng đang mở</h2>
              </div>
              {!rooms ? (
                <Loading />
              ) : rooms.length ? (
                <div className="room-grid grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {rooms.map((r) => (
                    <Button
                      variant="outline"
                      key={r.id}
                      className="room-card h-auto min-w-0 flex-col items-stretch gap-3 rounded-xl border-border p-4 text-left whitespace-normal hover:border-primary"
                      disabled={busy || occupied}
                      onClick={() => action('ROOM_JOIN', { roomId: r.id })}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Badge tone={r.state === 'LOBBY' ? 'success' : ''}>
                          {survivalStates[r.state] || r.state}
                        </Badge>
                        <span className="flex items-center gap-1.5 font-mono text-lg font-extrabold text-primary">
                          <Icon name="fa-solid fa-users" className="size-3.5!" />
                          {r.count}/{r.capacity}
                        </span>
                      </div>
                      <div>
                        <h3 className="truncate text-xl font-extrabold" data-user-content>
                          {r.name}
                        </h3>
                        <p
                          className="mt-1.5 text-xs font-normal text-muted-foreground"
                          data-user-content
                        >
                          {r.hostName} · Mã {r.code}
                        </p>
                      </div>
                      <span className="flex items-center justify-between border-t pt-3 text-sm font-bold text-action">
                        Tham gia / xem
                        <Icon name="fa-solid fa-arrow-right" className="size-3.5!" />
                      </span>
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed bg-muted/30 px-5 py-10 text-center">
                  <Icon
                    name="fa-solid fa-door-open"
                    className="mx-auto mb-3 size-7! text-primary"
                  />
                  <h3 className="text-xl">Chưa có phòng đang mở</h3>
                </div>
              )}
            </div>
          )}
          {tab === 'history' && (
            <div className="arena-match-history">
              <h2 className="mb-4 text-xl font-extrabold">Lịch sử chiến đấu</h2>
              {!history ? (
                <Loading />
              ) : history.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {history.map((h) => (
                    <a
                      key={h.room_id}
                      href={'#/room/' + h.room_id}
                      className="flex min-w-0 items-center gap-4 rounded-xl border p-4 transition-colors hover:border-primary hover:bg-accent/40"
                    >
                      <span
                        className={cn(
                          'grid size-14 shrink-0 place-items-center rounded-xl border-b-[3px] font-mono text-2xl font-extrabold',
                          h.placement === 1
                            ? 'border-gold bg-warning-soft text-warning'
                            : 'border-border bg-muted text-muted-foreground',
                        )}
                      >
                        #{h.placement}
                      </span>
                      <div className="min-w-0 flex-1">
                        <b className="block text-xl">{survivalModes[h.mode] || h.mode}</b>
                        <span className="mt-1 block font-mono text-base font-extrabold text-primary">
                          +{h.exp} EXP
                          {h.mode === 'RANKED' ? ` · ${h.rating_before} → ${h.rating_after}` : ''}
                        </span>
                      </div>
                      <Icon
                        name="fa-solid fa-arrow-right"
                        className="size-4! text-muted-foreground"
                      />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-xs text-muted-foreground">Chưa có trận đấu.</p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
