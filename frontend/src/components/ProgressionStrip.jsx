import ProgressMeter from './ProgressMeter';
import Icon from './Icon';
import React from 'react';
import { Badge } from './ui';
import { t } from '../lib/locale';
import RankEmblem, { RANK_TIERS, RANK_STYLES, getRankTier } from './RankEmblem';
import { cn } from '../lib/utils';
function ratingRange(item) {
  if (item.minRating == null && typeof item.maxRating === 'number')
    return (
      <>
        {t('Dưới')} {item.maxRating + 1} rating
      </>
    );
  if (typeof item.minRating === 'number' && item.maxRating == null)
    return (
      <>
        {t('Từ')} {item.minRating} rating
      </>
    );
  if (typeof item.minRating === 'number' && typeof item.maxRating === 'number')
    return (
      <>
        {item.minRating}–{item.maxRating} rating
      </>
    );
  return '—';
}
export default function ProgressionStrip({ stats, user, showRankGuide = false }) {
  if (!stats) return null;
  const tier = getRankTier(stats.rank);
  const guide = stats.rankTiers || RANK_TIERS;
  const rankStart = stats.rankMinRating ?? 0;
  const rankSpan = stats.nextRankRating - rankStart;
  return (
    <section
      className={cn(
        'progression-strip paper mb-5 flex flex-wrap items-center gap-7 rounded-[14px] border border-t-[3px] border-t-primary bg-card p-6 text-card-foreground shadow-panel [&_small]:text-[11px]',
        showRankGuide &&
          'grid grid-cols-[minmax(0,1fr)] gap-x-9 gap-y-7 px-6 py-7 min-[641px]:grid-cols-2 min-[1101px]:grid-cols-[minmax(190px,1fr)_minmax(200px,1.1fr)_minmax(300px,1.15fr)] sm:px-8',
      )}
      aria-label={t('Tiến trình học tập')}
    >
      <div
        className={cn(
          'progression-identity flex min-w-0 items-center gap-4',
          showRankGuide &&
            'gap-[18px] [&_b]:font-heading [&_b]:text-xl [&_b]:font-extrabold [&_small]:text-muted-foreground',
        )}
      >
        <span
          className={cn(
            'avatar flex size-12 shrink-0 items-center justify-center rounded-full border-2 bg-surface-strong text-xl font-semibold text-success',
            'avatar-frame-' + stats.avatarFrame,
            showRankGuide && 'size-16 rounded-2xl border-success bg-success-soft text-[26px]',
            stats.avatarFrame === 'silver' &&
              'outline-2 outline-offset-[3px] outline-muted-foreground',
            stats.avatarFrame === 'gold' &&
              'text-warning outline-2 outline-offset-[3px] outline-warning',
          )}
          aria-hidden="true"
        >
          {user.displayName?.slice(0, 1)}
        </span>
        <div className="grid gap-1">
          <b data-user-content>{user.displayName}</b>
          <small>LEVEL {stats.level} · Code Survival</small>
        </div>
      </div>
      <div className="exp-meter min-w-0 flex-1 space-y-4 [&_b]:font-heading [&_b]:text-xl [&_b]:font-extrabold [&_b]:text-success [&_small]:text-muted-foreground [&_[role=progressbar]]:h-3 [&_[role=progressbar]]:bg-surface-strong">
        <div className="inline-group between flex flex-wrap items-center justify-between gap-3">
          <b>{stats.exp} EXP</b>
          <small>Mốc tiếp theo: {stats.nextLevelExp}</small>
        </div>
        <ProgressMeter
          aria-label="EXP đến cấp tiếp theo"
          value={stats.exp - 100 * (stats.level - 1) ** 2}
          max={stats.nextLevelExp - 100 * (stats.level - 1) ** 2}
        />
      </div>
      <div
        className={cn(
          'progression-rank flex min-w-0 items-center gap-4 rounded-[14px] border p-5',
          showRankGuide
            ? RANK_STYLES[tier.id]
            : RANK_STYLES[tier.id]?.split(' ').find((token) => token.startsWith('text-')),
          !showRankGuide &&
            'rounded-none border-0 border-l border-border bg-transparent py-0 pr-0 pl-7 [&_strong]:text-lg',
          showRankGuide && 'gap-5 px-6 py-5 max-[1100px]:col-span-full min-[1101px]:col-span-1',
        )}
        data-rank={tier.id}
      >
        <RankEmblem
          rank={stats.rank}
          decorative
          className={showRankGuide ? '!h-24 !w-[88px]' : ''}
        />
        <div className="progression-rank-copy grid min-w-0 gap-1 [&>small]:font-mono [&>small]:text-[9px] [&>small]:tracking-[.12em] [&>span]:font-mono [&>span]:text-[13px] [&>strong]:my-2 [&>strong]:font-heading [&>strong]:text-[30px] [&>strong]:leading-[1.15] [&>strong]:font-extrabold">
          <small>SURVIVAL RANKED</small>
          <strong>{stats.rank}</strong>
          <span>{stats.rating} rating</span>
          {stats.nextRank ? (
            <div className="rank-next-target mt-2 space-y-2 text-[11px] text-muted-foreground [&_[role=progressbar]]:h-1 [&_[role=progressbar]]:max-w-44">
              <p>
                {t('Còn thiếu')} <b>{stats.ratingToNextRank}</b> {t('rating để lên')}{' '}
                <b>{stats.nextRank}</b>
              </p>
              <small>
                {t('Mốc thăng hạng')}: {stats.nextRankRating} rating
              </small>
              {rankSpan > 0 && (
                <ProgressMeter
                  aria-label={t('Rating đến rank tiếp theo')}
                  value={Math.max(0, Math.min(rankSpan, stats.rating - rankStart))}
                  max={rankSpan}
                />
              )}
            </div>
          ) : (
            stats.nextRank === null && (
              <p className="rank-highest">{t('Bạn đã đạt rank cao nhất.')}</p>
            )
          )}
          {stats.ratingGainMultiplier > 1 && (
            <small className="rank-gain-support">
              {t('Hỗ trợ điểm tăng')} ×{stats.ratingGainMultiplier}
            </small>
          )}
        </div>
      </div>
      <div
        className={cn(
          'progression-badges flex flex-wrap items-center gap-2',
          showRankGuide && 'col-span-full',
          !stats.badges.length && showRankGuide && 'hidden',
        )}
      >
        {stats.badges.length ? (
          stats.badges.map((b) => <Badge key={b}>{b}</Badge>)
        ) : (
          <small>Huy hiệu xuất hiện khi đạt cột mốc.</small>
        )}
      </div>
      {showRankGuide && (
        <details
          open
          className="progression-rank-guide col-span-full w-full border-t pt-5 [&>summary]:flex [&>summary]:min-h-9 [&>summary]:items-center [&>summary]:gap-2 [&>summary]:text-[11px] [&>summary]:text-muted-foreground [&>summary>svg:last-child]:ml-auto"
        >
          <summary>
            <Icon name="fa-solid fa-medal" aria-hidden="true" />
            {t('Các bậc Rank')}
            <Icon name="fa-solid fa-chevron-down" aria-hidden="true" />
          </summary>
          <ol className="mt-[18px] grid grid-cols-2 gap-3 min-[481px]:grid-cols-3 min-[768px]:grid-cols-6 min-[768px]:gap-4">
            {guide.map((item) => {
              const visual = getRankTier(item.name),
                current = visual.id === tier.id;
              return (
                <li
                  key={visual.id}
                  className={cn(
                    'flex flex-col items-center justify-start gap-2 rounded-xl border border-transparent px-2.5 py-4 text-center text-xs [&>small]:text-[10px] [&>.rank-rating-range]:font-mono [&>.rank-rating-range]:text-[10px]',
                    current
                      ? cn('is-current', RANK_STYLES[visual.id])
                      : RANK_STYLES[visual.id]
                          ?.split(' ')
                          .find((token) => token.startsWith('text-')),
                  )}
                  aria-current={current ? 'step' : undefined}
                >
                  <RankEmblem rank={item.name} decorative />
                  <b>{item.name}</b>
                  <span className="rank-rating-range">{ratingRange(item)}</span>
                  {item.gainMultiplier > 1 ? (
                    <span className="rank-gain-badge">
                      ×{item.gainMultiplier} {t('điểm tăng')}
                    </span>
                  ) : (
                    item.gainMultiplier === 1 && <small>{t('Điểm tăng tiêu chuẩn')}</small>
                  )}
                  {current && <small>{t('Rank của bạn')}</small>}
                </li>
              );
            })}
          </ol>
          {stats.rankTiers && (
            <p className="rank-policy-note mt-3 text-xs leading-relaxed text-muted-foreground">
              {t(
                'Hệ số chỉ áp dụng cho phần rating tăng, theo rank đầu trận. Điểm trừ không nhân hệ số. Chỉ Đấu Rank thay đổi rating.',
              )}
            </p>
          )}
        </details>
      )}
    </section>
  );
}
