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
const TIER_THEMES = {
  bronze: {
    title: 'text-[#a95f32] dark:text-[#f5d6ad]',
    active:
      'border-[#a95f32]/60 bg-gradient-to-br from-[#fcf0e4] to-card dark:from-[#a95f32]/25 dark:to-card ring-2 ring-[#a95f32]/25 shadow-xs',
    badge: 'bg-[#a95f32]/15 text-[#a95f32] border-[#a95f32]/30 dark:text-[#f5d6ad]',
    multiplier: 'bg-[#a95f32]/15 text-[#a95f32] border-[#a95f32]/30 dark:text-[#f5d6ad]',
  },
  silver: {
    title: 'text-[#62788a] dark:text-[#e8f0f6]',
    active:
      'border-[#62788a]/60 bg-gradient-to-br from-[#f0f4f7] to-card dark:from-[#62788a]/25 dark:to-card ring-2 ring-[#62788a]/25 shadow-xs',
    badge: 'bg-[#62788a]/15 text-[#62788a] border-[#62788a]/30 dark:text-[#e8f0f6]',
    multiplier: 'bg-[#62788a]/15 text-[#62788a] border-[#62788a]/30 dark:text-[#e8f0f6]',
  },
  gold: {
    title: 'text-amber-700 dark:text-amber-300',
    active:
      'border-amber-400 bg-gradient-to-br from-[#fff7da] to-card dark:from-amber-500/25 dark:to-card ring-2 ring-amber-400/30 shadow-xs',
    badge: 'bg-amber-500/15 text-amber-700 border-amber-400/40 dark:text-amber-300',
    multiplier: 'bg-amber-500/15 text-amber-700 border-amber-400/40 dark:text-amber-300',
  },
  platinum: {
    title: 'text-[#24826c] dark:text-[#bceee0]',
    active:
      'border-emerald-500/60 bg-gradient-to-br from-[#e9f7f1] to-card dark:from-emerald-500/25 dark:to-card ring-2 ring-emerald-500/25 shadow-xs',
    badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/40 dark:text-emerald-300',
    multiplier: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/40 dark:text-emerald-300',
  },
  diamond: {
    title: 'text-[#237d9d] dark:text-[#b9edff]',
    active:
      'border-sky-500/60 bg-gradient-to-br from-[#eaf8fc] to-card dark:from-sky-500/25 dark:to-card ring-2 ring-sky-500/25 shadow-xs',
    badge: 'bg-sky-500/15 text-sky-700 border-sky-400/40 dark:text-sky-300',
    multiplier: 'bg-sky-500/15 text-sky-700 border-sky-400/40 dark:text-sky-300',
  },
  master: {
    title: 'text-[#c65316] dark:text-[#ffce77]',
    active:
      'border-orange-500/60 bg-gradient-to-br from-[#fff0e4] to-card dark:from-orange-500/25 dark:to-card ring-2 ring-orange-500/25 shadow-xs',
    badge: 'bg-orange-500/15 text-orange-700 border-orange-400/40 dark:text-orange-300',
    multiplier: 'bg-orange-500/15 text-orange-700 border-orange-400/40 dark:text-orange-300',
  },
};

export function RankTierStrip({ stats }) {
  if (!stats) return null;
  const guide = stats.rankTiers || RANK_TIERS;
  const currentRank = getRankTier(stats.rank).id;
  return (
    <section
      className="survival-rank-strip min-w-0 rounded-2xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-2xs"
      aria-label={t('Các bậc Rank')}
    >
      <ol className="grid grid-cols-2 min-[640px]:grid-cols-3 min-[1080px]:grid-cols-6 gap-2">
        {guide.map((item) => {
          const visual = getRankTier(item.name),
            current = visual.id === currentRank;
          const theme = TIER_THEMES[visual.id];
          const hasRange = item.minRating != null || item.maxRating != null;
          return (
            <li
              key={visual.id}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'group relative flex min-w-0 items-center gap-2.5 rounded-xl border p-2.5 sm:px-3 sm:py-2.5 transition-all',
                current
                  ? theme?.active || 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                  : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40 hover:shadow-2xs',
              )}
            >
              <div className="relative shrink-0 flex items-center justify-center">
                <RankEmblem
                  rank={item.name}
                  decorative
                  className={cn(
                    'h-10! w-8! sm:h-11! sm:w-9! shrink-0 transition-transform group-hover:scale-105',
                    current && 'drop-shadow-xs',
                  )}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <b
                    className={cn(
                      'font-heading text-xs sm:text-sm font-extrabold tracking-tight truncate',
                      current ? theme?.title : 'text-foreground',
                    )}
                  >
                    {item.name}
                  </b>
                  {current && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 font-mono text-[9px] font-bold border leading-tight',
                        theme?.badge,
                      )}
                    >
                      <span className="size-1 rounded-full bg-current animate-pulse" />
                      {t('Hiện tại')}
                    </span>
                  )}
                </div>
                {hasRange && (
                  <span className="block font-mono text-[10px] text-muted-foreground truncate">
                    {ratingRange(item)}
                  </span>
                )}
                {item.gainMultiplier > 1 ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.2 font-mono text-[9px] font-bold border leading-tight',
                      theme?.multiplier,
                    )}
                  >
                    ×{item.gainMultiplier} {t('điểm tăng')}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md bg-muted/60 border border-border/40 px-1.5 py-0.2 font-mono text-[9px] font-medium text-muted-foreground/70 leading-tight">
                    ×1 {t('chuẩn')}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
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
