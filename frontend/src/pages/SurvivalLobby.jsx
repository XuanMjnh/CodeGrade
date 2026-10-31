import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { NativeSelect } from '../components/ui/native-select';
import Icon from '../components/Icon';
import RankEmblem from '../components/RankEmblem';
import { RankTierStrip } from '../components/ProgressionStrip';
import SurvivalPlayerCard from '../components/SurvivalPlayerCard';
import SurvivalModeBanner from '../components/SurvivalModeBanner';
import { GameButton, GameHeading, survivalStates, survivalModes } from '../components/SurvivalKit';
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
      gradient:
        'bg-gradient-to-r from-emerald-500/20 via-teal-500/30 to-emerald-600/25 dark:from-emerald-950/70 dark:via-teal-900/50 dark:to-emerald-950/70',
      selectedGradient:
        'bg-gradient-to-r from-emerald-500/30 via-teal-500/45 to-emerald-600/35 dark:from-emerald-900/80 dark:via-teal-900/70 dark:to-emerald-900/80 ring-2 ring-emerald-600 border-emerald-600 shadow-md',
      borderDefault: 'border-emerald-600/40 hover:border-emerald-600/70',
      glowOrb: 'bg-emerald-500/35 dark:bg-emerald-400/25',
      shimmer: 'via-emerald-300/35 dark:via-emerald-400/25',
      iconBox: 'bg-emerald-600 text-white shadow-xs',
      badge: 'bg-emerald-600 text-white ring-2 ring-emerald-400/40',
      unselectedRadio: 'border-emerald-600/50 bg-white/80 dark:bg-card/80',
      delay: '0s',
    },
    NORMAL: {
      gradient:
        'bg-gradient-to-r from-orange-500/20 via-amber-500/30 to-orange-600/25 dark:from-orange-950/70 dark:via-amber-900/50 dark:to-orange-950/70',
      selectedGradient:
        'bg-gradient-to-r from-orange-500/30 via-amber-500/45 to-orange-600/35 dark:from-orange-900/80 dark:via-amber-900/70 dark:to-orange-900/80 ring-2 ring-orange-500 border-orange-500 shadow-md',
      borderDefault: 'border-orange-500/40 hover:border-orange-500/70',
      glowOrb: 'bg-orange-500/35 dark:bg-orange-400/25',
      shimmer: 'via-orange-300/35 dark:via-orange-400/25',
      iconBox: 'bg-orange-500 text-white shadow-xs',
      badge: 'bg-orange-500 text-white ring-2 ring-orange-400/40',
      unselectedRadio: 'border-orange-500/50 bg-white/80 dark:bg-card/80',
      delay: '1s',
    },
    RANKED: {
      gradient:
        'bg-gradient-to-r from-amber-500/25 via-yellow-500/35 to-amber-600/30 dark:from-amber-950/70 dark:via-yellow-900/50 dark:to-amber-950/70',
      selectedGradient:
        'bg-gradient-to-r from-amber-500/35 via-yellow-500/50 to-amber-600/40 dark:from-amber-900/80 dark:via-yellow-900/70 dark:to-amber-900/80 ring-2 ring-amber-500 border-amber-500 shadow-md',
      borderDefault: 'border-amber-500/40 hover:border-amber-500/70',
      glowOrb: 'bg-amber-400/40 dark:bg-amber-400/30',
      shimmer: 'via-yellow-200/45 dark:via-amber-300/30',
      iconBox: 'bg-amber-500 text-white shadow-xs',
      badge: 'bg-amber-500 text-white ring-2 ring-amber-400/40',
      unselectedRadio: 'border-amber-500/50 bg-white/80 dark:bg-card/80',
      delay: '2s',
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
        'group relative overflow-hidden h-auto w-full items-center justify-start gap-3 rounded-xl border p-3 sm:p-3.5 text-left whitespace-normal shadow-2xs transition-all duration-300 animate-mode-gradient',
        selected
          ? style.selectedGradient
          : cn(style.gradient, style.borderDefault, 'hover:shadow-xs'),
      )}
      style={{ animationDelay: style.delay }}
    >
      {/* Nền động (Luôn chạy động ngay cả khi chưa click) */}
      <div
        className={cn(
          'pointer-events-none absolute -right-3 -top-3 size-24 rounded-full blur-xl animate-mode-glow',
          style.glowOrb,
        )}
        style={{ animationDelay: style.delay }}
        aria-hidden="true"
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent to-transparent animate-mode-shimmer',
          style.shimmer,
        )}
        style={{ animationDelay: style.delay }}
        aria-hidden="true"
      />

      {/* Mode Icon */}
      <span
        className={cn(
          'relative z-10 flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
          style.iconBox,
        )}
      >
        <Icon name={'fa-solid ' + item.icon} className="size-5" />
      </span>

      {/* Mode Title (Bỏ dòng mô tả nhỏ theo yêu cầu người dùng) */}
      <span className="relative z-10 min-w-0 flex-1">
        <strong className="block font-heading text-sm sm:text-base font-extrabold text-foreground truncate">
          {item.name}
        </strong>
      </span>

      {/* Radio check badge */}
      <span
        className={cn(
          'relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full transition-all duration-200',
          selected
            ? style.badge + ' shadow-2xs scale-105'
            : cn('border-2 text-transparent group-hover:scale-105', style.unselectedRadio),
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
                {queue.state === 'ACCEPTED' ? t('Đã xác nhận · Chờ đủ 5 người') : t('Nhận trận')}
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
              {busy ? t('Đang xử lý…') : mode === 'RANKED' ? t('Tìm trận Ranked') : t('Tìm trận')}
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
                <h3 className="font-heading text-sm font-extrabold text-foreground">
                  {t('Top Ranked')}
                </h3>
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
                      <b
                        className="block text-xs font-bold text-foreground truncate"
                        data-user-content
                      >
                        {p.display_name}
                      </b>
                      <small className="block text-[10px] text-muted-foreground truncate">
                        {p.rank}
                      </small>
                    </div>
                    <b className="font-mono text-xs font-black text-primary tabular-nums">
                      {p.rating}
                    </b>
                  </li>
                ))
              ) : (
                <div className="py-4 text-center">
                  <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground/50 mb-1.5">
                    <Icon name="fa-solid fa-trophy" className="size-4" />
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {t('Chưa có trận Ranked được chốt.')}
                  </p>
                </div>
              )}
            </ol>
          </section>
        </aside>
        <div className="order-2 min-w-0 space-y-4">
          <SurvivalModeBanner mode={mode} facts={selected.facts} />
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
                  <h2 className="font-heading text-base font-extrabold text-foreground">
                    {t('Tạo phòng thi đấu')}
                  </h2>
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
                    <label
                      htmlFor="create-room-name"
                      className="text-xs font-semibold text-foreground"
                    >
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
                    <label
                      htmlFor="create-room-capacity"
                      className="text-xs font-semibold text-foreground"
                    >
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
                    <span className="text-xs font-semibold text-foreground">
                      {t('Độ khó đề bài')}
                    </span>
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
                              isChecked
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-muted-foreground/40',
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
                      {t(
                        'Tài khoản của bạn là Quản trị viên (chỉ Coder mới có thể tạo phòng thi đấu).',
                      )}
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
              <h2 className="font-heading text-sm font-extrabold text-foreground">
                {t('Chọn chế độ')}
              </h2>
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
              <h3 className="font-heading text-sm font-extrabold text-foreground">
                {t('Có mã mời?')}
              </h3>
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
      <section className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xs">
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-5"
          role="tablist"
          aria-label={t('Khám phá Survival')}
        >
          <div className="inline-flex items-center gap-1.5 rounded-xl bg-muted/50 p-1 border border-border/40">
            {tabs.map(([key, icon, label]) => {
              const active = tab === key;
              return (
                <button
                  type="button"
                  key={key}
                  id={'survival-tab-' + key}
                  role="tab"
                  aria-selected={active}
                  aria-controls={'survival-panel-' + key}
                  tabIndex={active ? 0 : -1}
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
                  className={cn(
                    'relative inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs sm:text-sm font-heading font-extrabold transition-all cursor-pointer',
                    active
                      ? 'bg-card text-foreground shadow-2xs border border-border/60'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
                  )}
                >
                  <Icon
                    name={'fa-solid ' + icon}
                    className={cn('size-3.5', active ? 'text-primary' : 'text-muted-foreground/70')}
                  />
                  <span>{label}</span>
                  {key === 'rooms' && (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center rounded-full px-2 py-0.5 font-mono text-[11px] font-bold',
                        active
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {rooms?.length ?? '—'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
            {tab === 'rooms' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('Cập nhật trực tiếp')}
              </span>
            ) : (
              <span className="text-[11px] text-muted-foreground">
                {t('Lưu kết quả các trận gần nhất')}
              </span>
            )}
          </div>
        </div>
        <div
          role="tabpanel"
          id={'survival-panel-' + tab}
          aria-labelledby={'survival-tab-' + tab}
          tabIndex={0}
          className="min-w-0 p-4 outline-none sm:p-5"
        >
          {tab === 'rooms' && (
            <div className="arena-room-browser space-y-4">
              {!rooms ? (
                <Loading />
              ) : rooms.length ? (
                <div className="room-grid grid gap-3 lg:grid-cols-2">
                  {rooms.map((r) => (
                    <article
                      key={r.id}
                      className={cn(
                        'room-card group relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs',
                        r.state === 'LOBBY'
                          ? 'border-emerald-600/30 bg-gradient-to-br from-emerald-50/70 via-emerald-50/20 to-teal-50/40 hover:border-emerald-600/60 hover:from-emerald-50/90 hover:to-teal-50/60 dark:from-emerald-950/35 dark:via-card dark:to-teal-950/20 dark:border-emerald-800/50'
                          : ['ROUND_ACTIVE', 'COUNTDOWN'].includes(r.state)
                            ? 'border-amber-500/30 bg-gradient-to-br from-amber-50/60 via-amber-50/15 to-orange-50/30 hover:border-amber-500/60 hover:from-amber-50/80 hover:to-orange-50/50 dark:from-amber-950/35 dark:via-card dark:to-orange-950/20 dark:border-amber-800/50'
                            : ['ROUND_GRADING', 'ROUND_RESULT'].includes(r.state)
                              ? 'border-blue-500/30 bg-gradient-to-br from-blue-50/60 via-blue-50/15 to-sky-50/30 hover:border-blue-500/60 hover:from-blue-50/80 hover:to-sky-50/50 dark:from-blue-950/35 dark:via-card dark:to-sky-950/20 dark:border-blue-800/50'
                              : 'border-border/80 bg-gradient-to-br from-slate-50/80 via-card to-slate-50/40 hover:border-border dark:from-slate-900/30 dark:via-card dark:to-slate-900/20',
                        (busy || occupied) && 'opacity-60 cursor-not-allowed pointer-events-none',
                      )}
                      onClick={() => !busy && !occupied && action('ROOM_JOIN', { roomId: r.id })}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!busy && !occupied) action('ROOM_JOIN', { roomId: r.id });
                        }
                      }}
                    >
                      <div>
                        {/* Hàng 1: Tiêu đề bên trái, Trạng thái & Mã phòng bên phải */}
                        <div className="room-card-header flex items-center justify-between gap-2">
                          <h3
                            className="room-card-title font-heading text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1"
                            data-user-content
                            title={r.name}
                          >
                            {r.name}
                          </h3>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight',
                                r.state === 'LOBBY' &&
                                  'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
                                ['ROUND_ACTIVE', 'COUNTDOWN'].includes(r.state) &&
                                  'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
                                ['ROUND_GRADING', 'ROUND_RESULT'].includes(r.state) &&
                                  'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
                                ['FINISHED', 'CLOSED'].includes(r.state) &&
                                  'bg-muted/70 text-muted-foreground border border-border/60',
                              )}
                            >
                              {r.state === 'LOBBY' && (
                                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              )}
                              {survivalStates[r.state] || r.state}
                            </span>
                            <span
                              className="room-code-tag inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-mono font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-2xs"
                              title={`${t('Mã phòng')}: ${r.code}`}
                            >
                              <Icon
                                name="fa-solid fa-key"
                                className="size-2.5 text-amber-600 dark:text-amber-400"
                                aria-hidden="true"
                              />
                              <span>Mã {r.code}</span>
                            </span>
                          </div>
                        </div>

                        {/* Hàng 2: Thông tin Host & metadata xếp gọn gàng trên 1 dòng với dấu chấm ngăn cách */}
                        <div className="room-card-meta mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <Icon
                              name="fa-solid fa-user"
                              className="size-3 text-emerald-600 dark:text-emerald-400"
                              aria-hidden="true"
                            />
                            <span>{r.hostName}</span>
                          </span>
                          <span className="text-muted-foreground/30" aria-hidden="true">
                            •
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <Icon
                              name="fa-solid fa-users"
                              className="size-3 text-blue-600 dark:text-blue-400"
                              aria-hidden="true"
                            />
                            <span>
                              <b className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                                {r.count}
                              </b>
                              <span className="text-muted-foreground font-mono">
                                /{r.capacity} Coder
                              </span>
                            </span>
                          </span>
                          {r.selectedDifficulties?.length ? (
                            <>
                              <span className="text-muted-foreground/30" aria-hidden="true">
                                •
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                <Icon
                                  name="fa-solid fa-layer-group"
                                  className="size-3 text-orange-500 dark:text-orange-400"
                                  aria-hidden="true"
                                />
                                <span>
                                  {t('Mức')}{' '}
                                  <b className="font-mono font-bold text-orange-600 dark:text-orange-400">
                                    {r.selectedDifficulties.join(', ')}
                                  </b>
                                </span>
                              </span>
                            </>
                          ) : null}
                          <span className="text-muted-foreground/30" aria-hidden="true">
                            •
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <Icon
                              name="fa-solid fa-gamepad"
                              className="size-3 text-purple-600 dark:text-purple-400"
                              aria-hidden="true"
                            />
                            <span>{t('Giao lưu')}</span>
                          </span>
                        </div>
                      </div>

                      {/* Hàng 3: Chân thẻ với Thông tin sẵn sàng bên trái & Tham gia phòng → bên phải */}
                      <div className="room-card-footer mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                        {r.state === 'LOBBY' ? (
                          <div className="room-card-status inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            <Icon
                              name="fa-solid fa-circle-check"
                              className="size-3.5 text-emerald-600 dark:text-emerald-400"
                              aria-hidden="true"
                            />
                            <span className="clock-label font-sans text-[11px] text-muted-foreground font-normal">
                              {t('Trạng thái')}:
                            </span>
                            <span className="font-bold">
                              {r.capacity - r.count > 0
                                ? `${t('Còn')} ${r.capacity - r.count} ${t('chỗ')}`
                                : t('Đã đủ người')}
                            </span>
                          </div>
                        ) : (
                          <div className="room-card-status inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                            <Icon
                              name="fa-solid fa-flag-checkered"
                              className="size-3.5 text-amber-600 dark:text-amber-400"
                              aria-hidden="true"
                            />
                            <span className="font-semibold">
                              {survivalStates[r.state] || r.state}
                            </span>
                          </div>
                        )}

                        <span className="inline-flex items-center gap-1 font-bold text-action transition-all group-hover:text-action-hover">
                          <span>{t('Tham gia phòng')}</span>
                          <Icon
                            name="fa-solid fa-arrow-right"
                            className="size-3 text-action group-hover:translate-x-1 transition-transform"
                          />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3.5 shadow-2xs">
                    <Icon name="fa-solid fa-door-open" className="size-6" />
                  </div>
                  <h3 className="font-heading text-base font-extrabold text-foreground">
                    {t('Chưa có phòng nào đang mở')}
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                    {t(
                      'Hãy tạo phòng mới hoặc chuyển sang chế độ Ghép trận để bắt đầu thi đấu ngay.',
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
          {tab === 'history' && (
            <div className="arena-match-history space-y-4">
              {!history ? (
                <Loading />
              ) : history.length ? (
                <div className="history-grid grid gap-3 lg:grid-cols-2">
                  {history.map((h) => (
                    <article
                      key={h.room_id}
                      className="history-card group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3.5 sm:px-4 sm:py-3.5 text-left transition-all duration-150 hover:border-border hover:shadow-subtle cursor-pointer"
                      onClick={() => go('/room/' + h.room_id)}
                      tabIndex={0}
                      role="button"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          go('/room/' + h.room_id);
                        }
                      }}
                    >
                      <div>
                        {/* Hàng 1: Chế độ bên trái, Thứ hạng bên phải */}
                        <div className="history-card-header flex items-center justify-between gap-2">
                          <h3 className="history-card-title font-heading text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1">
                            {survivalModes[h.mode] || h.mode}
                          </h3>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight',
                                h.placement === 1
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                                  : 'bg-muted/70 text-muted-foreground border border-border/60',
                              )}
                            >
                              {h.placement === 1 ? '🏆 Hạng #1' : `Hạng #${h.placement}`}
                            </span>
                            <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60">
                              +{h.exp} EXP
                            </span>
                          </div>
                        </div>

                        {/* Hàng 2: Metadata */}
                        <div className="history-card-meta mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <Icon
                              name="fa-solid fa-gamepad"
                              className="size-3 text-purple-600 dark:text-purple-400"
                              aria-hidden="true"
                            />
                            <span>Code Survival</span>
                          </span>
                          {h.mode === 'RANKED' && (
                            <>
                              <span className="text-muted-foreground/30" aria-hidden="true">
                                •
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-mono font-medium text-foreground">
                                <Icon
                                  name="fa-solid fa-trophy"
                                  className="size-3 text-amber-500 dark:text-amber-400"
                                  aria-hidden="true"
                                />
                                <span>
                                  Rating:{' '}
                                  <b className="text-amber-700 dark:text-amber-400">
                                    {h.rating_before} → {h.rating_after}
                                  </b>
                                </span>
                              </span>
                            </>
                          )}
                          <span className="text-muted-foreground/30" aria-hidden="true">
                            •
                          </span>
                          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                            <Icon
                              name="fa-solid fa-award"
                              className="size-3 text-blue-600 dark:text-blue-400"
                              aria-hidden="true"
                            />
                            <span>
                              Vị trí{' '}
                              <b className="font-mono text-blue-600 dark:text-blue-400">
                                #{h.placement}
                              </b>
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Hàng 3: Chân thẻ */}
                      <div className="history-card-footer mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <Icon
                            name="fa-solid fa-flag-checkered"
                            className="size-3 text-emerald-600 dark:text-emerald-400"
                            aria-hidden="true"
                          />
                          <span>{t('Đã kết thúc')}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 font-bold text-action transition-all group-hover:text-action-hover">
                          <span>{t('Xem chi tiết')}</span>
                          <Icon
                            name="fa-solid fa-arrow-right"
                            className="size-3 text-action group-hover:translate-x-1 transition-transform"
                          />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground/60 mb-3.5">
                    <Icon name="fa-solid fa-clock-rotate-left" className="size-6" />
                  </div>
                  <h3 className="font-heading text-base font-extrabold text-foreground">
                    {t('Chưa có lịch sử thi đấu')}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('Tham gia các trận đấu để lưu lại thành tích của bạn tại đây.')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
