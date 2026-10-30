import ProgressMeter from './ProgressMeter';
import React from 'react';
import { t } from '../lib/locale';
import { cn } from '../lib/utils';
const metricTones = {
  total:
    'border-primary/20 [&_.stat-card-icon]:bg-primary/10 [&_.stat-card-icon]:text-primary [&_.stat-card-value]:text-foreground hover:border-primary/40 hover:bg-primary/5 aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:ring-2 aria-pressed:ring-primary/20',
  ac: 'border-emerald-500/20 [&_.stat-card-icon]:bg-emerald-500/10 [&_.stat-card-icon]:text-emerald-700 [&_.stat-card-value]:text-emerald-700 hover:border-emerald-400/40 hover:bg-emerald-50/20 aria-pressed:border-emerald-600 aria-pressed:bg-emerald-50/50 aria-pressed:ring-2 aria-pressed:ring-emerald-500/20',
  star: 'border-amber-500/20 [&_.stat-card-icon]:bg-amber-500/10 [&_.stat-card-icon]:text-amber-700 [&_.stat-card-value]:text-amber-700 hover:border-amber-400/40 hover:bg-amber-50/20 aria-pressed:border-amber-500 aria-pressed:bg-amber-50/50 aria-pressed:ring-2 aria-pressed:ring-amber-500/20',
  category:
    'border-border/80 [&_.stat-card-icon]:bg-muted [&_.stat-card-icon]:text-muted-foreground hover:border-border hover:bg-muted/30 aria-pressed:border-foreground/30 aria-pressed:ring-2 aria-pressed:ring-muted-foreground/20',
  live: 'border-emerald-500/20 [&_.stat-card-icon]:bg-emerald-500/10 [&_.stat-card-icon]:text-emerald-700 [&_.stat-card-value]:text-emerald-700 hover:border-emerald-400/40 hover:bg-emerald-50/20 aria-pressed:border-emerald-600 aria-pressed:bg-emerald-50/50 aria-pressed:ring-2 aria-pressed:ring-emerald-500/20',
  upcoming:
    'border-orange-500/20 [&_.stat-card-icon]:bg-orange-500/10 [&_.stat-card-icon]:text-orange-600 [&_.stat-card-value]:text-orange-600 hover:border-orange-400/40 hover:bg-orange-50/20 aria-pressed:border-orange-500 aria-pressed:bg-orange-50/40 aria-pressed:ring-2 aria-pressed:ring-orange-500/20',
  joined: 'border-amber-500/20 [&_.stat-card-icon]:bg-amber-500/10 [&_.stat-card-icon]:text-amber-700 [&_.stat-card-value]:text-amber-700 hover:border-amber-400/40 hover:bg-amber-50/20 aria-pressed:border-amber-500 aria-pressed:bg-amber-50/50 aria-pressed:ring-2 aria-pressed:ring-amber-500/20',
  pending:
    'border-orange-500/20 [&_.stat-card-icon]:bg-orange-500/10 [&_.stat-card-icon]:text-orange-600 [&_.stat-card-value]:text-orange-600 hover:border-orange-400/40 hover:bg-orange-50/20 aria-pressed:border-orange-500 aria-pressed:bg-orange-50/40 aria-pressed:ring-2 aria-pressed:ring-orange-500/20',
  score:
    'border-amber-500/20 [&_.stat-card-icon]:bg-amber-500/10 [&_.stat-card-icon]:text-amber-700 [&_.stat-card-value]:text-amber-700 hover:border-amber-400/40 hover:bg-amber-50/20 aria-pressed:border-amber-500 aria-pressed:bg-amber-50/50 aria-pressed:ring-2 aria-pressed:ring-amber-500/20',
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
              className="stat-card-icon flex size-8.5 shrink-0 items-center justify-center rounded-lg text-sm"
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
            <small className="shrink-0 font-mono text-[10px] font-bold text-muted-foreground tabular-nums">
              {c.value} / {c.total}
            </small>
          </div>
          <ProgressMeter
            aria-label={c.name}
            data-verdict={c.name}
            value={c.value}
            max={Math.max(1, c.total)}
            className="h-1"
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
              <small
                className="block truncate text-[10px] text-muted-foreground leading-tight"
                data-user-content
              >
                {p.publicId} · {p.category}
              </small>
            </div>
            <span
              className={
                'badge inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border level-' +
                p.difficulty
              }
            >
              {t('Mức')} {p.difficulty}
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
