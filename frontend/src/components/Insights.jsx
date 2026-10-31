import ProgressMeter from './ProgressMeter';
import React from 'react';
import { t } from '../lib/locale';
import { cn } from '../lib/utils';
const metricTones = {
  total:
    'border-border/80 hover:border-emerald-500/40 hover:bg-emerald-50/15 aria-pressed:border-emerald-600 aria-pressed:bg-emerald-50/30 aria-pressed:ring-1 aria-pressed:ring-emerald-500/20 [&_.stat-card-icon]:text-emerald-700 dark:[&_.stat-card-icon]:text-emerald-400 [&_.stat-card-value]:text-foreground',
  ac: 'border-border/80 hover:border-emerald-500/40 hover:bg-emerald-50/15 aria-pressed:border-emerald-600 aria-pressed:bg-emerald-50/30 aria-pressed:ring-1 aria-pressed:ring-emerald-500/20 [&_.stat-card-icon]:text-emerald-700 dark:[&_.stat-card-icon]:text-emerald-400 [&_.stat-card-value]:text-emerald-700 dark:[&_.stat-card-value]:text-emerald-300',
  star: 'border-border/80 hover:border-amber-500/40 hover:bg-amber-50/15 aria-pressed:border-amber-500 aria-pressed:bg-amber-50/30 aria-pressed:ring-1 aria-pressed:ring-amber-500/20 [&_.stat-card-icon]:text-amber-600 dark:[&_.stat-card-icon]:text-amber-400 [&_.stat-card-value]:text-amber-700 dark:[&_.stat-card-value]:text-amber-300',
  category:
    'border-border/80 hover:border-orange-500/40 hover:bg-orange-50/15 aria-pressed:border-orange-500 aria-pressed:bg-orange-50/30 aria-pressed:ring-1 aria-pressed:ring-orange-500/20 [&_.stat-card-icon]:text-orange-600 dark:[&_.stat-card-icon]:text-orange-400 [&_.stat-card-value]:text-orange-700 dark:[&_.stat-card-value]:text-orange-300',
  live: 'border-border/80 hover:border-emerald-500/40 hover:bg-emerald-50/15 aria-pressed:border-emerald-600 aria-pressed:bg-emerald-50/30 aria-pressed:ring-1 aria-pressed:ring-emerald-500/20 [&_.stat-card-icon]:text-emerald-700 dark:[&_.stat-card-icon]:text-emerald-400 [&_.stat-card-value]:text-emerald-700 dark:[&_.stat-card-value]:text-emerald-300',
  upcoming:
    'border-border/80 hover:border-orange-500/40 hover:bg-orange-50/15 aria-pressed:border-orange-500 aria-pressed:bg-orange-50/30 aria-pressed:ring-1 aria-pressed:ring-orange-500/20 [&_.stat-card-icon]:text-orange-600 dark:[&_.stat-card-icon]:text-orange-400 [&_.stat-card-value]:text-orange-700 dark:[&_.stat-card-value]:text-orange-300',
  joined:
    'border-border/80 hover:border-amber-500/40 hover:bg-amber-50/15 aria-pressed:border-amber-500 aria-pressed:bg-amber-50/30 aria-pressed:ring-1 aria-pressed:ring-amber-500/20 [&_.stat-card-icon]:text-amber-600 dark:[&_.stat-card-icon]:text-amber-400 [&_.stat-card-value]:text-amber-700 dark:[&_.stat-card-value]:text-amber-300',
  pending:
    'border-border/80 hover:border-orange-500/40 hover:bg-orange-50/15 aria-pressed:border-orange-500 aria-pressed:bg-orange-50/30 aria-pressed:ring-1 aria-pressed:ring-orange-500/20 [&_.stat-card-icon]:text-orange-600 dark:[&_.stat-card-icon]:text-orange-400 [&_.stat-card-value]:text-orange-700 dark:[&_.stat-card-value]:text-orange-300',
  score:
    'border-border/80 hover:border-amber-500/40 hover:bg-amber-50/15 aria-pressed:border-amber-500 aria-pressed:bg-amber-50/30 aria-pressed:ring-1 aria-pressed:ring-amber-500/20 [&_.stat-card-icon]:text-amber-600 dark:[&_.stat-card-icon]:text-amber-400 [&_.stat-card-value]:text-amber-700 dark:[&_.stat-card-value]:text-amber-300',
};
export { useServerTime as useNow } from '../hooks/use-server-time';
export function StatGrid({ items, label = 'Tổng quan', className = '' }) {
  return (
    <section
      className={'stat-grid grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4 ' + (className || '')}
      aria-label={t(label)}
    >
      {items.map(({ label, value, note, tone, icon, badge, onClick, active }, i) => (
        <div
          className={cn(
            'stat-card flex items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5 shadow-xs transition-all',
            tone,
            metricTones[tone] || metricTones.total,
            !className &&
              [
                'min-h-0 bg-action-soft/40 border-action/30 [&_.stat-card-value]:text-action-text',
                'min-h-0 bg-success-soft/40 border-success/30 [&_.stat-card-value]:text-success',
                'min-h-0 bg-warning-soft/40 border-gold/40 [&_.stat-card-value]:text-warning',
                'min-h-0 bg-card border-primary/30',
              ][i % 4],
            !className &&
              '[&_.stat-card-label]:text-xs [&_.stat-card-label]:font-normal [&_.stat-card-label]:normal-case [&_.stat-card-label]:tracking-normal [&_.stat-card-value]:text-lg [&_.stat-card-value]:font-semibold',
            active && 'is-active',
            onClick &&
              'is-clickable cursor-pointer hover:border-foreground/25 hover:shadow-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          key={i}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
          aria-pressed={onClick ? !!active : undefined}
          onKeyDown={
            onClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                  }
                }
              : undefined
          }
        >
          {icon && (
            <span
              className="stat-card-icon flex shrink-0 items-center justify-center [&_svg]:size-6 sm:[&_svg]:size-6.5 [&_svg]:stroke-[2.5]"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="stat-card-head flex items-center justify-between gap-1">
              <span className="stat-card-label text-[10px] sm:text-[11px] font-bold tracking-wider text-muted-foreground uppercase truncate">
                {t(label)}
              </span>
              {badge && (
                <span className="stat-card-badge shrink-0 rounded-full bg-accent px-1.5 py-0.2 text-[10px] font-semibold text-accent-foreground">
                  {badge}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <strong className="stat-card-value font-heading text-lg sm:text-xl font-extrabold tracking-tight tabular-nums leading-none">
                {value ?? '—'}
              </strong>
              {note && (
                <small className="stat-card-note text-[11px] text-muted-foreground/80 truncate">
                  {t(note)}
                </small>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
export function InsightPanel({ title, action, children, className = '' }) {
  return (
    <section
      className={
        'paper rounded-xl border bg-card text-card-foreground shadow-xs insight-panel p-3.5 sm:p-4 ' +
        className
      }
    >
      <div className="insight-panel-head mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 [&_h2]:font-heading [&_h2]:text-xs sm:[&_h2]:text-sm [&_h2]:font-bold [&_h2]:tracking-tight">
        <h2>{t(title)}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
const levelTones = {
  1: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  2: 'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-400',
  3: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  4: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  5: 'border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-400',
  6: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
};

export function ProgressRows({ items, empty = 'Chưa có dữ liệu.' }) {
  return !items.length ? (
    <p className="muted text-xs leading-relaxed text-muted-foreground py-2">{t(empty)}</p>
  ) : (
    <div className="progress-rows grid grid-cols-1 min-[480px]:grid-cols-2 gap-2 text-xs">
      {items.map((c, i) => (
        <div
          key={c.id || i}
          className={
            'progress-row-item rounded-lg border border-border/60 bg-muted/20 p-2 transition-all space-y-1' +
            (c.onClick
              ? ' is-clickable cursor-pointer hover:bg-muted/60 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              : '')
          }
          onClick={c.onClick}
          role={c.onClick ? 'button' : undefined}
          tabIndex={c.onClick ? 0 : undefined}
          onKeyDown={
            c.onClick
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    c.onClick();
                  }
                }
              : undefined
          }
        >
          <div className="inline-group between flex items-center justify-between gap-1.5">
            <span className="truncate text-xs font-semibold text-foreground capitalize" data-user-content>
              {c.name}
            </span>
            <small className="shrink-0 font-mono text-[10px] font-bold tabular-nums">
              <span className={c.value > 0 ? 'text-action font-bold' : 'text-muted-foreground'}>{c.value}</span>
              <span className="text-muted-foreground/60 font-normal"> / {c.total}</span>
            </small>
          </div>
          <ProgressMeter
            aria-label={c.name}
            data-verdict={c.name}
            value={c.value}
            max={Math.max(1, c.total)}
            className="h-1.5 [&_[data-slot=progress-indicator]]:bg-action [&>div]:bg-action"
            indicatorClassName="bg-action"
          />
        </div>
      ))}
    </div>
  );
}
export function ProblemPicks({ items }) {
  return (
    <ol className="problem-picks space-y-1.5 text-xs">
      {items.map((p, i) => (
        <li key={p.id}>
          <a
            href={'#/solve/' + p.id}
            className="group flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 px-2.5 py-1.5 transition-all hover:bg-muted/60 hover:border-primary/40"
            data-user-content
          >
            <span className="pick-number flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 font-mono text-[10px] font-bold text-primary">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0 flex-1 truncate">
              <span
                className="block truncate text-xs font-semibold text-foreground transition-colors group-hover:text-primary"
                data-user-content
              >
                {p.title}
              </span>
              <div
                className="flex items-center gap-1.5 text-[10px] leading-tight truncate mt-0.5"
                data-user-content
              >
                <span className="font-mono font-bold text-action">{p.publicId}</span>
                <span className="text-muted-foreground/40 font-normal">•</span>
                <span className="text-muted-foreground">{p.category}</span>
              </div>
            </div>
            <span
              className={cn(
                'badge inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold border shadow-2xs',
                levelTones[p.difficulty] || 'border-border bg-muted text-muted-foreground',
                'level-' + p.difficulty,
              )}
            >
              {t('Mức')} {p.difficulty}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
