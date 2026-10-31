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
import { t } from '../lib/locale';

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
  const modeStyles = {
    PRACTICE: {
      selected:
        'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/25 ring-1.5 ring-emerald-500/30',
      iconBox: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-600 text-white',
    },
    NORMAL: {
      selected:
        'border-orange-500 bg-orange-50/50 dark:bg-orange-950/25 ring-1.5 ring-orange-500/30',
      iconBox: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
      badge: 'bg-orange-500 text-white',
    },
    RANKED: {
      selected:
        'border-amber-500 bg-amber-50/50 dark:bg-amber-950/25 ring-1.5 ring-amber-500/30',
      iconBox: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500 text-white',
    },
  };
  const style = modeStyles[item.id] || modeStyles.PRACTICE;

  return (
    <Button
      type="button"
      variant="ghost"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'group relative h-auto w-full justify-start gap-3 rounded-xl border p-3 sm:p-3.5 text-left whitespace-normal shadow-2xs transition-all',
        selected
          ? style.selected + ' shadow-xs'
          : 'border-border/70 bg-card hover:bg-muted/40 hover:border-border text-foreground',
      )}
    >
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105',
          style.iconBox,
        )}
      >
        <Icon name={'fa-solid ' + item.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <strong className="block font-heading text-sm sm:text-base font-extrabold text-foreground truncate">
          {item.name}
        </strong>
        <span className="block text-[11px] font-medium text-muted-foreground truncate">
          {item.facts.join(' · ')}
        </span>
      </span>
      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full transition-all',
          selected
            ? style.badge + ' shadow-2xs'
            : 'border-2 border-muted-foreground/30 text-transparent',
        )}
      >
        <Icon name="fa-solid fa-check" className="size-3" />
      </span>
    </Button>
  );
}

