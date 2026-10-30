import ProgressMeter from './ProgressMeter';
import React from 'react';
import { t } from '../lib/locale';
import { cn } from '../lib/utils';
const metricTones = {
  total:
    'border-t-[#3b82f6] [&_.stat-card-icon]:bg-blue-50 [&_.stat-card-icon]:text-blue-600 aria-pressed:border-blue-400 aria-pressed:bg-linear-to-b aria-pressed:from-blue-50/60 aria-pressed:to-card aria-pressed:ring-1 aria-pressed:ring-blue-300',
  ac: 'border-t-success [&_.stat-card-icon]:bg-success-soft [&_.stat-card-icon]:text-success [&_.stat-card-value]:text-success aria-pressed:border-success aria-pressed:bg-success-soft',
  star: 'border-t-orange-500 [&_.stat-card-icon]:bg-orange-50 [&_.stat-card-icon]:text-orange-600 [&_.stat-card-value]:text-amber-700 aria-pressed:border-orange-500 aria-pressed:bg-orange-50',
  category:
    'border-t-violet-500 [&_.stat-card-icon]:bg-violet-50 [&_.stat-card-icon]:text-violet-600',
  live: 'border-t-success [&_.stat-card-icon]:bg-success-soft [&_.stat-card-icon]:text-success [&_.stat-card-value]:text-success',
  upcoming:
    'border-t-action [&_.stat-card-icon]:bg-action-soft [&_.stat-card-icon]:text-action-text',
  joined: 'border-t-warning [&_.stat-card-icon]:bg-warning-soft [&_.stat-card-icon]:text-warning',
  pending:
    'border-t-input [&_.stat-card-icon]:bg-muted [&_.stat-card-icon]:text-muted-foreground [&_.stat-card-value]:text-muted-foreground',
};
export { useServerTime as useNow } from '../hooks/use-server-time';
export function StatGrid({ items, label = 'Tổng quan', className = '' }) {
  return (
    <section
      className={'stat-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4 ' + (className || '')}
      aria-label={t(label)}
    >
      {items.map(({ label, value, note, tone, icon, badge, onClick, active }, i) => (
        <div
          className={cn(
            'stat-card flex min-h-32 min-w-0 flex-col justify-between gap-3 rounded-[14px] border border-t-[3px] bg-card p-5 shadow-subtle',
            tone,
            metricTones[tone] || metricTones.total,
            !className &&
              [
                'min-h-0 bg-action-soft border-t-action [&_.stat-card-value]:text-action-text',
                'min-h-0 bg-success-soft border-t-success [&_.stat-card-value]:text-success',
                'min-h-0 bg-warning-soft border-gold border-t-gold [&_.stat-card-value]:text-warning',
                'min-h-0 bg-card border-t-primary',
              ][i % 4],
            !className &&
              '[&_.stat-card-label]:text-sm [&_.stat-card-label]:font-normal [&_.stat-card-label]:normal-case [&_.stat-card-label]:tracking-normal [&_.stat-card-value]:text-[28px] [&_.stat-card-value]:font-semibold',
            active && 'is-active',
            onClick &&
              'is-clickable cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
          <div className="stat-card-head flex items-center gap-2.5">
            {icon && (
              <span
                className="stat-card-icon flex size-[38px] shrink-0 items-center justify-center rounded-md border border-current/10"
                aria-hidden="true"
              >
                {icon}
              </span>
            )}
            <span className="stat-card-label text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
              {t(label)}
            </span>
            {badge && (
              <span className="stat-card-badge ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                {badge}
              </span>
            )}
          </div>
          <strong className="stat-card-value block font-heading text-[30px] leading-tight font-extrabold tracking-tight tabular-nums">
            {value ?? '—'}
          </strong>
          {note && (
            <small className="stat-card-note block text-[11px] text-muted-foreground">
              {t(note)}
            </small>
          )}
        </div>
      ))}
    </section>
  );
}
export function InsightPanel({ title, action, children, className = '' }) {
  return (
    <section
      className={
        'paper rounded-[14px] border bg-card text-card-foreground shadow-subtle insight-panel space-y-4 px-6 py-[22px] ' +
        className
      }
    >
      <div className="insight-panel-head mb-[18px] flex flex-wrap items-center justify-between gap-3 [&_h2]:font-heading [&_h2]:text-base [&_h2]:font-bold">
        <h2>{t(title)}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function ProgressRows({ items, empty = 'Chưa có dữ liệu.' }) {
  return !items.length ? (
    <p className="muted text-sm leading-relaxed text-muted-foreground">{t(empty)}</p>
  ) : (
    <div className="progress-rows space-y-5 text-xs [&_small]:text-muted-foreground">
      {items.map((c, i) => (
        <div
          key={c.id || i}
          className={
            'progress-row-item space-y-2' +
            (c.onClick
              ? ' is-clickable cursor-pointer transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
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
          <div className="inline-group between flex flex-wrap items-center justify-between gap-3">
            <span data-user-content>{c.name}</span>
            <small>
              {c.value} / {c.total}
            </small>
          </div>
          <ProgressMeter
            aria-label={c.name}
            data-verdict={c.name}
            value={c.value}
            max={Math.max(1, c.total)}
          />
        </div>
      ))}
    </div>
  );
}
export function ProblemPicks({ items }) {
  return (
    <ol className="problem-picks divide-y text-xs [&>li]:flex [&>li]:items-center [&>li]:gap-3 [&>li]:py-3 [&_a]:font-semibold [&_a]:text-foreground [&_small]:mt-1 [&_small]:block [&_small]:text-[11px] [&_small]:text-muted-foreground">
      {items.map((p, i) => (
        <li key={p.id}>
          <span className="pick-number flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted font-mono text-[10px]">
            {String(i + 1).padStart(2, '0')}
          </span>
          <div>
            <a href={'#/solve/' + p.id} data-user-content>
              {p.title}
            </a>
            <small data-user-content>
              {p.publicId} · {p.category}
            </small>
          </div>
          <span
            className={
              'badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium level-' +
              p.difficulty
            }
          >
            {t('Mức')} {p.difficulty}
          </span>
        </li>
      ))}
    </ol>
  );
}
