import React from 'react';
import RankEmblem, { getRankTier } from './RankEmblem';
import RankAmbientBackground from './RankAmbientBackground';
import ProgressMeter from './ProgressMeter';
import Icon from './Icon';
import { cn } from '../lib/utils';
import { t } from '../lib/locale';

const THEMES = {
  bronze: {
    frame: 'border-[#dc9b69]/60',
    light: 'text-[#ffdbb3]',
    seal: 'border-[#efa767]/35 bg-[#efa767]/10',
    progress: '[&_[data-slot=progress-indicator]]:bg-[#efa767]',
  },
  silver: {
    frame: 'border-[#abc8df]/60',
    light: 'text-[#e1f0ff]',
    seal: 'border-[#b6d8f2]/35 bg-[#b6d8f2]/10',
    progress: '[&_[data-slot=progress-indicator]]:bg-[#b6d8f2]',
  },
  gold: {
    frame: 'border-[#e5bd57]/60',
    light: 'text-[#ffe89a]',
    seal: 'border-[#ffd76d]/35 bg-[#ffd76d]/10',
    progress: '[&_[data-slot=progress-indicator]]:bg-[#ffd76d]',
  },
  platinum: {
    frame: 'border-[#62cfb0]/60',
    light: 'text-[#bceee0]',
    seal: 'border-[#62e2ba]/35 bg-[#62e2ba]/10',
    progress: '[&_[data-slot=progress-indicator]]:bg-[#62e2ba]',
  },
  diamond: {
    frame: 'border-[#69cdea]/60',
    light: 'text-[#b9edff]',
    seal: 'border-[#68dcff]/35 bg-[#68dcff]/10',
    progress: '[&_[data-slot=progress-indicator]]:bg-[#68dcff]',
  },
  master: {
    frame: 'border-[#eeab6c]/60',
    light: 'text-[#ffce77]',
    seal: 'border-[#ffac64]/35 bg-[#ffac64]/10',
    progress: '[&_[data-slot=progress-indicator]]:bg-[#ffac64]',
  },
};

export default function CurrentRankCard({ stats }) {
  const tier = getRankTier(stats.rank),
    theme = THEMES[tier.id] || THEMES.bronze;
  const span = stats.nextRankRating - (stats.rankMinRating ?? 0);
  return (
    <section
      className={cn(
        'current-rank-card relative isolate min-w-0 overflow-hidden rounded-xl border bg-[#14232b] text-slate-100',
        theme.frame,
      )}
      aria-label={t('Rank hiện tại')}
    >
      <RankAmbientBackground tone={tier.id} />
      <div className="relative flex flex-col items-center px-4 pt-4 pb-5 text-center">
        <div className="mb-4 flex w-full items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-200">
            <Icon name="fa-solid fa-shield-halved" className="size-3!" />
            {t('Rank hiện tại')}
          </span>
          <span
            className={cn(
              'size-1.5 rounded-full bg-current shadow-[0_0_9px_currentColor]',
              theme.light,
            )}
            aria-hidden="true"
          />
        </div>
        <div className="relative grid size-32 place-items-center">
          <div className={cn('absolute inset-1 rotate-45 rounded-[28px] border', theme.seal)} />
          <div className={cn('absolute inset-0 rounded-full border border-dashed', theme.seal)} />
          <RankEmblem
            rank={stats.rank}
            decorative
            className="relative h-28! w-24! drop-shadow-[0_6px_12px_rgb(0_0_0/.3)]"
          />
        </div>
        <h3
          className={cn(
            'mt-4 max-w-full font-heading text-3xl font-black tracking-tight wrap-anywhere',
            theme.light,
          )}
        >
          {stats.rank}
        </h3>
        <div className="mt-2 flex items-baseline justify-center gap-1.5">
          <strong className="font-mono text-4xl font-extrabold leading-none tracking-tight text-white">
            {stats.rating}
          </strong>
          <span className="text-xs font-medium text-slate-300">rating</span>
        </div>
        {stats.nextRank && (
          <div className="mt-5 w-full space-y-2 border-t border-white/15 pt-3">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
              <b className={theme.light}>{stats.nextRank}</b>
              {Number.isFinite(stats.ratingToNextRank) && (
                <span className="font-mono text-slate-200">+{stats.ratingToNextRank} rating</span>
              )}
            </div>
            {span > 0 && (
              <ProgressMeter
                aria-label={t('Rating đến rank tiếp theo')}
                value={Math.max(0, Math.min(span, stats.rating - (stats.rankMinRating ?? 0)))}
                max={span}
                className={cn('h-1.5 bg-white/15', theme.progress)}
              />
            )}
          </div>
        )}
        {stats.nextRank === null && (
          <span className={cn('mt-4 flex items-center gap-1.5 text-xs font-bold', theme.light)}>
            <Icon name="fa-solid fa-crown" className="size-3.5!" />
            {t('Bậc cao nhất')}
          </span>
        )}
      </div>
    </section>
  );
}