function MatchmakingPanel({ mode, queue, waiting, found, waited, busy, user, action }) {
  return (
    <section
      className={cn(
        'matchmaking-panel space-y-3.5 sm:space-y-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 text-center shadow-2xs',
        waiting
          ? 'is-searching border-primary/40 bg-accent/30'
          : found
            ? 'match-found border-gold bg-warning-soft/40'
            : '',
      )}
      aria-label={t('Tìm trận')}
    >
      {found && (
        <div className="flex justify-center">
          <Badge className="text-xs font-bold" tone="warning">
            {t('TRẬN ĐẤU ĐÃ SẴN SÀNG')}
          </Badge>
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-heading text-lg sm:text-xl font-extrabold text-foreground">
          {found
            ? t('Đối thủ đã sẵn sàng!')
            : waiting
              ? t('Đang tìm đối thủ…')
              : mode === 'RANKED'
                ? t('Sẵn sàng leo hạng?')
                : t('Thử sức ngay hôm nay')}
        </h3>
        {(found || waiting) && (
          <p className="text-sm font-bold text-primary">
            {found
              ? `${queue.accepted}/5 ${t('đã xác nhận')}`
              : `${queue.waiting} ${t('người đang chờ')}`}
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
              'flex size-9 sm:size-10 items-center justify-center rounded-xl border transition-all',
              found && i < queue.accepted
                ? 'confirmed border-primary bg-primary/10 text-primary ring-1 ring-primary/20'
                : 'border-border/70 bg-muted/30 text-muted-foreground/60',
            )}
          >
            <Icon
              name={'fa-solid ' + (found && i < queue.accepted ? 'fa-check' : 'fa-user')}
              className="size-3.5"
            />
          </span>
        ))}
      </div>
      {waiting ? (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="queue-elapsed font-mono text-4xl sm:text-5xl font-extrabold tracking-tight text-primary">
            {String(Math.floor(waited / 60)).padStart(2, '0')}
            <span className="text-action mx-0.5 animate-pulse">:</span>
            {String(waited % 60).padStart(2, '0')}
          </div>
          {mode === 'RANKED' && (
            <p className="text-xs font-semibold text-muted-foreground">
              {t('Chênh lệch rating')}: {queue.ratingRange}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => action('MATCH_QUEUE_CANCEL')}
            className="h-9 rounded-xl text-xs font-semibold border-border/80"
          >
            {t('Hủy tìm trận')}
          </Button>
        </div>
      ) : found ? (
        <div className="space-y-3" role="status">
          <div className="[&_.timer]:font-mono [&_.timer]:text-4xl [&_.timer]:font-extrabold [&_.timer]:text-action">
            <TimeLeft deadline={queue.acceptDeadline} />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              disabled={busy || queue.state === 'ACCEPTED'}
              onClick={() => action('MATCH_ACCEPT', { roomId: queue.roomId })}
              className="h-10 rounded-xl px-4 text-xs font-bold gap-1.5 bg-action text-white hover:bg-action-hover shadow-xs"
            >
              <Icon name="fa-solid fa-check" className="size-3.5" />
              <span>
                {queue.state === 'ACCEPTED'
                  ? t('Đã xác nhận · Chờ đủ 5 người')
                  : t('Nhận trận')}
              </span>
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => action('MATCH_DECLINE')}
              className="h-10 rounded-xl px-4 text-xs font-semibold"
            >
              {t('Từ chối')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            className="queue-play w-full h-11 rounded-xl text-sm font-heading font-extrabold gap-2 bg-action text-white hover:bg-action-hover active:bg-action-active shadow-xs transition-all disabled:opacity-50"
            disabled={busy || user.role !== 'CODER'}
            onClick={() => action('MATCH_QUEUE_JOIN', { mode })}
          >
            <Icon name="fa-solid fa-play" className="size-3.5" />
            <span>
              {busy
                ? t('Đang xử lý…')
                : mode === 'RANKED'
                  ? t('Tìm trận Ranked')
                  : t('Tìm trận')}
            </span>
            <Icon name="fa-solid fa-arrow-right" className="size-3.5" />
          </Button>
          {user.role !== 'CODER' && (
            <p className="text-center text-xs text-muted-foreground">
              {t('Tài khoản của bạn là Quản trị viên (chỉ Coder mới có thể tìm trận).')}
            </p>
          )}
        </div>
      )}
      <details className="border-t border-border/50 pt-2.5 text-left text-[10px] text-muted-foreground">
        <summary className="font-semibold cursor-pointer hover:text-foreground transition-colors">
          {t('Quy tắc ghép trận & phần thưởng')}
        </summary>
        <p className="mt-2 leading-relaxed">
          {t(
            'Trận bắt đầu khi cả 5 người xác nhận. EXP theo hạng: 100 / 80 / 60 / 40 / 20. Người đồng hạng nhận EXP theo vị trí thấp nhất của nhóm hòa. Chỉ Ranked thay đổi điểm Rank. Elo Contest được tính riêng.',
          )}
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
          <section className="arena-leaderboard min-w-0 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Icon name="fa-solid fa-trophy" className="size-3.5" />
                </span>
                <h3 className="font-heading text-sm font-extrabold text-foreground">{t('Top Ranked')}</h3>
              </div>
              <a
                href="#/leaderboard?metric=rank"
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors"
              >
                <span>{t('Bảng xếp hạng')}</span>
                <Icon name="fa-solid fa-arrow-right" className="size-2.5" />
              </a>
            </div>
            <ol className="space-y-2">
              {!leaders ? (
                <Loading />
              ) : leaders.length ? (
                leaders.slice(0, 3).map((p, i) => (
                  <li
                    className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-muted/40 border border-border/40 bg-muted/15"
                    key={p.user_id}
                  >
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold',
                        i === 0
                          ? 'bg-amber-100 text-amber-800'
                          : i === 1
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-orange-100 text-orange-800',
                      )}
                    >
                      {i + 1}
                    </span>
                    <RankEmblem rank={p.rank} decorative className="h-8! w-6! shrink-0" />
                    <div className="min-w-0 flex-1">
                      <b className="block text-xs font-bold text-foreground truncate" data-user-content>
                        {p.display_name}
                      </b>
                      <small className="block text-[10px] text-muted-foreground truncate">{p.rank}</small>
                    </div>
                    <b className="font-mono text-xs font-black text-primary tabular-nums">{p.rating}</b>
                  </li>
                ))
              ) : (
                <div className="py-4 text-center">
                  <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground/50 mb-1.5">
                    <Icon name="fa-solid fa-trophy" className="size-4" />
                  </span>
                  <p className="text-xs text-muted-foreground">{t('Chưa có trận Ranked được chốt.')}</p>
                </div>
              )}
            </ol>
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
              className="arena-practice rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4"
              aria-label={t('Thiết lập phòng')}
            >
              <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
                <span className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Icon name="fa-solid fa-plus" className="size-4" />
                </span>
                <div>
                  <h2 className="font-heading text-base font-extrabold text-foreground">{t('Tạo phòng thi đấu')}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t('Tùy chỉnh số lượng người chơi và mức độ khó của đề bài')}
                  </p>
                </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_120px] gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="create-room-name" className="text-xs font-semibold text-foreground">
                      {t('Tên phòng')}
                    </label>
                    <Input
                      id="create-room-name"
                      maxLength={100}
                      value={name}
                      onChange={(e) => N(e.target.value)}
                      placeholder={t('Đặt tên cho đấu trường…')}
                      className="h-10 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="create-room-capacity" className="text-xs font-semibold text-foreground">
                      {t('Số người')}
                    </label>
                    <NativeSelect
                      id="create-room-capacity"
                      value={capacity}
                      onChange={(e) => C(+e.target.value)}
                      className="h-10 rounded-xl text-xs font-semibold"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} {t('người')}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{t('Độ khó đề bài')}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {levels.length} {t('mức đã chọn')}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((d) => {
                      const isChecked = levels.includes(d);
                      return (
                        <button
                          type="button"
                          key={d}
                          disabled={busy || occupied}
                          onClick={() =>
                            L(isChecked ? levels.filter((x) => x !== d) : [...levels, d])
                          }
                          className={cn(
                            'flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer',
                            isChecked
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-500/20 font-extrabold'
                              : 'border-border/70 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                            (busy || occupied) && 'pointer-events-none opacity-50',
                          )}
                        >
                          <Icon
                            name={isChecked ? 'fa-solid fa-check' : 'fa-solid fa-hashtag'}
                            className={cn(
                              'size-3',
                              isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/40',
                            )}
                          />
                          <span>
                            {t('Mức')} {d}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    disabled={busy || occupied || user.role !== 'CODER' || !levels.length}
                    className="w-full h-11 rounded-xl text-sm font-heading font-extrabold gap-2 bg-action text-white hover:bg-action-hover active:bg-action-active shadow-xs transition-all disabled:opacity-50"
                  >
                    <Icon name="fa-solid fa-play" className="size-3.5" />
                    <span>{busy ? t('Đang tạo phòng…') : t('Tạo phòng')}</span>
                    <Icon name="fa-solid fa-arrow-right" className="size-3.5" />
                  </Button>
                  {user.role !== 'CODER' && (
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {t('Tài khoản của bạn là Quản trị viên (chỉ Coder mới có thể tạo phòng thi đấu).')}
                    </p>
                  )}
                </div>
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
            className="order-1 min-w-0 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3"
            aria-label={t('Chọn chế độ Survival')}
          >
            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon name="fa-solid fa-gamepad" className="size-3.5" />
              </span>
              <h2 className="font-heading text-sm font-extrabold text-foreground">{t('Chọn chế độ')}</h2>
            </div>
            <div
              id="survival-modes"
              className="survival-modes grid gap-2.5 sm:grid-cols-3 xl:grid-cols-1"
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
          <section className="arena-join order-4 min-w-0 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Icon name="fa-solid fa-ticket" className="size-3.5" />
              </span>
              <h3 className="font-heading text-sm font-extrabold text-foreground">{t('Có mã mời?')}</h3>
            </div>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                action('ROOM_JOIN', { roomId: code.trim() });
              }}
            >
              <div className="space-y-1.5">
                <label htmlFor="room-code-input" className="text-xs font-semibold text-foreground">
                  {t('Mã phòng')}
                </label>
                <div className="relative">
                  <Input
                    id="room-code-input"
                    value={code}
                    maxLength={36}
                    required
                    autoComplete="off"
                    placeholder="VD: A1B2C3"
                    onChange={(e) => S(e.target.value.toUpperCase())}
                    className="h-10 rounded-xl font-mono text-sm tracking-wider uppercase pl-3 pr-9 border-border/80 focus-visible:border-primary"
                  />
                  <Icon
                    name="fa-solid fa-key"
                    className="absolute right-3 top-3 size-4 text-muted-foreground/40 pointer-events-none"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={busy || occupied || !code.trim()}
                className="w-full h-9 rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs"
              >
                <span>{t('Tham gia phòng')}</span>
                <Icon name="fa-solid fa-arrow-right" className="size-3" />
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
