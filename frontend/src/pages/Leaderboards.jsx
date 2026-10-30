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
    columns: ['elo', 'ac'],
    note: 'Elo chỉ thay đổi từ kết quả Contest có tính điểm.',
  },
  {
    id: 'ac',
    field: 'ac',
    label: 'Số bài AC',
    icon: 'fa-code',
    columns: ['ac', 'exp', 'rank'],
    note: 'Xếp hạng theo tổng số bài đã giải AC.',
  },
  {
    id: 'exp',
    field: 'exp',
    label: 'EXP',
    icon: 'fa-star',
    columns: ['exp', 'rank', 'normal_games', 'ranked_games'],
    note: 'EXP tích lũy từ các hoạt động được hệ thống ghi nhận.',
  },
  {
    id: 'rank',
    field: 'rank',
    label: 'Mức Rank',
    icon: 'fa-shield-halved',
    columns: ['rank', 'rating', 'exp', 'ranked_games'],
    note: 'Xếp theo điểm Rank Survival, từ cao xuống thấp. Điểm Rank độc lập với Elo Contest.',
  },
  {
    id: 'normal_games',
    field: 'normal_games',
    label: 'Số trận thường',
    icon: 'fa-bolt',
    columns: ['normal_games', 'exp', 'rank'],
    note: 'Chỉ đếm trận đấu thường đã kết thúc có kết quả chính thức; không tính phòng giao lưu hoặc trận bị hủy.',
  },
  {
    id: 'ranked_games',
    field: 'ranked_games',
    label: 'Số trận Rank',
    icon: 'fa-trophy',
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
    <div className="leaderboard-page min-w-0 space-y-6">
      <Heading
        kind="leaderboard"
        title={trUI('Những người dẫn đầu')}
        highlight={{
          label: 'Dẫn đầu hiện tại',
          value: data?.[0]?.display_name || '—',
          userContent: true,
          detail: config.label,
        }}
      >
        {trUI('Elo Contest, bài AC và thành tích Survival được xếp hạng theo từng tiêu chí riêng.')}
      </Heading>

      {/* FILTER & CRITERIA CONTROL BOX */}
      <section
        className="lb-control-card space-y-5 rounded-[14px] border bg-card p-5"
        aria-label={trUI('Tiêu chí xếp hạng')}
      >
        <div className="lb-control-header mb-4">
          <span className="lb-control-title flex flex-wrap items-center gap-3">
            <Icon name="fa-solid fa-layer-group" aria-hidden="true" />
            <span>{trUI('Tiêu chí xếp hạng')}</span>
          </span>
        </div>

        <div
          className="lb-metric-buttons flex flex-wrap gap-1 rounded-lg bg-muted p-1"
          role="tablist"
        >
          {METRICS.map((item) => {
            const isActive = metric === item.id;
            return (
              <UiButton
                key={item.id}
                role="tab"
                type="button"
                className={
                  'lb-metric-btn h-9 justify-center gap-2 rounded-md border-0 bg-transparent px-3 text-sm font-medium text-muted-foreground shadow-none hover:bg-card hover:text-foreground ' +
                  (isActive
                    ? 'active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                    : '')
                }
                aria-selected={isActive}
                onClick={() => setMetric(item.id)}
                variant="default"
              >
                <Icon name={'fa-solid ' + item.icon} aria-hidden="true" />
                <span>{trUI(item.label)}</span>
              </UiButton>
            );
          })}
        </div>

        <div
          className="lb-scope-box flex items-start gap-3 rounded-lg bg-muted/70 p-3 text-sm text-muted-foreground"
          role="note"
        >
          <Icon name="fa-solid fa-circle-info lb-scope-icon" aria-hidden="true" />
          <p className="lb-scope-text min-w-0 space-y-1">{trUI(config.note)}</p>
        </div>
      </section>

      <ErrorBox error={error} />

      {/* PODIUM OF TOP 3 */}
      {data?.length > 0 && (
        <section
          className="lb-podium-section space-y-4 rounded-[14px] border bg-card p-5"
          aria-label={trUI('Ba vị trí dẫn đầu')}
        >
          <div className="lb-podium-header space-y-1">
            <span className="lb-podium-kicker">
              <Icon name="fa-solid fa-award" aria-hidden="true" />
              <span>{trUI('Bục vinh danh')}</span>
            </span>
            <h2 className="lb-podium-title font-semibold">{trUI('Top 3 Xuất Sắc Nhất')}</h2>
          </div>

          <div className="lb-podium-container grid gap-3 sm:grid-cols-3">
            {podiumSlots.map((slot) => {
              const coder = data[slot.index];
              if (!coder) return null;
              const isFirst = slot.place === 1;
              return (
                <article
                  key={coder.id}
                  className={
                    'lb-podium-col flex flex-col items-center gap-2 rounded-[14px] border bg-muted/30 p-5 text-center place-' +
                    slot.place
                  }
                >
                  {/* Crown for 1st place */}
                  <div className="lb-podium-crown-slot text-amber-600">
                    {isFirst && (
                      <span
                        className="lb-podium-crown text-amber-600"
                        title={trUI('Quán quân')}
                        aria-hidden="true"
                      >
                        <Icon name="fa-solid fa-crown" />
                      </span>
                    )}
                  </div>

                  {/* Avatar with rank medal badge */}
                  <div className="lb-podium-avatar-wrapper relative">
                    <span
                      className="avatar shrink-0 lb-podium-avatar flex size-14 items-center justify-center rounded-full border-4 border-card bg-accent text-xl font-semibold text-primary"
                      aria-hidden="true"
                    >
                      {coder.display_name.slice(0, 1)}
                    </span>
                    <span className="lb-podium-badge absolute -right-1 -bottom-1 rounded-full bg-primary px-2 text-xs text-primary-foreground">
                      <Icon name={'fa-solid ' + slot.medalIcon} aria-hidden="true" />
                      <span>{slot.place}</span>
                    </span>
                  </div>

                  {/* User info */}
                  <div className="lb-podium-meta">
                    <h3
                      className="lb-podium-name font-semibold"
                      data-user-content
                      title={coder.display_name}
                    >
                      {coder.display_name}
                    </h3>
                    <small
                      className="lb-podium-username text-xs text-muted-foreground"
                      data-user-content
                    >
                      @{coder.username}
                    </small>
                  </div>

                  {/* Score pill */}
                  <div className="lb-podium-score-pill rounded-full bg-accent px-3 py-1 text-sm font-medium text-primary">
                    <strong className="lb-podium-score-val">
                      <BoardValue coder={coder} field={config.field} />
                    </strong>
                    <small className="lb-podium-score-sub">{trUI(config.label)}</small>
                  </div>

                  {/* 3D Pedestal Pillar */}
                  <div className={'lb-podium-pillar hidden pillar-' + slot.place}>
                    <div className="lb-pillar-surface">
                      <span className="lb-pillar-number">{slot.place}</span>
                      <span className="lb-pillar-label text-xs text-muted-foreground">
                        {trUI(slot.label)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="lb-podium-stage-ground hidden" aria-hidden="true" />
        </section>
      )}

      {/* FULL LEADERBOARD TABLE BOX */}
      <section className="lb-table-section space-y-5 rounded-[14px] border bg-card p-5">
        <div className="lb-table-header flex flex-wrap items-center gap-3">
          <div>
            <h2 className="lb-table-title font-semibold">
              <Icon name="fa-solid fa-table-list" aria-hidden="true" />
              <span>
                {trUI('Bảng xếp hạng')} · {trUI(config.label)}
              </span>
            </h2>
            <p className="lb-table-subtitle text-xs text-muted-foreground">
              {trUI('Chỉ tài khoản Coder đang hoạt động được tính hạng.')}
            </p>
          </div>
          {mine >= 0 && (
            <UiButton
              type="button"
              className="lb-btn-outline"
              onClick={scrollToMyRank}
              variant="default"
            >
              <Icon name="fa-solid fa-location-crosshairs" aria-hidden="true" />
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
            className="paper text-card-foreground shadow-xs lb-table-card table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
            role="region"
            aria-label={trUI('Bảng dữ liệu')}
            tabIndex={0}
          >
            <UiTable className="lb-table">
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead className="lb-th-rank">{trUI('Hạng')}</UiTableHead>
                  <UiTableHead className="lb-th-coder">{trUI('Coder')}</UiTableHead>
                  {config.columns.map((field) => (
                    <UiTableHead key={field} className="lb-th-stat">
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
                      className={
                        (isTop3 ? 'lb-row-top lb-row-top-' + (index + 1) + '  ' : '') +
                        (isMe ? 'lb-row-me my-rank bg-accent/60' : '')
                      }
                    >
                      <UiTableCell className="lb-td-rank">
                        <span className={'lb-rank-badge rank-pos-' + (index + 1)}>
                          {index === 0 ? (
                            <>
                              <Icon name="fa-solid fa-trophy" aria-hidden="true" />
                              <span className="sr-only">1</span>
                            </>
                          ) : index === 1 ? (
                            <>
                              <Icon name="fa-solid fa-medal" aria-hidden="true" />
                              <span className="sr-only">2</span>
                            </>
                          ) : index === 2 ? (
                            <>
                              <Icon name="fa-solid fa-award" aria-hidden="true" />
                              <span className="sr-only">3</span>
                            </>
                          ) : (
                            index + 1
                          )}
                        </span>
                      </UiTableCell>
                      <UiTableCell className="lb-td-coder">
                        <div className="lb-coder-cell flex flex-wrap items-center gap-3">
                          <span
                            className="avatar lb-mini-avatar flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-primary"
                            aria-hidden="true"
                          >
                            {coder.display_name.slice(0, 1)}
                          </span>
                          <div className="lb-coder-info min-w-0 space-y-1">
                            <span className="lb-coder-name">
                              <b data-user-content>{coder.display_name}</b>
                              {isMe && (
                                <span className="lb-me-tag rounded bg-accent px-1.5 text-xs text-primary">
                                  {trUI('Bạn')}
                                </span>
                              )}
                            </span>
                            <small
                              data-user-content
                              className="lb-coder-username text-xs text-muted-foreground"
                            >
                              @{coder.username}
                            </small>
                          </div>
                        </div>
                      </UiTableCell>
                      {config.columns.map((field) => (
                        <UiTableCell key={field} className="lb-td-stat">
                          <BoardValue coder={coder} field={field} />
                        </UiTableCell>
                      ))}
                    </UiTableRow>
                  );
                })}
              </UiTableBody>
            </UiTable>
            {!data.length && (
              <div className="empty rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
                {trUI('Chưa có Coder.')}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
