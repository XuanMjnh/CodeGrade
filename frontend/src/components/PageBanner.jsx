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
        'heading page-banner rich-banner relative grid items-center gap-6 overflow-hidden rounded-[14px] border bg-linear-[115deg,var(--action-soft),white_45%,white_70%,var(--success-soft)] p-6 shadow-panel sm:p-8 min-[681px]:grid-cols-[minmax(0,1fr)_minmax(180px,.45fr)]',
        `banner-${kind} ${kind}-banner`,
        kind === 'practice' && 'practice-banner',
        rich &&
          'bg-linear-[135deg,white_0%,white_45%,#f4fbf6_100%] sm:px-10 sm:py-[34px] min-[681px]:grid-cols-[minmax(0,1.4fr)_minmax(280px,.95fr)]',
        kind === 'submissions' && 'bg-linear-[135deg,white_0%,white_45%,#f4f7fb_100%]',
      )}
      aria-label={t(label)}
    >
      <div className="banner-copy relative z-10 flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            'eyebrow banner-kicker mb-4 inline-flex w-fit items-center gap-2 text-xs font-semibold tracking-[.08em] text-muted-foreground',
            rich &&
              'mb-4 rounded-full border border-success/20 bg-success-soft px-3 py-[5px] font-mono text-[10px] text-success',
          )}
        >
          CODEGRADE <span aria-hidden="true">/</span> {t(label)}
        </span>
        <h1
          className="max-w-[24ch] font-heading text-[28px] leading-[1.15] font-extrabold tracking-[-.045em] break-words sm:text-[36px] min-[1440px]:text-[40px]"
          data-user-content={kind === 'workspace' ? true : undefined}
        >
          {title}
        </h1>
        {children && (
          <p className="mt-4 max-w-[60ch] text-sm leading-[1.7] text-muted-foreground">
            {children}
          </p>
        )}
        {action && (
          <div className="banner-actions mt-6 flex flex-wrap items-center gap-3 [&_.primary]:bg-action [&_.primary]:text-white [&_.primary]:hover:bg-action-hover [&_.secondary]:text-success [&_.banner-text-link]:text-action-text">
            {action}
          </div>
        )}
      </div>
      <Feature
        {...(highlight?.onClick
          ? { type: 'button', variant: 'ghost', onClick: highlight.onClick }
          : {})}
        className={cn(
          'banner-feature relative z-10 flex h-auto min-h-[156px] min-w-0 flex-col items-start justify-between gap-0 overflow-hidden rounded-[14px] border border-inverse bg-inverse p-6 text-left whitespace-normal text-white',
          rich &&
            'bg-linear-[145deg,#184e32_0%,#0d2f1d_100%] shadow-[0_10px_28px_rgb(13_47_29/.24)]',
          kind === 'submissions' && 'bg-linear-[145deg,#134e4a_0%,#0b3433_100%]',
          highlight?.onClick &&
            'is-clickable transition-transform hover:-translate-y-[3px] hover:bg-inverse hover:text-white focus-visible:ring-ring',
        )}
      >
        <span
          className="banner-symbol mb-3 inline-flex size-10 items-center justify-center rounded-[10px] border border-white/25 bg-white/18 text-white"
          aria-hidden="true"
        >
          <Icon name={icon} className="size-5" />
        </span>
        {highlight ? (
          <>
            <span className="banner-feature-label mb-1.5 text-[11px] font-bold tracking-[.1em] text-white/75 uppercase">
              {t(highlight.label)}
            </span>
            <strong
              className="max-w-full font-heading text-[26px] leading-[1.25] font-extrabold break-words"
              data-user-content={highlight.userContent ? true : undefined}
            >
              {highlight.value ?? '—'}
            </strong>
            {highlight.detail && (
              <small className="mt-2.5 rounded-full bg-[#86efac]/14 px-2.5 py-1 font-mono text-xs font-semibold text-[#86efac]">
                {t(highlight.detail)}
              </small>
            )}
          </>
        ) : (
          <strong className="font-heading text-lg font-bold">{t(label)}</strong>
        )}
        <div
          className="banner-decoration absolute top-6 right-6 flex h-8 items-end gap-[3px] opacity-30"
          aria-hidden="true"
        >
          <span className="h-4 w-[3px] rounded-full bg-[#86efac]" />
          <span className="h-8 w-[3px] rounded-full bg-[#86efac]" />
          <span className="h-6 w-[3px] rounded-full bg-[#86efac]" />
        </div>
      </Feature>
    </section>
  );
}
