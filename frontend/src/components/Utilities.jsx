import Icon from './Icon';
import { Button as UiButton } from './ui/button';
import { Input as UiInput } from './ui/input';
import { Label as UiLabel } from './ui/label';
import React, { useState, useEffect } from 'react';
import { t } from '../lib/locale';
import { cn } from '../lib/utils';
import { useResource, Loading, ErrorBox, go } from './ui';
function Timer() {
  const [seconds, S] = useState(0),
    [running, R] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => S((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <section className="timer-card rounded-xl border border-border/80 bg-card p-3.5 shadow-subtle">
      <div className="rail-title mb-2.5 flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="flex size-6 items-center justify-center rounded-md bg-action/10 text-action">
            <Icon name="clock" className="size-3.5" />
          </span>
          <h3 className="font-heading text-xs font-bold tracking-tight text-foreground">
            {t('Bộ đếm luyện tập')}
          </h3>
        </div>
      </div>

      <div className="my-2.5 flex flex-col items-center justify-center rounded-lg border border-action/20 bg-linear-to-b from-action-soft/60 to-action-soft/20 py-3 px-4 shadow-inner">
        <output className="study-timer flex items-baseline justify-center font-mono text-[30px] font-extrabold tracking-wider text-action-text tabular-nums leading-none">
          <span>{mins}</span>
          <span className={cn('mx-0.5 transition-opacity', running && 'animate-pulse')}>:</span>
          <span>{secs}</span>
        </output>
        <div className="mt-1 flex items-center justify-center gap-6 font-mono text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">
          <span>{t('Phút')}</span>
          <span>{t('Giây')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <UiButton
          size="sm"
          className={cn(
            'flex-1 h-8 gap-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all',
            running
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-action text-white hover:bg-action-hover active:bg-action-active',
          )}
          aria-pressed={running}
          onClick={() => R(!running)}
        >
          <Icon name={running ? 'pause' : 'play'} className="size-3" />
          {t(running ? 'Tạm dừng' : 'Bắt đầu')}
        </UiButton>
        <UiButton
          size="sm"
          variant="outline"
          className="h-8 gap-1 rounded-lg border-border px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          disabled={seconds === 0 && !running}
          onClick={() => {
            R(false);
            S(0);
          }}
        >
          <Icon name="clock-rotate-left" className="size-3" />
          {t('Đặt lại')}
        </UiButton>
      </div>
    </section>
  );
}

const RANK_STYLES = [
  {
    badge: 'border border-amber-300 bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-700',
    text: 'text-amber-700 dark:text-amber-300',
    score: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
  },
  {
    badge: 'border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-700',
    text: 'text-emerald-700 dark:text-emerald-300',
    score: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    badge: 'border border-orange-300 bg-orange-100 text-orange-800 dark:bg-orange-950/70 dark:text-orange-200 dark:border-orange-700',
    text: 'text-orange-700 dark:text-orange-300',
    score: 'bg-orange-50 text-orange-800 border-orange-200/80 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
  },
];

export default function Utilities({ side, revision }) {
  const [problems, error] = useResource(side === 'right' ? 'PROBLEMS' : null, {}, revision),
    [categories, categoryError] = useResource(side === 'right' ? 'CATEGORIES' : null, {}, revision),
    [rank, rankError] = useResource(
      side === 'right' ? 'LEADERBOARD' : null,
      {
        metric: 'elo',
      },
      revision,
    ),
    [search, S] = useState('');
  const [bookmarkRevision, B] = useState(0);
  useEffect(() => {
    const update = () => B((v) => v + 1);
    window.addEventListener('cg-bookmarks-changed', update);
    return () => window.removeEventListener('cg-bookmarks-changed', update);
  }, []);
  const [stars, starError] = useResource(
    side === 'left' ? 'PROBLEMS' : null,
    {},
    revision + bookmarkRevision,
  );
  const favorites = (stars || []).filter((p) => p.starred);
  return (
    <aside
      className={
        'utility-rail space-y-4 text-xs [&>section]:rounded-xl [&>section]:border [&>section]:border-t-[3px] [&>section]:border-t-primary [&>section]:bg-card [&>section]:p-3.5 sm:[&>section]:p-4 [&>section]:shadow-subtle [&_h3]:font-heading [&_h3]:text-xs sm:[&_h3]:text-[13px] [&_h3]:font-bold [&_h3]:text-foreground [&>.timer-card]:border-t-action ' +
        side
      }
      aria-label={t(side === 'left' ? 'Tiện ích luyện tập' : 'Thống kê cộng đồng')}
    >
      {side === 'left' ? (
        <>
          <Timer />
          <section className="favorites-card space-y-3 rounded-xl border bg-card p-3.5 shadow-subtle">
            <div className="rail-title mb-2.5 flex items-center justify-between gap-2 border-b border-border/50 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="flex size-6 items-center justify-center rounded-md bg-amber-50 text-amber-500">
                  <Icon name="star" className="size-3.5 fill-amber-400 text-amber-500" />
                </span>
                <h3 className="font-heading text-xs font-bold tracking-tight text-foreground">
                  {t('Bài yêu thích')}
                </h3>
              </div>
              <span className="rail-total ml-auto inline-flex items-center justify-center rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-700 ring-1 ring-amber-400/30">
                {favorites.length}
              </span>
            </div>
            <ErrorBox error={starError} />
            {!stars ? (
              <Loading />
            ) : favorites.length ? (
              <ul className="favorite-list divide-y divide-border/50 text-xs">
                {favorites.map((p) => (
                  <li key={p.id}>
                    <a
                      href={'#/solve/' + p.id}
                      className="group flex items-start gap-2.5 rounded-lg py-2 px-1 text-foreground transition-all hover:bg-muted/70 hover:text-success"
                      data-user-content
                    >
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center text-amber-400 transition-transform group-hover:scale-110">
                        <Icon
                          name="star"
                          className="size-3.5 fill-amber-400 text-amber-500"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <small className="favorite-code block font-mono text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                          {p.publicId}
                        </small>
                        <span className="block truncate text-xs font-medium text-foreground transition-colors group-hover:text-success">
                          {p.title}
                        </span>
                      </span>
                      <Icon
                        name="chevron-right"
                        className="mt-1 size-3 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rail-empty py-5 text-center text-muted-foreground">
                <Icon
                  name="star"
                  className="mx-auto mb-1.5 size-5 text-muted-foreground/30"
                  aria-hidden="true"
                />
                <p className="text-xs leading-relaxed">{t('Đánh dấu sao để lưu bài tại đây.')}</p>
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="category-stats space-y-3 rounded-xl border bg-card !p-3 shadow-subtle">
            <div className="rail-title mb-2.5 flex items-center justify-between gap-2 border-b border-border/50 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="flex size-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <Icon name="fa-solid fa-layer-group" className="size-3.5" />
                </span>
                <h3 className="font-heading text-xs font-bold tracking-tight text-foreground">
                  {t('Bài theo danh mục')}
                </h3>
              </div>
              <span className="rail-total ml-auto inline-flex items-center justify-center rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-950/50 dark:text-emerald-300">
                {problems?.length || 0}
              </span>
            </div>
            <UiLabel className="rail-search mb-4 flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1 text-muted-foreground transition-colors focus-within:border-emerald-500/50 focus-within:bg-card focus-within:ring-1 focus-within:ring-emerald-500/20 [&_input]:border-0 [&_input]:bg-transparent [&_input]:p-0 [&_input]:text-xs [&_input]:shadow-none">
              <Icon name="fa-solid fa-magnifying-glass" className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
              <UiInput
                type="search"
                aria-label={t('Tìm danh mục')}
                placeholder={t('Tìm danh mục…')}
                value={search}
                onChange={(e) => S(e.target.value)}
                className="h-7 text-xs"
              />
            </UiLabel>
            <ErrorBox error={error || categoryError} />
            {!categories || !problems ? (
              <Loading />
            ) : (
              <div className="category-chips flex flex-wrap gap-1.5">
                {categories
                  .filter((c) =>
                    c.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')),
                  )
                  .map((c) => {
                    const count = problems.filter((p) => p.category_id === c.id).length;
                    return (
                      <UiButton
                        key={c.id}
                        onClick={() => go('/practice?category=' + encodeURIComponent(c.id))}
                        variant="ghost"
                        size="sm"
                        className="category-chip h-[26px] rounded-full border-0 bg-muted/65 px-2.5 text-[11px] font-medium text-foreground/85 transition-all hover:bg-muted hover:text-foreground shadow-none gap-1.5 focus-visible:ring-1"
                      >
                        <span data-user-content className="truncate">{c.name}</span>
                        <b className="inline-flex items-center justify-center rounded-full bg-action px-1.5 h-4 min-w-4 text-[10px] font-semibold text-white leading-none shrink-0 shadow-none">
                          {count}
                        </b>
                      </UiButton>
                    );
                  })}
              </div>
            )}
            {categories &&
              !categories.some((c) =>
                c.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')),
              ) && (
                <p className="rail-empty text-sm leading-relaxed text-muted-foreground">
                  {t('Không tìm thấy danh mục.')}
                </p>
              )}
          </section>
          <section className="elo-card space-y-3 rounded-xl border bg-card p-3.5 shadow-subtle">
            <div className="rail-title mb-2.5 flex items-center justify-between gap-2 border-b border-border/50 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="flex size-6 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  <Icon name="fa-solid fa-trophy" className="size-3.5" />
                </span>
                <h3 className="font-heading text-xs font-bold tracking-tight text-foreground">
                  {t('Top Elo Contest')}
                </h3>
              </div>
              <a
                href="#/leaderboard"
                aria-label={t('Xem toàn bộ bảng xếp hạng')}
                className="text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                <Icon name="fa-solid fa-arrow-up-right-from-square" className="size-3.5" aria-hidden="true" />
              </a>
            </div>
            <ErrorBox error={rankError} />
            {!rank ? (
              <Loading />
            ) : rank.length ? (
              <ol className="elo-list divide-y divide-border/50 text-xs">
                {rank.slice(0, 5).map((u, i) => {
                  const style = RANK_STYLES[i];
                  return (
                    <li
                      key={u.id}
                      className="group flex items-center gap-2.5 py-2.5 px-1.5 -mx-1.5 rounded-lg transition-colors hover:bg-muted/40"
                    >
                      <span
                        className={cn(
                          'elo-position flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold shadow-2xs',
                          style
                            ? style.badge
                            : 'bg-muted/70 text-muted-foreground border border-border/70',
                          'position-' + (i + 1),
                        )}
                      >
                        {i === 0 ? (
                          <>
                            <Icon name="fa-solid fa-trophy" className="size-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                            <span className="sr-only">1</span>
                          </>
                        ) : (
                          <span className={cn('font-bold', style?.text || 'text-muted-foreground')}>
                            {i + 1}
                          </span>
                        )}
                      </span>
                      <span className="elo-person min-w-0 flex-1">
                        <b
                          data-user-content
                          className="block truncate text-xs font-semibold text-foreground group-hover:text-primary transition-colors"
                        >
                          {u.display_name}
                        </b>
                        <small data-user-content className="block truncate text-[11px] text-muted-foreground">
                          @{u.username}
                        </small>
                      </span>
                      <strong
                        className={cn(
                          'elo-score shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-bold tabular-nums border shadow-2xs',
                          style?.score || 'bg-muted/50 text-muted-foreground border-border/50 font-semibold',
                        )}
                      >
                        {u.elo}
                      </strong>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="rail-empty text-sm leading-relaxed text-muted-foreground">
                {t('Chưa có Coder trong bảng xếp hạng.')}
              </p>
            )}
          </section>
        </>
      )}
    </aside>
  );
}
