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
export default function PageBanner({ kind = 'practice', title, children, action, highlight }) {
  const [icon, label] = themes[kind] || themes.practice;
  const rich = ['practice', 'contest', 'submissions'].includes(kind);
  const Feature = highlight?.onClick ? Button : 'div';
  return (
    <section
      className={cn(
        'heading page-banner rich-banner relative grid items-center gap-5 overflow-hidden rounded-xl border bg-linear-[115deg,var(--action-soft),white_45%,white_70%,var(--success-soft)] p-5 shadow-panel sm:p-6 min-[681px]:grid-cols-[minmax(0,1fr)_auto]',
        `banner-${kind} ${kind}-banner`,
        kind === 'practice' && 'practice-banner',
        rich &&
          'bg-linear-[135deg,white_0%,white_45%,#f4fbf6_100%] sm:px-6 sm:py-5 min-[1440px]:px-7 min-[1440px]:py-5.5',
        kind === 'submissions' && 'bg-linear-[135deg,white_0%,white_45%,#f4f7fb_100%]',
      )}
      aria-label={t(label)}
    >
      <div className="banner-copy relative z-10 flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            'eyebrow banner-kicker mb-2.5 inline-flex w-fit items-center gap-1.5 text-xs font-semibold tracking-[.08em] text-muted-foreground',
            rich &&
              'mb-2.5 rounded-full border border-success/20 bg-success-soft px-2.5 py-1 font-mono text-[10px] text-success',
          )}
        >
          CODEGRADE <span aria-hidden="true">/</span> {t(label)}
        </span>
        <h1
          className="max-w-[28ch] font-heading text-2xl sm:text-[28px] min-[1440px]:text-[32px] leading-tight font-extrabold tracking-tight break-words"
          data-user-content={kind === 'workspace' ? true : undefined}
        >
          {title}
        </h1>
        {children && (
          <p className="mt-1.5 max-w-[60ch] text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {children}
          </p>
        )}
        {action && (
          <div className="banner-actions mt-3.5 flex flex-wrap items-center gap-2.5 [&_.primary]:bg-action [&_.primary]:text-white [&_.primary]:hover:bg-action-hover [&_.secondary]:text-success [&_.banner-text-link]:text-action-text">
            {action}
          </div>
        )}
      </div>
      <Feature
        {...(highlight?.onClick
          ? { type: 'button', variant: 'ghost', onClick: highlight.onClick }
          : {})}
        className={cn(
          'banner-feature relative z-10 flex h-auto min-h-[110px] w-full min-[681px]:w-[240px] min-[1280px]:w-[260px] min-w-0 flex-col items-start justify-between gap-1 overflow-hidden rounded-xl border border-inverse bg-inverse p-4 sm:p-4.5 text-left whitespace-normal text-white shadow-xs',
          rich &&
            'bg-linear-[145deg,#184e32_0%,#0d2f1d_100%] shadow-[0_8px_20px_rgb(13_47_29/.2)]',
          kind === 'submissions' && 'bg-linear-[145deg,#134e4a_0%,#0b3433_100%]',
          highlight?.onClick &&
            'is-clickable transition-transform hover:-translate-y-0.5 hover:bg-inverse hover:text-white focus-visible:ring-ring',
        )}
      >
        <div className="flex w-full items-center justify-between mb-1">
          <span
            className="banner-symbol inline-flex size-8 items-center justify-center rounded-lg border border-white/20 bg-white/15 text-white"
            aria-hidden="true"
          >
            <Icon name={icon} className="size-4" />
          </span>
          <div
            className="banner-decoration flex h-5 items-end gap-[2.5px] opacity-35"
            aria-hidden="true"
          >
            <span className="h-2.5 w-[2.5px] rounded-full bg-[#86efac]" />
            <span className="h-5 w-[2.5px] rounded-full bg-[#86efac]" />
            <span className="h-3.5 w-[2.5px] rounded-full bg-[#86efac]" />
          </div>
        </div>
        {highlight ? (
          <div className="flex flex-col gap-0.5 w-full">
            <span className="banner-feature-label text-[10px] font-bold tracking-[.08em] text-white/75 uppercase">
              {t(highlight.label)}
            </span>
            <strong
              className="max-w-full font-heading text-xl sm:text-2xl font-extrabold tracking-tight leading-tight break-words"
              data-user-content={highlight.userContent ? true : undefined}
            >
              {highlight.value ?? '—'}
            </strong>
            {highlight.detail && (
              <small className="mt-1.5 w-fit rounded-full bg-[#86efac]/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#86efac]">
                {t(highlight.detail)}
              </small>
            )}
          </div>
        ) : (
          <strong className="font-heading text-base font-bold">{t(label)}</strong>
        )}
      </Feature>
    </section>
  );
}
