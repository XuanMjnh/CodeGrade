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
    <>
      <ErrorBox error={error || historyError} />
      <StatGrid
        className="submissions-stats-grid grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
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
      <p className="scope-note text-sm leading-relaxed text-muted-foreground">
        <Icon name="fa-solid fa-circle-info" aria-hidden="true" />{' '}
        {trUI('Thống kê trong tối đa 100 bài nộp gần nhất; không tính lượt chạy thử.')}
      </p>
      <div className="insight-grid grid min-w-0 gap-4 sm:grid-cols-2 submissions-insights">
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
      <div className="subheading flex flex-wrap items-center justify-between gap-3">
        <h2>Chi tiết bài nộp</h2>
        <small>
          {ready ? history.total : '—'} {trUI('kết quả')}
        </small>
      </div>
      <div className="tabs" aria-label={trUI('Lọc bài nộp')}>
        {[
          ['all', 'Tất cả'],
          ['pending', 'Đang chờ chấm'],
          ['ac', 'Đã AC'],
          ['other', 'Cần cải thiện'],
        ].map(([k, label]) => (
          <UiButton
            key={k}
            className={
              filter === k
                ? 'active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                : ''
            }
            aria-pressed={filter === k}
            onClick={() => {
              F(k);
              P(1);
            }}
            variant="default"
          >
            {trUI(label)}
          </UiButton>
        ))}
      </div>
      {!ready ? (
        <Loading />
      ) : (
        <div
          className="paper text-card-foreground shadow-xs table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
          data-pagination="manual"
          role="region"
          aria-label={trUI('Bảng dữ liệu')}
          tabIndex={0}
        >
          <UiTable paginate={false}>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead>Bài tập</UiTableHead>
                <UiTableHead>Ngôn ngữ</UiTableHead>
                <UiTableHead>Chế độ</UiTableHead>
                <UiTableHead>Nhận lúc</UiTableHead>
                <UiTableHead>Kết quả</UiTableHead>
                <UiTableHead>Điểm</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              {rows.map((s) => (
                <UiTableRow key={s.id}>
                  <UiTableCell>
                    <UiButton
                      className="link inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                      data-user-content
                      onClick={() => setSelected(s.id)}
                      variant="ghost"
                    >
                      {s.title}
                    </UiButton>
                  </UiTableCell>
                  <UiTableCell>{languageNames[s.language]}</UiTableCell>
                  <UiTableCell>
                    {s.room_id ? 'SURVIVAL · ' : s.contest_id ? 'CONTEST · ' : ''}
                    {trUI(s.mode)}
                  </UiTableCell>
                  <UiTableCell>
                    {new Date(s.received_at).toLocaleString(
                      document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN',
                    )}
                  </UiTableCell>
                  <UiTableCell>
                    <SubmissionStatus submission={s} />
                  </UiTableCell>
                  <UiTableCell>{s.score}</UiTableCell>
                </UiTableRow>
              ))}
            </UiTableBody>
          </UiTable>
          {!rows.length && (
            <div className="empty rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
              Chưa có bài nộp phù hợp.
            </div>
          )}
          <nav
            className="table-footer history-pagination mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"
            aria-label={trUI('Phân trang lịch sử bài nộp')}
          >
            <UiLabel className="grid gap-2 text-sm font-medium">
              {trUI('Số bài mỗi trang')}
              <UiNativeSelect
                value={pageSize}
                onChange={(e) => {
                  S(Number(e.target.value));
                  P(1);
                }}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </UiNativeSelect>
            </UiLabel>
            <UiButton
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              disabled={history.page <= 1}
              onClick={() => P(history.page - 1)}
              variant="ghost"
            >
              {trUI('Trang trước')}
            </UiButton>
            <span>
              {history.page} / {history.totalPages}
            </span>
            <UiButton
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              disabled={history.page >= history.totalPages}
              onClick={() => P(history.page + 1)}
              variant="ghost"
            >
              {trUI('Trang sau')}
            </UiButton>
          </nav>
        </div>
      )}
      {selected && (
        <section className="paper text-card-foreground shadow-xs pad sm:p-6 submission-detail space-y-4 rounded-[14px] border bg-card p-5">
          <div className="inline-group between flex flex-wrap items-center justify-between gap-3">
            <h2>Chi tiết bài nộp</h2>
            <UiButton
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              onClick={() => setSelected(null)}
              variant="ghost"
            >
              Đóng
            </UiButton>
          </div>
          <Result id={selected} revision={revision} />
        </section>
      )}
    </>
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
