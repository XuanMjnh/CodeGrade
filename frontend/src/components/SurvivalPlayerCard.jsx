import React from 'react';
import RankEmblem from './RankEmblem';
import ProgressMeter from './ProgressMeter';
import { Badge, Loading } from './ui';
import { cn } from '../lib/utils';

export default function SurvivalPlayerCard({ stats, user }) {
  if (!stats) return <Loading />;
  const levelStart = 100 * (stats.level - 1) ** 2;
  return (
    <section
      className="progression-strip min-w-0 overflow-hidden rounded-2xl border bg-card"
      aria-label="Thông tin Coder"
    >
      <div className="relative flex flex-col items-center gap-3 border-b bg-accent/60 px-5 pt-7 pb-5 text-center">
        <span className="absolute top-3 right-3 rounded-lg border border-primary/20 bg-card px-2 py-1 font-mono text-sm font-bold text-primary">
          LV.{stats.level}
        </span>
        <span
          className={cn(
            'avatar grid size-16 place-items-center rounded-2xl border-2 border-primary bg-card font-heading text-3xl font-black text-primary',
            'avatar-frame-' + stats.avatarFrame,
          )}
          aria-hidden="true"
        >
          {user.displayName?.slice(0, 1)}
        </span>
        <b
          className="max-w-full font-heading text-xl font-extrabold wrap-anywhere"
          data-user-content
        >
          {user.displayName}
        </b>
      </div>
      <div className="space-y-5 p-5">
        <div className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <b className="font-mono text-xl font-extrabold text-primary">{stats.exp} EXP</b>
            <span className="text-xs text-muted-foreground">/ {stats.nextLevelExp}</span>
          </div>
          <ProgressMeter
            aria-label="EXP đến cấp tiếp theo"
            value={stats.exp - levelStart}
            max={stats.nextLevelExp - levelStart}
          />
        </div>
        <div className="flex items-center gap-3 rounded-xl border bg-warning-soft/40 p-3">
          <RankEmblem rank={stats.rank} decorative className="h-16! w-14!" />
          <div className="min-w-0">
            <b className="block font-heading text-3xl font-extrabold text-warning">{stats.rank}</b>
            <span className="flex flex-wrap items-baseline gap-1">
              <b className="font-mono text-xl font-extrabold">{stats.rating}</b>
              <span className="text-xs text-muted-foreground">rating</span>
            </span>
          </div>
        </div>
        {stats.badges?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stats.badges.map((badge) => (
              <Badge key={badge} className="text-[10px]">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
