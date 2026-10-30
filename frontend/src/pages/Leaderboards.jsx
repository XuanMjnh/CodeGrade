import Icon from '../components/Icon';
import { Button as UiButton } from '../components/ui/button';
import { DataTable as UiTable } from '../components/DataTable';
import {
  TableBody as UiTableBody,
  TableCell as UiTableCell,
  TableHead as UiTableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from '../components/ui/table';
import React, { useState, useRef } from 'react';
import { cn } from '../lib/utils';
import { t as trUI } from '../lib/locale';
import { Heading, ErrorBox, Loading, useResource } from '../components/ui';
import RankEmblem from '../components/RankEmblem';
const METRICS = [
  {
    id: 'elo',
    field: 'elo',
    label: 'Elo Contest',
    icon: 'fa-flag-checkered',
    iconColor: 'text-orange-500',
    columns: ['elo', 'ac'],
    note: 'Elo chỉ thay đổi từ kết quả Contest có tính điểm.',
  },
  {
    id: 'ac',
    field: 'ac',
    label: 'Số bài AC',
    icon: 'fa-code',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    columns: ['ac', 'exp', 'rank'],
    note: 'Xếp hạng theo tổng số bài đã giải AC.',
  },
  {
    id: 'exp',
    field: 'exp',
    label: 'EXP',
    icon: 'fa-star',
    iconColor: 'text-amber-500',
    columns: ['exp', 'rank', 'normal_games', 'ranked_games'],
    note: 'EXP tích lũy từ các hoạt động được hệ thống ghi nhận.',
  },
  {
    id: 'rank',
    field: 'rank',
    label: 'Mức Rank',
    icon: 'fa-shield-halved',
    iconColor: 'text-emerald-700 dark:text-emerald-400',
    columns: ['rank', 'rating', 'exp', 'ranked_games'],
    note: 'Xếp theo điểm Rank Survival, từ cao xuống thấp. Điểm Rank độc lập với Elo Contest.',
  },
  {
    id: 'normal_games',
    field: 'normal_games',
    label: 'Số trận thường',
    icon: 'fa-bolt',
    iconColor: 'text-amber-500',
    columns: ['normal_games', 'exp', 'rank'],
    note: 'Chỉ đếm trận đấu thường đã kết thúc có kết quả chính thức; không tính phòng giao lưu hoặc trận bị hủy.',
  },
  {
    id: 'ranked_games',
    field: 'ranked_games',
    label: 'Số trận Rank',
    icon: 'fa-trophy',
    iconColor: 'text-orange-600 dark:text-orange-400',
    columns: ['ranked_games', 'rank', 'rating', 'exp'],
    note: 'Chỉ đếm trận Rank đã kết thúc có kết quả chính thức; không tính trận bị hủy.',
  },
];
const LABELS = {
  elo: 'Elo Contest',
  ac: 'Bài AC',
  exp: 'EXP',
  rank: 'Mức Rank',
  rating: 'Điểm Rank',
  normal_games: 'Trận thường',
  ranked_games: 'Trận Rank',
};
function BoardValue({ coder, field }) {
  if (field === 'rank') {
    return (
      <span className="rank-inline">
        <RankEmblem rank={coder.rank} className="rank-emblem-small" decorative />
        <span>{trUI(coder.rank)}</span>
      </span>
    );
  }
  return Number(coder[field] ?? 0).toLocaleString(
    document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN',
  );
}
export default function Leaderboard({ revision, user }) {
  const [metric, setMetric] = useState(() => {
    const requested = new URLSearchParams(location.hash.split('?')[1] || '').get('metric');
    return METRICS.some((item) => item.id === requested) ? requested : 'elo';
  });
  return (
    <LeaderboardView
      key={metric}
      metric={metric}
      setMetric={setMetric}
      revision={revision}
      user={user}
    />
  );
}
function LeaderboardView({ metric, setMetric, revision, user }) {
  const config = METRICS.find((item) => item.id === metric) || METRICS[0];
  const [data, error] = useResource(
    'LEADERBOARD',
    {
      metric,
    },
    revision,
  );
  const myRowRef = useRef(null);
  const mine = data?.findIndex((coder) => coder.id === user?.id) ?? -1;
  const own = mine >= 0 ? data[mine] : null;
  const scrollToMyRank = () => {
    myRowRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Podium slots: Rank 2 (Left) - Rank 1 (Center, highest) - Rank 3 (Right)
  const podiumSlots = [
    {
      place: 2,
      index: 1,
      label: 'Á quân',
      medalIcon: 'fa-medal',
      tone: 'silver',
    },
    {
      place: 1,
      index: 0,
      label: 'Quán quân',
      medalIcon: 'fa-trophy',
      tone: 'gold',
    },
    {
      place: 3,
      index: 2,
      label: 'Hạng ba',
      medalIcon: 'fa-award',
      tone: 'bronze',
    },
  ];
  return (
    <div className="leaderboard-page min-w-0 space-y-5">
      <h1 className="sr-only">{trUI('Những người dẫn đầu')}</h1>

      {/* FILTER & CRITERIA CONTROL BOX */}
      <section
        className="lb-control-card space-y-3 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs"
        aria-label={trUI('Tiêu chí xếp hạng')}
      >
        <div className="lb-control-header flex items-center justify-between">
          <span className="lb-control-title flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Icon
              name="fa-solid fa-layer-group"
              className="size-3.5 text-primary"
              aria-hidden="true"
            />
            <span>{trUI('Tiêu chí xếp hạng')}</span>
          </span>
        </div>

        <div
          className="lb-metric-buttons flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1 border border-border/50"
          role="tablist"
        >
          {METRICS.map((item) => {
            const isActive = metric === item.id;
            return (
              <UiButton
                key={item.id}
                role="tab"
                type="button"
                className={cn(
                  'lb-metric-btn h-8 justify-center gap-2 rounded-lg border-0 px-3 text-xs font-semibold transition-all shadow-none',
                  isActive
                    ? 'active bg-card text-foreground shadow-2xs border border-border/60 font-bold'
                    : 'bg-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground',
                )}
                aria-selected={isActive}
                onClick={() => setMetric(item.id)}
                variant="ghost"
              >
                <Icon
                  name={'fa-solid ' + item.icon}
                  className={cn('size-3.5 transition-colors', item.iconColor)}
                  aria-hidden="true"
                />
                <span>{trUI(item.label)}</span>
              </UiButton>
            );
          })}
        </div>

        <div
          className="lb-scope-box flex items-center gap-2 rounded-xl bg-muted/30 border border-border/50 px-3.5 py-2 text-xs text-muted-foreground"
          role="note"
        >
          <Icon
            name="fa-solid fa-circle-info"
            className="size-3.5 text-amber-500 shrink-0 lb-scope-icon"
            aria-hidden="true"
          />
          <p className="lb-scope-text min-w-0">{trUI(config.note)}</p>
        </div>
      </section>

      <ErrorBox error={error} />

      {/* PODIUM OF TOP 3 (3 BỤC VINH DANH THỰC TẾ) */}
      {data?.length > 0 && (
        <section
          className="lb-podium-section space-y-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs"
          aria-label={trUI('Ba vị trí dẫn đầu')}
        >
          <div className="lb-podium-header flex items-center justify-between gap-3 border-b border-border/50 pb-3">
            <div className="flex items-center gap-2">
              <Icon
                name="fa-solid fa-award"
                className="size-4 text-amber-500"
                aria-hidden="true"
              />
              <h2 className="lb-podium-title font-heading text-sm sm:text-base font-bold text-foreground">
                {trUI('Bục vinh danh · Top 3 Xuất Sắc Nhất')}
              </h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/50">
              {trUI(config.label)}
            </span>
          </div>

          <div className="lb-podium-container grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-6 px-1">
            {podiumSlots.map((slot) => {
              const coder = data[slot.index];
              if (!coder) return null;
              const isFirst = slot.place === 1;
              const isSecond = slot.place === 2;
              const isThird = slot.place === 3;

              return (
                <article
                  key={coder.id}
                  className={cn(
                    'lb-podium-col flex flex-col items-center text-center place-' + slot.place,
                  )}
                >
                  {/* Coder Info Area (Above the pedestal) */}
                  <div className="flex flex-col items-center space-y-2 mb-3 w-full">
                    {/* Crown Slot */}
                    <div className="h-6 flex items-center justify-center">
                      {isFirst && (
                        <span
                          className="lb-podium-crown text-amber-500"
                          title={trUI('Quán quân')}
                        >
                          <Icon name="fa-solid fa-crown" className="size-6 text-amber-500" />
                        </span>
                      )}
                    </div>

                    {/* Avatar with rank medal badge (Màu nổi, không viền bóng) */}
                    <div className="lb-podium-avatar-wrapper relative inline-block">
                      <span
                        className={cn(
                          'avatar shrink-0 lb-podium-avatar flex items-center justify-center rounded-full border-3 font-black transition-transform hover:scale-105',
                          isFirst &&
                            'size-16 sm:size-20 border-amber-400 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 text-2xl sm:text-3xl',
                          isSecond &&
                            'size-13 sm:size-16 border-slate-400 bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200 text-xl sm:text-2xl',
                          isThird &&
                            'size-13 sm:size-16 border-orange-400 bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 text-xl sm:text-2xl',
                        )}
                        aria-hidden="true"
                      >
                        {coder.display_name.slice(0, 1)}
                      </span>
                      <span
                        className={cn(
                          'lb-podium-badge absolute -right-1 -bottom-1 flex items-center justify-center rounded-full text-white font-black border-2 border-card',
                          isFirst && 'size-6 sm:size-7 bg-amber-500 text-xs sm:text-sm',
                          isSecond && 'size-5 sm:size-6 bg-slate-500 text-[11px] sm:text-xs',
                          isThird && 'size-5 sm:size-6 bg-orange-500 text-[11px] sm:text-xs',
                        )}
                      >
                        {slot.place}
                      </span>
                    </div>

                    {/* User info */}
                    <div className="lb-podium-meta space-y-0.5 px-1 max-w-full">
                      <h3
                        className={cn(
                          'lb-podium-name font-heading font-black text-foreground tracking-tight truncate',
                          isFirst ? 'text-sm sm:text-base' : 'text-xs sm:text-sm',
                        )}
                        data-user-content
                        title={coder.display_name}
                      >
                        {coder.display_name}
                      </h3>
                      <small
                        className="lb-podium-username block text-[11px] text-muted-foreground truncate"
                        data-user-content
                      >
                        @{coder.username}
                      </small>
                    </div>

                    {/* Score pill */}
                    <div
                      className={cn(
                        'lb-podium-score-pill inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border tabular-nums',
                        isFirst &&
                          'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700',
                        isSecond &&
                          'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600',
                        isThird &&
                          'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-700',
                      )}
                    >
                      <strong className="lb-podium-score-val font-black">
                        <BoardValue coder={coder} field={config.field} />
                      </strong>
                      <small className="lb-podium-score-sub text-[10px] font-normal opacity-80 truncate max-w-20">
                        {trUI(config.label)}
                      </small>
                    </div>
                  </div>

                  {/* 3D Stepped Pedestal Pillar (Bục vinh danh phẳng, màu nổi, không bóng) */}
                  <div
                    className={cn(
                      'lb-podium-pillar pillar-' + slot.place,
                      'w-full rounded-t-2xl border-2 border-b-0 flex flex-col items-center justify-center p-2 relative transition-all',
                      isFirst &&
                        'h-36 sm:h-44 border-amber-400 bg-amber-200/90 dark:bg-amber-950/80 dark:border-amber-500',
                      isSecond &&
                        'h-24 sm:h-32 border-slate-400 bg-slate-200/90 dark:bg-slate-800/80 dark:border-slate-500',
                      isThird &&
                        'h-16 sm:h-22 border-orange-400 bg-orange-200/90 dark:bg-orange-950/80 dark:border-orange-500',
                    )}
                  >
                    <div className="lb-pillar-surface flex flex-col items-center justify-center text-center">
                      <span
                        className={cn(
                          'lb-pillar-number font-heading font-black select-none tracking-tighter leading-none',
                          isFirst && 'text-4xl sm:text-6xl text-amber-800 dark:text-amber-200',
                          isSecond && 'text-3xl sm:text-5xl text-slate-700 dark:text-slate-200',
                          isThird && 'text-2xl sm:text-4xl text-orange-800 dark:text-orange-200',
                        )}
                      >
                        {slot.place}
                      </span>
                      <span
                        className={cn(
                          'lb-pillar-label font-heading font-bold uppercase tracking-wider mt-1 truncate',
                          isFirst &&
                            'text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 font-extrabold',
                          isSecond &&
                            'text-[10px] sm:text-[11px] text-slate-800 dark:text-slate-200 font-extrabold',
                          isThird &&
                            'text-[10px] text-orange-900 dark:text-orange-200 font-extrabold',
                        )}
                      >
                        {trUI(slot.label)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Podium Ground Baseline */}
          <div
            className="lb-podium-stage-ground mx-auto w-full max-w-2xl h-1 bg-border rounded-full"
            aria-hidden="true"
          />
        </section>
      )}

      {/* FULL LEADERBOARD TABLE BOX */}
      <section className="lb-table-section space-y-4 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs">
        <div className="lb-table-header flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="lb-table-title font-heading text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Icon
                name="fa-solid fa-table-list"
                className="size-4 text-primary"
                aria-hidden="true"
              />
              <span>
                {trUI('Bảng xếp hạng')} · {trUI(config.label)}
              </span>
            </h2>
            <p className="lb-table-subtitle text-xs text-muted-foreground mt-0.5">
              {trUI('Chỉ tài khoản Coder đang hoạt động được tính hạng.')}
            </p>
          </div>
          {mine >= 0 && (
            <UiButton
              type="button"
              className="lb-btn-outline h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs"
              onClick={scrollToMyRank}
              variant="default"
            >
              <Icon name="fa-solid fa-location-crosshairs" className="size-3" aria-hidden="true" />
              <span>
                {trUI('Vị trí của bạn')} (#{mine + 1})
              </span>
            </UiButton>
          )}
        </div>

        {!data ? (
          !error && <Loading />
        ) : (
          <div
            className="paper text-card-foreground shadow-2xs lb-table-card table-wrap min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card"
            role="region"
            aria-label={trUI('Bảng dữ liệu')}
            tabIndex={0}
          >
            <UiTable className="lb-table">
              <UiTableHeader className="bg-muted/30 border-b border-border/60">
                <UiTableRow>
                  <UiTableHead className="lb-th-rank w-16 text-center text-xs font-bold text-muted-foreground">
                    {trUI('Hạng')}
                  </UiTableHead>
                  <UiTableHead className="lb-th-coder text-xs font-bold text-muted-foreground">
                    {trUI('Coder')}
                  </UiTableHead>
                  {config.columns.map((field) => (
                    <UiTableHead
                      key={field}
                      className="lb-th-stat text-xs font-bold text-muted-foreground text-right"
                    >
                      {trUI(LABELS[field])}
                    </UiTableHead>
                  ))}
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                {data.map((coder, index) => {
                  const isTop3 = index < 3;
                  const isMe = coder.id === user?.id;
                  return (
                    <UiTableRow
                      key={coder.id}
                      ref={isMe ? myRowRef : undefined}
                      className={cn(
                        'transition-colors hover:bg-muted/30',
                        isTop3 && 'lb-row-top lb-row-top-' + (index + 1),
                        isMe &&
                          'lb-row-me my-rank bg-primary/5 border-l-4 border-primary font-medium',
                      )}
                    >
                      <UiTableCell className="lb-td-rank text-center">
                        <span className={'lb-rank-badge rank-pos-' + (index + 1)}>
                          {index === 0 ? (
                            <span className="inline-flex items-center justify-center size-7 rounded-full bg-amber-50 text-amber-700 border border-amber-300 font-black text-xs shadow-2xs">
                              🥇
                            </span>
                          ) : index === 1 ? (
                            <span className="inline-flex items-center justify-center size-7 rounded-full bg-slate-50 text-slate-700 border border-slate-300 font-black text-xs shadow-2xs">
                              🥈
                            </span>
                          ) : index === 2 ? (
                            <span className="inline-flex items-center justify-center size-7 rounded-full bg-orange-50 text-orange-700 border border-orange-300 font-black text-xs shadow-2xs">
                              🥉
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </span>
                      </UiTableCell>
                      <UiTableCell className="lb-td-coder">
                        <div className="lb-coder-cell flex items-center gap-2.5">
                          <span
                            className="avatar lb-mini-avatar flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-xs text-primary"
                            aria-hidden="true"
                          >
                            {coder.display_name.slice(0, 1)}
                          </span>
                          <div className="lb-coder-info min-w-0">
                            <div className="flex items-center gap-1.5">
                              <b
                                className="lb-coder-name font-bold text-foreground text-sm hover:text-primary transition-colors"
                                data-user-content
                              >
                                {coder.display_name}
                              </b>
                              {isMe && (
                                <span className="lb-me-tag rounded-full bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 text-[10px] font-bold">
                                  {trUI('Bạn')}
                                </span>
                              )}
                            </div>
                            <small
                              data-user-content
                              className="lb-coder-username text-xs text-muted-foreground block"
                            >
                              @{coder.username}
                            </small>
                          </div>
                        </div>
                      </UiTableCell>
                      {config.columns.map((field) => (
                        <UiTableCell
                          key={field}
                          className="lb-td-stat text-right font-mono font-bold text-sm text-foreground"
                        >
                          <BoardValue coder={coder} field={field} />
                        </UiTableCell>
                      ))}
                    </UiTableRow>
                  );
                })}
              </UiTableBody>
            </UiTable>
            {!data.length && (
              <div className="empty p-12 text-center text-xs text-muted-foreground">
                {trUI('Chưa có Coder.')}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
