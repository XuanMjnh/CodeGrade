import React from 'react';
import CurrentRankCard from './CurrentRankCard';
import ProgressMeter from './ProgressMeter';
import Icon from './Icon';
import { Badge, Loading } from './ui';
import { t } from '../lib/locale';
import { cn } from '../lib/utils';

export default function SurvivalPlayerCard({ stats, user }) {
  if (!stats) return <Loading />;
  const levelStart = 100 * (stats.level - 1) ** 2;

  return (
    <section
      className="survival-player-card min-w-0 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-4"
      aria-label={t('Thông tin Coder')}
    >
      {/* Profile Hero Box */}
      <div className="relative flex flex-col items-center gap-2.5 rounded-xl border border-primary/15 bg-gradient-to-b from-primary/10 via-primary/5 to-card/50 p-4 text-center">
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-card/95 px-2 py-0.5 font-mono text-[10px] font-extrabold text-primary shadow-2xs">
          <Icon name="bolt" className="size-2.5 text-primary" />
          LV.{stats.level}
        </span>
        <span
          className={cn(
            'avatar flex size-14 items-center justify-center rounded-2xl border-2 border-primary bg-card font-heading text-2xl font-black text-primary shadow-xs transition-transform hover:scale-105',
            'avatar-frame-' + stats.avatarFrame,
          )}
          aria-hidden="true"
        >
          {user.displayName?.slice(0, 1)}
        </span>
        <div className="min-w-0 max-w-full space-y-0.5">
          <b
            className="block font-heading text-base font-extrabold text-foreground truncate"
            data-user-content
          >
            {user.displayName}
          </b>
          <span className="block text-[11px] font-medium text-muted-foreground">
            {user.role === 'ADMIN' ? t('Quản trị viên') : t('Đấu thủ Code Survival')}
          </span>
        </div>
      </div>

      {/* EXP Progress Meter */}
      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 font-bold text-primary">
            <Icon name="star" className="size-3.5 fill-primary text-primary" />
            <span className="font-mono text-sm font-extrabold">{stats.exp} EXP</span>
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">
            / {stats.nextLevelExp} EXP
          </span>
        </div>
        <ProgressMeter
          aria-label="EXP đến cấp tiếp theo"
          value={stats.exp - levelStart}
          max={stats.nextLevelExp - levelStart}
          className="h-2 rounded-full"
        />
      </div>

      <CurrentRankCard stats={stats} />

      {/* Badges */}
      {stats.badges?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {stats.badges.map((badge) => (
            <Badge key={badge} className="text-[10px] rounded-md px-2 py-0.5">
              {badge}
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
