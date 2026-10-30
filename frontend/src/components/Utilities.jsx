import Icon from './Icon';
import { Button as UiButton } from './ui/button';
import { Input as UiInput } from './ui/input';
import { Label as UiLabel } from './ui/label';
import React, { useState, useEffect } from 'react';
import { t } from '../lib/locale';
import { useResource, Loading, ErrorBox, go } from './ui';
function Timer() {
  const [seconds, S] = useState(0),
    [running, R] = useState(false);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => S((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return (
    <section className="timer-card space-y-3 rounded-[14px] border bg-card p-4">
      <h3>{t('Bộ đếm luyện tập')}</h3>
      <output className="study-timer my-6 block font-mono text-[32px] tracking-[-.05em] text-success tabular-nums">
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
      </output>
      <div className="inline-group flex flex-wrap items-center gap-2">
        <UiButton
          className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
          aria-pressed={running}
          onClick={() => R(!running)}
          variant="outline"
        >
          {t(running ? 'Tạm dừng' : 'Bắt đầu')}
        </UiButton>
        <UiButton
          className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
          onClick={() => {
            R(false);
            S(0);
          }}
          variant="ghost"
        >
          {t('Đặt lại')}
        </UiButton>
      </div>
    </section>
  );
}
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
        'utility-rail space-y-5 text-xs [&>section]:rounded-[14px] [&>section]:border-t-[3px] [&>section]:border-t-primary [&>section]:p-[18px] [&>section]:shadow-subtle [&_h3]:text-[13px] [&_h3]:text-success [&>.timer-card]:border-t-action [&>.timer-card]:bg-action-soft ' +
        side
      }
      aria-label={t(side === 'left' ? 'Tiện ích luyện tập' : 'Thống kê cộng đồng')}
    >
      {side === 'left' ? (
        <>
          <Timer />
          <section className="favorites-card space-y-3 rounded-[14px] border bg-card p-4">
            <div className="rail-title mb-4 flex items-center justify-between gap-2">
              <h3>{t('Bài yêu thích')}</h3>
              <span className="rail-total ml-auto rounded-md bg-warning-soft px-2 py-1 text-xs font-medium text-warning">
                {favorites.length}
              </span>
            </div>
            <ErrorBox error={starError} />
            {!stars ? (
              <Loading />
            ) : favorites.length ? (
              <ul className="favorite-list divide-y [&>li]:flex [&>li]:items-center [&>li]:gap-3 [&>li]:py-3 [&_small]:block [&_small]:text-xs [&_small]:text-muted-foreground">
                {favorites.map((p) => (
                  <li key={p.id}>
                    <a href={'#/solve/' + p.id} data-user-content>
                      <Icon name="fa-solid fa-star" aria-hidden="true" />
                      <span>
                        <small className="favorite-code font-mono text-xs text-muted-foreground">
                          {p.publicId}
                        </small>
                        {p.title}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rail-empty text-sm leading-relaxed text-muted-foreground">
                {t('Đánh dấu sao để lưu bài tại đây.')}
              </p>
            )}
          </section>
        </>
      ) : (
        <>
          <section className="category-stats space-y-3 rounded-[14px] border bg-card p-4">
            <div className="rail-title mb-4 flex items-center justify-between gap-2">
              <h3>{t('Bài theo danh mục')}</h3>
              <span className="rail-total ml-auto rounded-md bg-warning-soft px-2 py-1 text-xs font-medium text-warning">
                {problems?.length || 0}
              </span>
            </div>
            <UiLabel className="rail-search mb-4 flex items-center gap-2 rounded-md bg-muted pl-2.5 text-muted-foreground [&_input]:border-0 [&_input]:bg-transparent [&_input]:text-xs [&_input]:shadow-none">
              <Icon name="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <UiInput
                type="search"
                aria-label={t('Tìm danh mục')}
                placeholder={t('Tìm danh mục…')}
                value={search}
                onChange={(e) => S(e.target.value)}
              />
            </UiLabel>
            <ErrorBox error={error || categoryError} />
            {!categories || !problems ? (
              <Loading />
            ) : (
              <div className="category-chips flex flex-wrap gap-2 [&_button]:h-auto [&_button]:min-h-9 [&_button]:rounded-lg [&_button]:border-border [&_button]:bg-muted [&_button]:px-2 [&_button]:py-1.5 [&_button]:text-[11px] [&_button]:font-normal [&_button]:text-muted-foreground [&_b]:rounded-full [&_b]:bg-action-soft [&_b]:px-1.5 [&_b]:py-0.5 [&_b]:text-action-text">
                {categories
                  .filter((c) =>
                    c.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')),
                  )
                  .map((c) => (
                    <UiButton
                      className="category-chip flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-left text-sm"
                      key={c.id}
                      onClick={() => go('/practice?category=' + encodeURIComponent(c.id))}
                      variant="default"
                    >
                      <span data-user-content>{c.name}</span>
                      <b>{problems.filter((p) => p.category_id === c.id).length}</b>
                    </UiButton>
                  ))}
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
          <section className="elo-card space-y-3 rounded-[14px] border bg-card p-4">
            <div className="rail-title mb-4 flex items-center justify-between gap-2">
              <h3>{t('Top Elo Contest')}</h3>
              <a href="#/leaderboard" aria-label={t('Xem toàn bộ bảng xếp hạng')}>
                <Icon name="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
              </a>
            </div>
            <ErrorBox error={rankError} />
            {!rank ? (
              <Loading />
            ) : rank.length ? (
              <ol className="elo-list divide-y [&>li]:flex [&>li]:items-center [&>li]:gap-2.5 [&>li]:py-3 [&_small]:block [&_small]:text-[11px] [&_small]:text-muted-foreground [&_b]:text-xs [&_strong]:text-xs">
                {rank.slice(0, 5).map((u, i) => (
                  <li key={u.id}>
                    <span
                      className={
                        'elo-position flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-semibold position-' +
                        (i + 1)
                      }
                    >
                      {i === 0 ? (
                        <>
                          <Icon name="fa-solid fa-trophy" aria-hidden="true" />
                          <span className="sr-only">1</span>
                        </>
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span className="elo-person min-w-0 flex-1">
                      <b data-user-content>{u.display_name}</b>
                      <small data-user-content>@{u.username}</small>
                    </span>
                    <strong>{u.elo}</strong>
                  </li>
                ))}
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
