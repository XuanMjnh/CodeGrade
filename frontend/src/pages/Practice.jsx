import { Button as ActionLink, Button as UiButton } from '../components/ui/button';
import Icon from '../components/Icon';
import { Input as UiInput } from '../components/ui/input';
import { NativeSelect as UiNativeSelect } from '../components/ui/native-select';
import { DataTable as UiTable } from '../components/DataTable';
import {
  TableBody as UiTableBody,
  TableCell as UiTableCell,
  TableHead as UiTableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from '../components/ui/table';
import { practiceInsights } from '../lib/insights';
import { StatGrid, InsightPanel, ProgressRows, ProblemPicks } from '../components/Insights';
import { t as trUI } from '../lib/locale';
import React, { useState, useEffect } from 'react';
import { live } from '../lib/live';
import { Heading, Badge, ErrorBox, Loading, useResource, go } from '../components/ui';
function focusLibrary() {
  const el = document.getElementById('problem-library');
  if (el) {
    el.focus();
    el.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
}
export default function Practice({ user, revision }) {
  const [page, P] = useState(1),
    [star, S] = useState(false),
    [bookmarkBusy, B] = useState(null),
    [bookmarkError, E] = useState(null);
  const [search, setSearch] = useState(''),
    [difficulty, setDifficulty] = useState(0),
    [category, setCategory] = useState(''),
    [state, setState] = useState('all');
  const hash = location.hash;
  useEffect(() => {
    const query = new URLSearchParams(hash.split('?')[1] || '');
    setSearch(query.get('search') || '');
    setCategory(query.get('category') || '');
    P(1);
  }, [hash]);
  const [all, allError, A] = useResource('PROBLEMS', {}, revision);
  const summary = practiceInsights(all || []);
  const [categories, categoryError] = useResource('CATEGORIES', {}, revision);
  const data = all,
    error = allError,
    D = A;
  const [sort, T] = useState({
    key: 'difficulty',
    dir: 1,
  });
  function sortBy(key) {
    T((v) => ({
      key,
      dir: v.key === key ? -v.dir : 1,
    }));
    P(1);
  }
  const sortHead = (key, label) => (
    <UiTableHead
      aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}
    >
      <UiButton
        className="sort-button h-auto justify-start bg-transparent p-0 text-xs font-medium text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
        onClick={() => sortBy(key)}
        variant="ghost"
      >
        {label}
        <span aria-hidden="true">{sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ' ↕'}</span>
      </UiButton>
    </UiTableHead>
  );
  const author = user.role !== 'CODER';
  const rows = (data || [])
    .filter(
      (p) =>
        (!difficulty || p.difficulty === difficulty) &&
        (!category || p.category_id === category) &&
        (!search ||
          String(p.title).toLocaleLowerCase().includes(search.toLocaleLowerCase()) ||
          String(p.publicId).toLocaleLowerCase().includes(search.toLocaleLowerCase())),
    )
    .filter((p) => !star || p.starred)
    .filter((p) => state === 'all' || (state === 'ac' ? p.solved : !p.solved))
    .sort(
      (a, b) =>
        sort.dir *
        (typeof a[sort.key] === 'number'
          ? a[sort.key] - b[sort.key]
          : String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), 'vi', {
              numeric: true,
            })),
    );
  const totalPages = Math.max(1, Math.ceil(rows.length / 20)),
    currentPage = Math.min(page, totalPages);
  return (
    <>
      <Heading
        kind="practice"
        title={trUI('Thư viện bài tập')}
        highlight={{
          label: 'Tiến độ của bạn',
          value: all ? summary.solved + ' / ' + summary.total : null,
          detail: 'Bài đã AC',
          onClick: () => {
            focusLibrary();
          },
        }}
        action={
          <>
            <ActionLink asChild variant="outline">
              <a
                className="button secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
                href="#/practice"
                onClick={(e) => {
                  e.preventDefault();
                  focusLibrary();
                }}
              >
                <Icon name="fa-solid fa-compass" aria-hidden="true" /> {trUI('Khám phá kho bài')}
              </a>
            </ActionLink>
            {author && (
              <UiButton
                className="primary bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => go('/edit')}
                variant="default"
              >
                <Icon name="fa-solid fa-plus" aria-hidden="true" /> {trUI('Tạo câu hỏi')}
              </UiButton>
            )}
            <a
              className="banner-text-link inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
              href="#/survival"
            >
              <Icon name="fa-solid fa-fire" aria-hidden="true" /> Code Survival{' '}
              <Icon name="fa-solid fa-arrow-right" aria-hidden="true" />
            </a>
          </>
        }
      >
        {trUI(
          'Luyện tập theo danh mục, chinh phục từng mức độ và giữ lại những bài bạn muốn quay lại.',
        )}
      </Heading>
      <StatGrid
        className="practice-stats-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        label="Tổng quan luyện tập"
        items={[
          {
            label: 'Bài có thể luyện',
            value: all ? summary.total : null,
            icon: <Icon name="fa-solid fa-book-open" aria-hidden="true" />,
            note: 'Kho bài thực hành',
            tone: 'total',
            active: state === 'all' && !star,
            onClick: () => {
              setState('all');
              S(false);
              P(1);
            },
          },
          {
            label: 'Bài đã AC',
            value: all ? summary.solved : null,
            icon: <Icon name="fa-solid fa-circle-check" aria-hidden="true" />,
            note: 'Đã hoàn thành',
            tone: 'ac',
            active: state === 'ac',
            onClick: () => {
              setState(state === 'ac' ? 'all' : 'ac');
              S(false);
              P(1);
            },
          },
          {
            label: 'Đã đánh dấu',
            value: all ? summary.starred : null,
            icon: <Icon name="fa-solid fa-star" aria-hidden="true" />,
            note: 'Bài tập yêu thích',
            tone: 'star',
            active: star,
            onClick: () => {
              S(!star);
              P(1);
            },
          },
          {
            label: 'Danh mục',
            value: all ? summary.categories.length : null,
            icon: <Icon name="fa-solid fa-layer-group" aria-hidden="true" />,
            note: 'Chủ đề thuật toán',
            tone: 'category',
            onClick: () => {
              focusLibrary();
            },
          },
        ]}
      />
      <div className="insight-grid grid min-w-0 gap-4 sm:grid-cols-2 practice-insights items-start">
        <InsightPanel title="Tiến độ theo danh mục">
          {!all ? (
            <Loading />
          ) : (
            <ProgressRows
              items={summary.categories.map((c) => ({
                ...c,
                value: c.solved,
                onClick: () => {
                  setCategory(c.id);
                  P(1);
                  focusLibrary();
                },
              }))}
            />
          )}
        </InsightPanel>
        <InsightPanel title="Bài gợi ý tiếp theo">
          {!all ? (
            <Loading />
          ) : summary.next.length ? (
            <ProblemPicks items={summary.next} />
          ) : (
            <p className="muted text-sm leading-relaxed text-muted-foreground">
              {trUI('Bạn đã hoàn thành các bài hiện có.')}
            </p>
          )}
          <p className="panel-footnote text-sm leading-relaxed text-muted-foreground">
            <Icon name="fa-solid fa-circle-info" aria-hidden="true" />{' '}
            {trUI('Ưu tiên bài chưa AC ở mức độ thấp trước.')}
          </p>
        </InsightPanel>
      </div>
      <div
        className="subheading my-6 flex flex-wrap items-center justify-between gap-4 [&_h2]:text-lg [&_h2]:text-success [&_small]:text-xs [&_small]:text-muted-foreground"
        id="problem-library"
        tabIndex={-1}
      >
        <h2>{trUI('Kho bài tập')}</h2>
        <small>
          {rows.length} {trUI('bài phù hợp')}
        </small>
      </div>
      {user.role === 'ADMIN' && (
        <div className="alert my-3 rounded-lg border border-border bg-muted/60 px-4 py-3 text-sm leading-relaxed">
          {trUI(
            'Admin có thể giải mọi bài. Kết quả không cập nhật Elo, số bài AC hoặc số lần thắng trong bảng xếp hạng.',
          )}
        </div>
      )}
      <div className="library-toolbar mb-4 flex flex-wrap items-center gap-3 [&_input]:min-w-40 [&_input]:flex-1">
        <p className="scope-note text-sm leading-relaxed text-muted-foreground">
          <Icon name="fa-solid fa-circle-info" aria-hidden="true" />{' '}
          {trUI(
            'Luyện tập cá nhân không cộng EXP. Thành tích AC được ghi lại theo quy định của tài khoản.',
          )}
        </p>
        <div className="filters my-4 flex flex-wrap items-center gap-3 rounded-[14px] border bg-card p-4 [&_input]:min-w-40 [&_input]:flex-1">
          <UiButton
            className={
              'secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground bookmark-filter ' +
              (star
                ? 'is-active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                : '')
            }
            aria-pressed={star}
            onClick={() => {
              S(!star);
              P(1);
            }}
            variant="outline"
          >
            <Icon name="fa-regular fa-star" aria-hidden="true" /> {trUI('Đánh dấu')}
          </UiButton>
          <UiInput
            aria-label={trUI('Tìm bài')}
            placeholder={trUI('Tìm theo tên bài…')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              P(1);
            }}
          />
          <UiNativeSelect
            aria-label="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              P(1);
            }}
          >
            <option value="">{trUI('Tất cả category')}</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </UiNativeSelect>
          <UiNativeSelect
            aria-label={trUI('Độ khó')}
            value={difficulty}
            onChange={(e) => {
              setDifficulty(+e.target.value);
              P(1);
            }}
          >
            <option value="0">{trUI('Tất cả độ khó')}</option>
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <option key={d} value={d}>
                {trUI('Mức')} {d}
              </option>
            ))}
          </UiNativeSelect>
          <UiNativeSelect
            aria-label={trUI('Trạng thái AC')}
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              P(1);
            }}
          >
            <option value="all">{trUI('Mọi trạng thái')}</option>
            <option value="ac">{trUI('Đã AC')}</option>
            <option value="todo">{trUI('Chưa AC')}</option>
          </UiNativeSelect>
        </div>
      </div>
      <ErrorBox error={error || categoryError || allError || bookmarkError} />
      {!data ? (
        <Loading />
      ) : (
        <div
          className="paper text-card-foreground shadow-xs table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
          data-pagination="manual"
          role="region"
          aria-label={trUI('Bảng dữ liệu')}
          tabIndex={0}
        >
          <UiTable className="problem-library-table" paginate={false}>
            <UiTableHeader>
              <UiTableRow>
                {sortHead('publicId', trUI('Mã bài'))}
                {sortHead('title', trUI('Bài tập'))}
                {sortHead('category', trUI('Danh mục'))}
                {sortHead('difficulty', trUI('Độ khó'))}
                {sortHead('solved', trUI('Trạng thái'))}
                <UiTableHead>
                  <span className="sr-only">Thao tác</span>
                </UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              {rows.slice((currentPage - 1) * 20, currentPage * 20).map((p) => (
                <UiTableRow key={p.id}>
                  <UiTableCell>
                    <code className="problem-id font-mono text-xs text-muted-foreground">
                      {p.publicId}
                    </code>
                  </UiTableCell>
                  <UiTableCell>
                    <UiButton
                      className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground bookmark-button size-8 p-0"
                      disabled={bookmarkBusy === p.id}
                      aria-busy={bookmarkBusy === p.id}
                      aria-pressed={!!p.starred}
                      aria-label={
                        (p.starred ? trUI('Bỏ đánh dấu: ') : trUI('Đánh dấu: ')) + p.title
                      }
                      onClick={async () => {
                        B(p.id);
                        E(null);
                        try {
                          await live.call('BOOKMARK_SET', {
                            problemId: p.id,
                            starred: !p.starred,
                          });
                          D(
                            data.map((x) =>
                              x.id === p.id
                                ? {
                                    ...x,
                                    starred: !x.starred,
                                  }
                                : x,
                            ),
                          );
                          A((prev) =>
                            prev
                              ? prev.map((x) =>
                                  x.id === p.id
                                    ? {
                                        ...x,
                                        starred: !p.starred,
                                      }
                                    : x,
                                )
                              : prev,
                          );
                          window.dispatchEvent(new Event('cg-bookmarks-changed'));
                        } catch (e) {
                          E(e);
                        } finally {
                          B(null);
                        }
                      }}
                      variant="ghost"
                    >
                      <Icon
                        name={(p.starred ? 'fa-solid' : 'fa-regular') + ' fa-star'}
                        aria-hidden="true"
                      />
                    </UiButton>
                    <a
                      href={'#/solve/' + p.id}
                      className="problem-title font-semibold text-success hover:text-action-text"
                      data-user-content
                    >
                      {p.title}
                    </a>
                    {p.status === 'draft' && <small>Bản nháp</small>}
                  </UiTableCell>
                  <UiTableCell data-user-content>{p.category}</UiTableCell>
                  <UiTableCell>
                    <Badge tone={'level-' + p.difficulty}>Mức {p.difficulty}</Badge>
                  </UiTableCell>
                  <UiTableCell>
                    <Badge tone={p.solved ? 'success' : ''}>
                      {p.solved ? 'Accepted' : trUI('Chưa AC')}
                    </Badge>
                  </UiTableCell>
                  <UiTableCell>
                    {author && (user.role === 'ADMIN' || p.author_id === user.id) ? (
                      <UiButton
                        className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
                        onClick={() => go('/edit/' + p.id)}
                        variant="ghost"
                      >
                        Sửa đề
                      </UiButton>
                    ) : (
                      <a href={'#/solve/' + p.id}>Giải bài</a>
                    )}
                  </UiTableCell>
                </UiTableRow>
              ))}
            </UiTableBody>
          </UiTable>
          {!rows.length && (
            <div className="empty rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
              <Icon name="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <h3>Chưa tìm thấy bài phù hợp</h3>
              <p>Thử đổi từ khóa hoặc bỏ bớt bộ lọc để khám phá kho bài.</p>
              <UiButton
                className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  setSearch('');
                  setDifficulty(0);
                  setCategory('');
                  setState('all');
                  S(false);
                  P(1);
                }}
                variant="outline"
              >
                Đặt lại bộ lọc
              </UiButton>
            </div>
          )}
          <div
            className="table-footer flex flex-wrap items-center gap-3 border-t px-4 py-3 text-xs text-muted-foreground [&>span:last-child]:ml-auto [&_button]:h-11 [&_button]:border [&_button]:border-input [&_button]:bg-card [&_button]:text-foreground [&_button:disabled]:bg-muted [&_button:disabled]:text-muted-foreground"
            aria-label={trUI('Phân trang bài tập')}
          >
            <UiButton
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              disabled={currentPage <= 1}
              onClick={() => P(currentPage - 1)}
              variant="ghost"
            >
              Previous
            </UiButton>
            <span>
              {currentPage} / {totalPages}
            </span>
            <UiButton
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              disabled={currentPage * 20 >= rows.length}
              onClick={() => P(currentPage + 1)}
              variant="ghost"
            >
              Next
            </UiButton>
            {rows.length} {trUI('bài tập')} <span>C++ 11 · C++ 17 · C++ 20 · Python 3.11</span>
          </div>
        </div>
      )}
    </>
  );
}
