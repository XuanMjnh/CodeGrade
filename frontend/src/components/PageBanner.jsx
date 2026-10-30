import React from 'react';
import { t } from '../lib/locale';
import { cn } from '../lib/utils';
import Icon from './Icon';
import { Button } from './ui/button';
const themes = {
  room: ['bolt', 'Phòng thi đấu'],
  practice: ['code', 'Luyện tập'],
  survival: ['bolt', 'Code Survival'],
  contest: ['flag-checkered', 'Contest'],
  leaderboard: ['trophy', 'Xếp hạng'],
  submissions: ['chart-simple', 'Bài nộp'],
  profile: ['user', 'Tài khoản'],
  announcements: ['bullhorn', 'Thông báo'],
  categories: ['layer-group', 'Danh mục'],
  admin: ['shield-halved', 'Quản trị'],
  editor: ['pen-to-square', 'Soạn đề'],
  workspace: ['terminal', 'Giải bài'],
};
export default function PageBanner({ kind = 'practice', title, children, action, highlight, className }) {
  const [icon, label] = themes[kind] || themes.practice;
  const rich = ['practice', 'contest', 'submissions'].includes(kind);
  const Feature = highlight?.onClick ? Button : 'div';
  return (
    <section
      className={cn(
        'heading page-banner rich-banner relative flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-5 overflow-hidden rounded-2xl border border-border/80 bg-card p-3.5 sm:px-5 sm:py-3.5 shadow-subtle',
        `banner-${kind} ${kind}-banner`,
        kind === 'practice' && 'practice-banner bg-gradient-to-r from-card via-card to-emerald-50/40',
        rich && 'bg-gradient-to-r from-card via-card to-emerald-50/40',
        kind === 'submissions' && 'bg-gradient-to-r from-card via-card to-teal-50/40',
        className,
      )}
      aria-label={t(label)}
    >
      <div className="banner-copy relative z-10 flex min-w-0 flex-1 flex-col justify-center">
        <div className="mb-1 flex items-center gap-2">
          <span
            className={cn(
              'eyebrow banner-kicker inline-flex w-fit items-center gap-1.5 rounded-full border border-success/25 bg-success-soft/90 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-success uppercase',
            )}
          >
            CODEGRADE <span aria-hidden="true" className="opacity-40">/</span> {t(label)}
          </span>
        </div>
        <h1
          className="font-heading text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight break-words"
          data-user-content={kind === 'workspace' ? true : undefined}
        >
          {title}
        </h1>
        {children && (
          <p className="mt-0.5 max-w-[65ch] text-xs sm:text-[13px] leading-relaxed text-muted-foreground line-clamp-2 sm:line-clamp-1">
            {children}
          </p>
        )}
        {action && (
          <div className="banner-actions mt-2 flex flex-wrap items-center gap-2 [&_.primary]:bg-action [&_.primary]:text-white [&_.primary]:hover:bg-action-hover [&_.secondary]:text-foreground [&_.banner-text-link]:text-action-text">
            {action}
          </div>
        )}
      </div>
      <Feature
        {...(highlight?.onClick
          ? { type: 'button', variant: 'ghost', onClick: highlight.onClick }
          : {})}
        className={cn(
          'banner-feature group relative z-10 flex h-auto shrink-0 items-center justify-start gap-3 rounded-xl border border-border/80 bg-card p-2 px-3 sm:px-3.5 text-left font-normal whitespace-normal transition-all duration-150 shadow-2xs hover:shadow-xs',
          rich &&
            'border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 text-card-foreground hover:border-emerald-300',
          kind === 'submissions' &&
            'border-teal-200/90 bg-gradient-to-br from-teal-50/80 via-white to-teal-50/40 text-card-foreground hover:border-teal-300',
          highlight?.onClick &&
            'is-clickable cursor-pointer hover:bg-emerald-50/60 active:scale-[0.98] focus-visible:ring-1 focus-visible:ring-ring',
        )}
      >
        <span
          className={cn(
            'banner-symbol inline-flex size-9 shrink-0 items-center justify-center rounded-lg border text-white shadow-2xs',
            rich
              ? 'border-emerald-600 bg-emerald-600'
              : kind === 'submissions'
                ? 'border-teal-600 bg-teal-600'
                : 'border-primary bg-primary',
          )}
          aria-hidden="true"
        >
          <Icon name={icon} className="size-4" />
        </span>
        {highlight ? (
          <div className="flex min-w-0 flex-col justify-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="banner-feature-label truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {t(highlight.label)}
              </span>
              {highlight.detail && (
                <span className="shrink-0 rounded-full border border-emerald-200/80 bg-emerald-100/80 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-800">
                  {t(highlight.detail)}
                </span>
              )}
            </div>
            <strong
              className="truncate font-heading text-lg sm:text-xl font-black tracking-tight text-foreground leading-none"
              data-user-content={highlight.userContent ? true : undefined}
            >
              {highlight.value ?? '—'}
            </strong>
          </div>
        ) : (
          <strong className="font-heading text-sm font-bold text-foreground">{t(label)}</strong>
        )}
        {highlight?.onClick && (
          <span
            className="ml-1 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-700"
            aria-hidden="true"
          >
            <Icon name="arrow-right" className="size-3.5" />
          </span>
        )}
        <div className="banner-decoration hidden" aria-hidden="true" />
      </Feature>
    </section>
  );
}
