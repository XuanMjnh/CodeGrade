import React from 'react';
import RankEmblem, { getRankTier } from './RankEmblem';
import ProgressMeter from './ProgressMeter';
import Icon from './Icon';
import { Badge, Loading } from './ui';
import { t } from '../lib/locale';
import { cn } from '../lib/utils';

const RANK_THEMES = {
  bronze: {
    title: 'text-[#a95f32] dark:text-[#f5d6ad]',
    card: 'border-[#a95f32]/40 bg-gradient-to-br from-[#fcf0e4] to-card dark:from-[#a95f32]/20 dark:to-card',
    badge: 'bg-[#a95f32]/10 text-[#a95f32] border-[#a95f32]/25',
  },
  silver: {
    title: 'text-[#62788a] dark:text-[#e8f0f6]',
    card: 'border-[#62788a]/40 bg-gradient-to-br from-[#f0f4f7] to-card dark:from-[#62788a]/20 dark:to-card',
    badge: 'bg-[#62788a]/10 text-[#62788a] border-[#62788a]/25',
  },
  gold: {
    title: 'text-amber-700 dark:text-amber-300',
    card: 'border-amber-400/50 bg-gradient-to-br from-[#fff7da] to-card dark:from-amber-500/20 dark:to-card',
    badge: 'bg-amber-500/15 text-amber-700 border-amber-400/30 dark:text-amber-300',
  },
  platinum: {
    title: 'text-[#24826c] dark:text-[#bceee0]',
    card: 'border-emerald-500/40 bg-gradient-to-br from-[#e9f7f1] to-card dark:from-emerald-500/20 dark:to-card',
    badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30 dark:text-emerald-300',
  },
  diamond: {
    title: 'text-[#237d9d] dark:text-[#b9edff]',
    card: 'border-sky-500/40 bg-gradient-to-br from-[#eaf8fc] to-card dark:from-sky-500/20 dark:to-card',
    badge: 'bg-sky-500/15 text-sky-700 border-sky-400/30 dark:text-sky-300',
  },
  master: {
    title: 'text-[#c65316] dark:text-[#ffce77]',
    card: 'border-orange-500/40 bg-gradient-to-br from-[#fff0e4] to-card dark:from-orange-500/20 dark:to-card',
    badge: 'bg-orange-500/15 text-orange-700 border-orange-400/30 dark:text-orange-300',
  },
};

export default function SurvivalPlayerCard({ stats, user }) {
  if (!stats) return <Loading />;
  const levelStart = 100 * (stats.level - 1) ** 2;
  const tier = getRankTier(stats.rank);
  const theme = RANK_THEMES[tier.id] || RANK_THEMES.bronze;

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

      {/* Rank Rating Card */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border p-3.5 shadow-2xs transition-all',
          theme.card,
        )}
      >
        <RankEmblem rank={stats.rank} decorative className="h-12! w-10! shrink-0 drop-shadow-xs" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <b className={cn('block font-heading text-base font-black tracking-tight truncate', theme.title)}>
              {stats.rank}
            </b>
            <span className={cn('rounded-full px-2 py-0.5 font-mono text-[9px] font-bold border leading-tight shrink-0', theme.badge)}>
              Hạng
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <b className="font-mono text-lg font-black text-foreground">{stats.rating}</b>
            <span className="text-[11px] font-medium text-muted-foreground">rating</span>
          </div>
        </div>
      </div>

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
