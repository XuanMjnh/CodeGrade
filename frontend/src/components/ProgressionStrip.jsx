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
    title: 'text-[#ffdbb3]',
    surface: 'from-[#493022] via-[#291f1b] to-[#181b20] border-[#efa767]/35',
    crest: 'border-[#efa767]/30 bg-[#efa767]/10 shadow-[0_0_24px_#efa76718]',
    accent: 'bg-[#efa767]',
    active: 'border-[#efa767] ring-2 ring-[#efa767]/30 shadow-[0_4px_16px_#a95f3226]',
    badge: 'border-[#efa767]/35 bg-[#efa767]/15 text-[#ffdbb3]',
    multiplier: 'border-[#efa767]/25 bg-[#efa767]/10 text-[#ffdbb3]',
  },
  silver: {
    title: 'text-[#e1f0ff]',
    surface: 'from-[#344858] via-[#222d38] to-[#191e28] border-[#b6d8f2]/35',
    crest: 'border-[#b6d8f2]/30 bg-[#b6d8f2]/10 shadow-[0_0_24px_#b6d8f218]',
    accent: 'bg-[#b6d8f2]',
    active: 'border-[#b6d8f2] ring-2 ring-[#b6d8f2]/30 shadow-[0_4px_16px_#62788a26]',
    badge: 'border-[#b6d8f2]/35 bg-[#b6d8f2]/15 text-[#e1f0ff]',
    multiplier: 'border-[#b6d8f2]/25 bg-[#b6d8f2]/10 text-[#e1f0ff]',
  },
  gold: {
    title: 'text-[#ffe89a]',
    surface: 'from-[#51401c] via-[#2e281a] to-[#1f1e22] border-[#ffd76d]/40',
    crest: 'border-[#ffd76d]/35 bg-[#ffd76d]/10 shadow-[0_0_24px_#ffd76d20]',
    accent: 'bg-[#ffd76d]',
    active: 'border-[#ffd76d] ring-2 ring-[#ffd76d]/30 shadow-[0_4px_16px_#a8761226]',
    badge: 'border-[#ffd76d]/35 bg-[#ffd76d]/15 text-[#ffe89a]',
    multiplier: 'border-[#ffd76d]/25 bg-[#ffd76d]/10 text-[#ffe89a]',
  },
  platinum: {
    title: 'text-[#bceee0]',
    surface: 'from-[#184e42] via-[#17332e] to-[#17242a] border-[#62e2ba]/35',
    crest: 'border-[#62e2ba]/30 bg-[#62e2ba]/10 shadow-[0_0_24px_#62e2ba18]',
    accent: 'bg-[#62e2ba]',
    active: 'border-[#62e2ba] ring-2 ring-[#62e2ba]/30 shadow-[0_4px_16px_#24826c26]',
    badge: 'border-[#62e2ba]/35 bg-[#62e2ba]/15 text-[#bceee0]',
    multiplier: 'border-[#62e2ba]/25 bg-[#62e2ba]/10 text-[#bceee0]',
  },
  diamond: {
    title: 'text-[#b9edff]',
    surface: 'from-[#19485d] via-[#1b3047] to-[#23233b] border-[#68dcff]/40',
    crest: 'border-[#68dcff]/35 bg-[#68dcff]/10 shadow-[0_0_24px_#68dcff20]',
    accent: 'bg-[#68dcff]',
    active: 'border-[#68dcff] ring-2 ring-[#68dcff]/30 shadow-[0_4px_16px_#237d9d26]',
    badge: 'border-[#68dcff]/35 bg-[#68dcff]/15 text-[#b9edff]',
    multiplier: 'border-[#68dcff]/25 bg-[#68dcff]/10 text-[#b9edff]',
  },
  master: {
    title: 'text-[#ffce77]',
    surface: 'from-[#5a3025] via-[#3a2233] to-[#262039] border-[#ffac64]/45',
    crest: 'border-[#ffac64]/40 bg-[#ffac64]/10 shadow-[0_0_24px_#ffac6426]',
    accent: 'bg-[#ffac64]',
    active: 'border-[#ffac64] ring-2 ring-[#ffac64]/30 shadow-[0_4px_16px_#b84e2326]',
    badge: 'border-[#ffac64]/35 bg-[#ffac64]/15 text-[#ffce77]',
    multiplier: 'border-[#ffac64]/25 bg-[#ffac64]/10 text-[#ffce77]',
  },
};

export function RankTierStrip({ stats }) {
  if (!stats) return null;
  const guide = stats.rankTiers || RANK_TIERS;
  const currentRank = getRankTier(stats.rank).id;
  return (
    <section
      className="survival-rank-strip min-w-0 rounded-2xl border border-border/80 bg-card p-2 shadow-sm sm:p-2.5"
      aria-label={t('Các bậc Rank')}
    >
      <ol className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 min-[640px]:grid-cols-3 min-[1080px]:grid-cols-6">
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
                'relative isolate flex min-h-28 min-w-0 items-center gap-2.5 overflow-hidden rounded-xl border bg-linear-to-br p-2.5 sm:px-3',
                theme?.surface || 'from-slate-700 to-slate-900 border-slate-600',
                current
                  ? theme?.active || 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                  : 'shadow-xs',
              )}
            >
              <div
                aria-hidden="true"
                className={cn(
                  'absolute inset-x-0 bottom-0',
                  current ? 'h-1' : 'h-0.5 opacity-50',
                  theme?.accent,
                )}
              />
              <div
                className={cn(
                  'relative grid h-16 w-12 shrink-0 place-items-center rounded-xl border sm:h-18 sm:w-14',
                  theme?.crest,
                )}
              >
                <RankEmblem
                  rank={item.name}
                  decorative
                  className={cn(
                    'h-14! w-11! sm:h-16! sm:w-13! shrink-0 drop-shadow-[0_4px_6px_#0006]',
                  )}
                />
              </div>
              <div className="relative min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <b
                    className={cn(
                      'font-heading text-base min-[1280px]:text-lg font-black leading-tight tracking-tight',
                      theme?.title || 'text-slate-100',
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
                      <span className="size-1 rounded-full bg-current shadow-[0_0_6px_currentColor]" />
                      {t('Hiện tại')}
                    </span>
                  )}
                </div>
                {hasRange && (
                  <span className="block font-mono text-[10px] leading-relaxed text-slate-300">
                    {ratingRange(item)}
                  </span>
                )}
                {item.gainMultiplier > 1 ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.2 font-mono text-[9px] font-bold border leading-tight',
                      theme?.multiplier || 'border-white/15 bg-white/10 text-slate-200',
                    )}
                  >
                    ×{item.gainMultiplier} {t('điểm tăng')}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-md border px-1.5 py-0.2 font-mono text-[9px] font-medium leading-tight',
                      current
                        ? 'border-white/15 bg-white/10 text-slate-200'
                        : 'border-white/10 bg-white/5 text-slate-300',
                    )}
                  >
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
