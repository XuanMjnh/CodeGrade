import { Button as ActionLink, Button as UiButton } from '../components/ui/button';
import Icon from '../components/Icon';
import { Input as UiInput } from '../components/ui/input';
import { Label as UiLabel } from '../components/ui/label';
import { NativeSelect as UiNativeSelect } from '../components/ui/native-select';
import { DataTable as UiTable } from '../components/DataTable';
import {
  TableBody as UiTableBody,
  TableCell as UiTableCell,
  TableHead as UiTableHead,
  TableHeader as UiTableHeader,
  TableRow as UiTableRow,
} from '../components/ui/table';
import { Textarea as UiTextarea } from '../components/ui/textarea';
import { t as trUI } from '../lib/locale';
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { Heading, ErrorBox, Loading, useResource, Check } from '../components/ui';
import { StatGrid, InsightPanel, ProgressRows } from '../components/Insights';
import { submissionInsights } from '../lib/insights';
import { live } from '../lib/live';
import { languageNames } from '../lib/coderunner';
import Result from '../components/SubmissionResult';
import SubmissionStatus from '../components/SubmissionStatus';
export function SubmissionsPage({ revision }) {
  const [data, error] = useResource('SUBMISSIONS', {}, revision),
    [selected, setSelected] = useState(null),
    [filter, F] = useState('all'),
    [page, P] = useState(1),
    [pageSize, S] = useState(20);
  const summary = submissionInsights(data || []);
  const [history, historyError] = useResource(
    'SUBMISSIONS_PAGE',
    {
      page,
      pageSize,
      filter,
    },
    revision,
  );
  const ready = history?.filter === filter && history?.pageSize === pageSize,
    rows = ready ? history.items : [];
  return (
    <div className="submissions-page space-y-4">
      <ErrorBox error={error || historyError} />

      {/* Top Stat Cards */}
      <StatGrid
        className="submissions-stats-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        label="Tổng quan bài nộp"
        items={[
          {
            label: 'Lượt nộp chính thức',
            value: data ? summary.total : null,
            icon: <Icon name="fa-solid fa-paper-plane" aria-hidden="true" />,
            note: 'Tổng bài đã gửi',
            tone: 'total',
            active: filter === 'all',
            onClick: () => {
              F('all');
              P(1);
            },
          },
          {
            label: 'Lượt đạt AC',
            value: data ? summary.ac : null,
            icon: <Icon name="fa-solid fa-circle-check" aria-hidden="true" />,
            note: 'Lời giải chính xác',
            tone: 'ac',
            active: filter === 'ac',
            onClick: () => {
              F(filter === 'ac' ? 'all' : 'ac');
              P(1);
            },
          },
          {
            label: 'Đang chờ chấm',
            value: data ? summary.pending : null,
            icon: <Icon name="fa-solid fa-clock-rotate-left" aria-hidden="true" />,
            note: 'Đang xử lý',
            tone: 'pending',
            active: filter === 'pending',
            onClick: () => {
              F(filter === 'pending' ? 'all' : 'pending');
              P(1);
            },
          },
          {
            label: 'Điểm cao nhất',
            value: summary.best ?? 0,
            icon: <Icon name="fa-solid fa-award" aria-hidden="true" />,
            note: 'Thành tích tối đa',
            tone: 'score',
          },
        ]}
      />

      <p className="scope-note flex items-center gap-1.5 text-xs text-muted-foreground px-1">
        <Icon
          name="fa-solid fa-circle-info"
          className="size-3 text-muted-foreground/70 shrink-0"
          aria-hidden="true"
        />
        <span>
          {trUI('Thống kê trong tối đa 100 bài nộp gần nhất; không tính lượt chạy thử.')}
        </span>
      </p>

      {/* Middle Insight Panels */}
      <div className="insight-grid grid min-w-0 gap-3.5 sm:grid-cols-2 submissions-insights">
        <InsightPanel title="Phân bố kết quả">
          {!data ? (
            <Loading />
          ) : (
            <ProgressRows
              items={summary.verdicts.map((c) => ({
                name: c.status,
                value: c.count,
                total: summary.total,
                onClick: () => {
                  F(c.status === 'AC' ? 'ac' : 'other');
                  P(1);
                },
              }))}
              empty="Chưa có bài chính thức."
            />
          )}
        </InsightPanel>
        <InsightPanel title="Ngôn ngữ đã sử dụng">
          {!data ? (
            <Loading />
          ) : (
            <ProgressRows
              items={summary.languages.map((c) => ({
                name: languageNames[c.language],
                value: c.count,
                total: summary.total,
              }))}
              empty="Chưa có bài chính thức."
            />
          )}
        </InsightPanel>
      </div>

      {/* Submissions Section */}
      <div className="space-y-3 pt-1">
        <div className="subheading flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon
              name="fa-solid fa-file-code"
              className="size-4 text-primary"
              aria-hidden="true"
            />
            <h2 className="font-heading text-sm sm:text-base font-bold text-foreground">
              {trUI('Chi tiết bài nộp')}
            </h2>
          </div>
          <span className="text-xs font-semibold text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border border-border/50">
            {ready ? history.total : '—'} {trUI('kết quả')}
          </span>
        </div>

        {/* Filter Tabs */}
        <div
          className="tabs flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1 border border-border/50 w-fit"
          aria-label={trUI('Lọc bài nộp')}
        >
          {[
            ['all', 'Tất cả'],
            ['pending', 'Đang chờ chấm'],
            ['ac', 'Đã AC'],
            ['other', 'Cần cải thiện'],
          ].map(([k, label]) => (
            <UiButton
              key={k}
              className={cn(
                'h-8 px-3 text-xs font-semibold rounded-lg transition-all border-0 shadow-none',
                filter === k
                  ? 'active bg-card text-foreground shadow-2xs border border-border/60 font-bold'
                  : 'bg-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground',
              )}
              aria-pressed={filter === k}
              onClick={() => {
                F(k);
                P(1);
              }}
              variant="ghost"
            >
              {trUI(label)}
            </UiButton>
          ))}
        </div>

        {/* Table Card */}
        {!ready ? (
          <Loading />
        ) : (
          <div
            className="paper text-card-foreground shadow-2xs table-wrap min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card"
            data-pagination="manual"
            role="region"
            aria-label={trUI('Bảng dữ liệu')}
            tabIndex={0}
          >
            <UiTable paginate={false}>
              <UiTableHeader className="bg-muted/30 border-b border-border/60">
                <UiTableRow>
                  <UiTableHead className="text-xs font-bold text-muted-foreground">
                    {trUI('Bài tập')}
                  </UiTableHead>
                  <UiTableHead className="text-xs font-bold text-muted-foreground">
                    {trUI('Ngôn ngữ')}
                  </UiTableHead>
                  <UiTableHead className="text-xs font-bold text-muted-foreground">
                    {trUI('Chế độ')}
                  </UiTableHead>
                  <UiTableHead className="text-xs font-bold text-muted-foreground">
                    {trUI('Nhận lúc')}
                  </UiTableHead>
                  <UiTableHead className="text-xs font-bold text-muted-foreground">
                    {trUI('Kết quả')}
                  </UiTableHead>
                  <UiTableHead className="text-xs font-bold text-muted-foreground text-right">
                    {trUI('Điểm')}
                  </UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                {rows.map((s) => (
                  <UiTableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <UiTableCell className="font-medium">
                      <UiButton
                        className="link inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary-hover p-0 h-auto"
                        data-user-content
                        onClick={() => setSelected(s.id)}
                        variant="ghost"
                      >
                        <Icon
                          name="fa-regular fa-file-code"
                          className="size-3 opacity-70"
                          aria-hidden="true"
                        />
                        <span>{s.title}</span>
                      </UiButton>
                    </UiTableCell>
                    <UiTableCell className="text-xs font-mono text-muted-foreground">
                      {languageNames[s.language]}
                    </UiTableCell>
                    <UiTableCell className="text-xs text-muted-foreground">
                      {s.room_id ? (
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          SURVIVAL ·{' '}
                        </span>
                      ) : s.contest_id ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                          CONTEST ·{' '}
                        </span>
                      ) : null}
                      <span>{trUI(s.mode)}</span>
                    </UiTableCell>
                    <UiTableCell className="text-xs text-muted-foreground font-mono">
                      {new Date(s.received_at).toLocaleString(
                        document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN',
                      )}
                    </UiTableCell>
                    <UiTableCell>
                      <SubmissionStatus submission={s} />
                    </UiTableCell>
                    <UiTableCell className="text-right font-bold text-foreground">
                      {s.score}
                    </UiTableCell>
                  </UiTableRow>
                ))}
              </UiTableBody>
            </UiTable>

            {!rows.length && (
              <div className="py-12 px-4 text-center space-y-2">
                <Icon
                  name="fa-regular fa-file-code"
                  className="mx-auto size-8 text-muted-foreground/30"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-foreground">
                  {trUI('Chưa có bài nộp phù hợp.')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {trUI('Thử chọn bộ lọc khác hoặc bắt đầu giải bài tập mới.')}
                </p>
              </div>
            )}

            <nav
              className="table-footer history-pagination flex flex-wrap items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground bg-muted/15"
              aria-label={trUI('Phân trang lịch sử bài nộp')}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  {trUI('Số bài mỗi trang')}:
                </span>
                <UiNativeSelect
                  value={pageSize}
                  onChange={(e) => {
                    S(Number(e.target.value));
                    P(1);
                  }}
                  className="h-7 text-xs font-semibold rounded-md bg-card border-border/70 py-0 px-2 shadow-2xs"
                >
                  {[10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </UiNativeSelect>
              </div>

              <div className="flex items-center gap-2">
                <UiButton
                  className="h-7 px-2.5 text-xs font-semibold rounded-md border border-border/60 bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-card shadow-2xs"
                  disabled={history.page <= 1}
                  onClick={() => P(history.page - 1)}
                  variant="outline"
                >
                  <Icon name="fa-solid fa-chevron-left" className="size-2.5" aria-hidden="true" />
                  <span>{trUI('Trang trước')}</span>
                </UiButton>

                <span className="px-2 py-0.5 font-mono text-xs font-semibold text-foreground bg-card border border-border/50 rounded-md">
                  {history.page} / {history.totalPages || 1}
                </span>

                <UiButton
                  className="h-7 px-2.5 text-xs font-semibold rounded-md border border-border/60 bg-card text-foreground hover:bg-muted disabled:opacity-40 disabled:hover:bg-card shadow-2xs"
                  disabled={history.page >= history.totalPages}
                  onClick={() => P(history.page + 1)}
                  variant="outline"
                >
                  <span>{trUI('Trang sau')}</span>
                  <Icon name="fa-solid fa-chevron-right" className="size-2.5" aria-hidden="true" />
                </UiButton>
              </div>
            </nav>
          </div>
        )}
      </div>

      {selected && (
        <section className="paper text-card-foreground shadow-2xs pad sm:p-6 submission-detail space-y-4 rounded-2xl border border-border/80 bg-card p-5">
          <div className="inline-group between flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <h2 className="font-heading text-base font-bold text-foreground">
              {trUI('Chi tiết bài nộp')}
            </h2>
            <UiButton
              className="ghost h-7 px-2.5 text-xs font-semibold rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setSelected(null)}
              variant="ghost"
            >
              <Icon name="fa-solid fa-xmark" className="size-3" aria-hidden="true" />
              <span>{trUI('Đóng')}</span>
            </UiButton>
          </div>
          <Result id={selected} revision={revision} />
        </section>
      )}
    </div>
  );
}
export { default as Leaderboard } from './Leaderboards';
export function Categories({ revision, onNotice }) {
  const [data, error] = useResource('CATEGORIES', {}, revision),
    [problems, problemError] = useResource('PROBLEMS', {}, revision),
    [name, setName] = useState(''),
    [description, setDescription] = useState(''),
    [id, setId] = useState(null),
    [err, setErr] = useState(null),
    [busy, B] = useState(false);
  async function save(e) {
    e.preventDefault();
    B(true);
    try {
      await live.call('CATEGORY_SAVE', {
        ...(id
          ? {
              id,
            }
          : {}),
        name,
        description,
      });
      setName('');
      setDescription('');
      setId(null);
      onNotice(trUI('Đã lưu category.'));
    } catch (e) {
      setErr(e);
    } finally {
      B(false);
    }
  }
  return (
    <>
      <Heading
        kind="categories"
        title={trUI('Quản lý danh mục')}
        highlight={{
          label: 'Danh mục hiện có',
          value: data?.length,
        }}
      >
        Sắp xếp kho đề theo chủ đề để người học dễ khám phá và luyện tập.
      </Heading>
      <StatGrid
        items={[
          {
            label: 'Danh mục',
            value: data?.length,
          },
          {
            label: 'Bài trong kho của bạn',
            value: problems?.length,
          },
          {
            label: 'Danh mục chưa có bài',
            value:
              data && problems
                ? data.filter((c) => !problems.some((p) => p.category_id === c.id)).length
                : null,
          },
        ]}
      />
      <ErrorBox error={error || err || problemError} />
      <div className="insight-grid grid min-w-0 gap-4 sm:grid-cols-2 category-workspace space-y-3">
        <form
          className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6"
          onSubmit={save}
        >
          <h2>{id ? trUI('Sửa danh mục') : trUI('Tạo danh mục')}</h2>
          <UiLabel className="grid gap-2 text-sm font-medium">
            Tên
            <UiInput
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </UiLabel>
          <UiLabel className="grid gap-2 text-sm font-medium">
            Mô tả
            <UiTextarea
              value={description}
              maxLength={1000}
              onChange={(e) => setDescription(e.target.value)}
            />
          </UiLabel>
          <div className="inline-group flex flex-wrap items-center gap-2">
            <UiButton disabled={busy} aria-busy={busy} variant="default">
              Lưu
            </UiButton>
            {id && (
              <UiButton
                type="button"
                className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
                onClick={() => {
                  setId(null);
                  setName('');
                  setDescription('');
                }}
                variant="ghost"
              >
                Hủy
              </UiButton>
            )}
          </div>
        </form>
        <InsightPanel title="Danh mục trong kho">
          {!data ? (
            <Loading />
          ) : (
            data.map((c) => (
              <div
                key={c.id}
                className="category-row flex flex-wrap items-center justify-between gap-3 border-b py-3"
              >
                <div>
                  <b data-user-content>{c.name}</b>
                  <p data-user-content>{c.description}</p>
                  <small>
                    {problems ? problems.filter((p) => p.category_id === c.id).length : '—'}{' '}
                    {trUI('bài tập')}
                  </small>
                </div>
                <UiButton
                  className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setId(c.id);
                    setName(c.name);
                    setDescription(c.description);
                  }}
                  variant="ghost"
                >
                  Sửa
                </UiButton>
              </div>
            ))
          )}
        </InsightPanel>
      </div>
    </>
  );
}
export function Admin({ revision, onNotice }) {
  const [auditOpen, AOpen] = useState(false);
  const [users, error] = useResource('USERS', {}, revision),
    [audit, auditError] = useResource(
      auditOpen ? 'AUDIT' : null,
      {
        summaryOnly: true,
      },
      revision,
    ),
    [err, setErr] = useState(null),
    [pending, S] = useState(null);
  async function change(u, p) {
    if (
      !window.confirm(
        trUI('Cập nhật quyền truy cập cho ') +
          u.username +
          trUI('? Các phiên đăng nhập hiện tại sẽ bị thu hồi.'),
      )
    )
      return;
    S(u.id);
    try {
      await live.call('USER_SET', {
        id: u.id,
        role: u.role,
        enabled: !!u.enabled,
        ...p,
      });
      onNotice(trUI('Đã cập nhật quyền và thu hồi các phiên đăng nhập cũ.'));
    } catch (e) {
      setErr(e);
    } finally {
      S(null);
    }
  }
  return (
    <>
      <Heading
        kind="admin"
        title={trUI('Quản trị hệ thống')}
        highlight={{
          label: 'Tài khoản hoạt động',
          value: users?.filter((u) => u.enabled).length,
        }}
        action={
          <ActionLink asChild variant="outline">
            <a
              href="#/announcements"
              className="button secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
            >
              Đăng thông báo
            </a>
          </ActionLink>
        }
      >
        Quản lý thành viên, phân quyền và theo dõi hoạt động trong cộng đồng.
      </Heading>
      <StatGrid
        label="Tổng quan tài khoản"
        items={[
          {
            label: 'Tổng tài khoản',
            value: users?.length,
          },
          {
            label: 'Coder',
            value: users?.filter((u) => u.role === 'CODER').length,
          },
          {
            label: 'Người tạo đề',
            value: users?.filter((u) => u.role === 'AUTHOR').length,
          },
          {
            label: 'Đã vô hiệu hóa',
            value: users?.filter((u) => !u.enabled).length,
          },
        ]}
      />
      <ErrorBox error={error || err || auditError} />
      <div className="subheading flex flex-wrap items-center justify-between gap-3">
        <h2>Thành viên và quyền truy cập</h2>
        <small>
          {users?.length ?? '—'} {trUI('tài khoản')}
        </small>
      </div>
      {!users ? (
        <Loading />
      ) : (
        <div
          className="paper text-card-foreground shadow-xs table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
          role="region"
          aria-label={trUI('Bảng dữ liệu')}
          tabIndex={0}
        >
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead>Tài khoản</UiTableHead>
                <UiTableHead>Vai trò</UiTableHead>
                <UiTableHead>Hoạt động</UiTableHead>
                <UiTableHead>Elo</UiTableHead>
                <UiTableHead>Wins</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              {users.map((u) => (
                <UiTableRow key={u.id}>
                  <UiTableCell>
                    <b data-user-content>{u.display_name}</b>
                    <small data-user-content>@{u.username}</small>
                  </UiTableCell>
                  <UiTableCell>
                    <UiNativeSelect
                      disabled={pending === u.id}
                      aria-busy={pending === u.id}
                      aria-label={trUI('Vai trò ') + u.username}
                      value={u.role}
                      onChange={(e) =>
                        change(u, {
                          role: e.target.value,
                        })
                      }
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="AUTHOR">Người tạo đề</option>
                      <option value="CODER">Coder</option>
                    </UiNativeSelect>
                  </UiTableCell>
                  <UiTableCell>
                    <Check
                      label="Enabled"
                      disabled={pending === u.id}
                      checked={u.enabled}
                      onChange={(v) =>
                        change(u, {
                          enabled: v,
                        })
                      }
                    />
                  </UiTableCell>
                  <UiTableCell>{u.elo}</UiTableCell>
                  <UiTableCell>{u.wins}</UiTableCell>
                </UiTableRow>
              ))}
            </UiTableBody>
          </UiTable>
        </div>
      )}
      <details
        className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6"
        open={auditOpen}
        onToggle={(e) => AOpen(e.currentTarget.open)}
      >
        <summary>Hoạt động gần đây</summary>
        <p className="scope-note text-sm leading-relaxed text-muted-foreground">
          Tối đa 100 sự kiện gần nhất.
        </p>
        <div
          className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
          role="region"
          aria-label={trUI('Nhật ký hoạt động')}
          tabIndex={0}
        >
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead>Thời gian</UiTableHead>
                <UiTableHead>Sự kiện</UiTableHead>
                <UiTableHead>Entity</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              {audit?.map((a) => (
                <UiTableRow key={a.id}>
                  <UiTableCell>
                    {new Date(a.created_at).toLocaleString(
                      document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN',
                    )}
                  </UiTableCell>
                  <UiTableCell>{a.action}</UiTableCell>
                  <UiTableCell>{a.entity_id}</UiTableCell>
                </UiTableRow>
              ))}
            </UiTableBody>
          </UiTable>
        </div>
        {auditOpen && !audit && !auditError && <Loading />}
      </details>
    </>
  );
}
