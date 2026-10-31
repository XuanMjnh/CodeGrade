import React from 'react';
import RankEmblem, { getRankTier } from './RankEmblem';
import ProgressMeter from './ProgressMeter';
import Icon from './Icon';
import { cn } from '../lib/utils';
import { t } from '../lib/locale';

export default function CurrentRankCard({ stats }) {
  const tier = getRankTier(stats.rank);
  const span = stats.nextRankRating - (stats.rankMinRating ?? 0);

  return (
    <section
      className="current-rank-card min-w-0 rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-3"
      aria-label={t('Rank hiện tại')}
    >
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-heading text-xs font-bold text-foreground">
          <Icon name="fa-solid fa-shield-halved" className="size-3 text-action" />
          <span>{t('Rank hiện tại')}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-action/10 px-2 py-0.5 font-mono text-[10px] font-extrabold text-action">
          {stats.rank}
        </span>
      </div>

      {/* Emblem & Rating */}
      <div className="flex flex-col items-center justify-center py-1 text-center">
        <RankEmblem
          rank={stats.rank}
          decorative
          className="h-24 w-auto sm:h-28 drop-shadow-sm transition-transform duration-200 hover:scale-105"
        />
        <div className="mt-2.5">
          <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {stats.rating}
          </span>
          <span className="ml-1 font-mono text-xs font-semibold text-muted-foreground">rating</span>
        </div>
      </div>

      {/* Next Rank Goal / Progress */}
      {stats.nextRank && (
        <div className="space-y-1.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <span className="text-muted-foreground">{t('Mục tiêu')}:</span>
              <b className="font-bold">{stats.nextRank}</b>
            </span>
            {Number.isFinite(stats.ratingToNextRank) && (
              <span className="font-mono font-bold text-action">
                +{stats.ratingToNextRank} rating
              </span>
            )}
          </div>
          {span > 0 && (
            <ProgressMeter
              aria-label={t('Rating đến rank tiếp theo')}
              value={Math.max(0, Math.min(span, stats.rating - (stats.rankMinRating ?? 0)))}
              max={span}
              className="h-1.5 rounded-full [&_[data-slot=progress-indicator]]:bg-action"
            />
          )}
        </div>
      )}

      {stats.nextRank === null && (
        <div className="flex items-center justify-center gap-1.5 border-t border-border/50 pt-2 text-xs font-bold text-amber-500">
          <Icon name="fa-solid fa-crown" className="size-3.5" />
          <span>{t('Bậc cao nhất')}</span>
        </div>
      )}
    </section>
  );
}
