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
import React, { useState, useEffect } from 'react';
import { t as trUI, locale } from '../lib/locale';
import { live } from '../lib/live';
import {
  Heading,
  ErrorBox,
  Loading,
  useResource,
  Badge,
  go,
  Check,
  TimeLeft,
} from '../components/ui';
import { StatGrid, InsightPanel, useNow } from '../components/Insights';
import { contestState, contestInsights } from '../lib/insights';
const formatDate = (v) => {
  if (!v) return '—';
  try {
    return new Date(v).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return new Date(v).toLocaleString();
  }
};
const formatDuration = (startsAt, endsAt) => {
  if (!startsAt || !endsAt) return '—';
  const mins = Math.max(0, Math.round((endsAt - startsAt) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m} ${trUI('phút')}`;
};
const labels = {
  upcoming: 'Sắp diễn ra',
  live: 'Đang diễn ra',
  grading: 'Đang chốt điểm',
  finished: 'Đã kết thúc',
};
export default function Contests({ user, revision, onNotice, contestId }) {
  const [selected, setSelected] = useState(contestId || null);
  const [contestTab, setContestTab] = useState('problems');
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [err, setErr] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    startsAt: '',
    endsAt: '',
    rated: true,
    approvalRequired: false,
    problemIds: [],
  });
  const now = useNow();
  const [categories] = useResource('CATEGORIES', {}, revision);
  const [data, error] = useResource('CONTEST_LIST', {}, revision);
  const [problems, probError] = useResource('PROBLEMS', {}, revision);
  const [submissions] = useResource('SUBMISSIONS', {}, revision);
  const [detail, detailError, setDetail] = useResource(
    selected ? 'CONTEST_GET' : null,
    {
      contestId: selected,
    },
    revision,
  );
  useEffect(() => {
    setSelected(contestId || null);
  }, [contestId]);
  const overview = contestInsights(data || [], now, user.id);
  const rows = (data || [])
    .filter((c) => {
      if (filter === 'all') return true;
      if (filter === 'mine') {
        return c.participants.includes(user.id) || c.pending?.includes(user.id);
      }
      return contestState(c, now) === filter;
    })
    .sort((a, b) => b.startsAt - a.startsAt);

  // If a contest is selected, resolve its data either from detail or from contest list
  const c =
    detail?.contest?.id === selected
      ? detail.contest
      : data?.find((x) => x.id === selected) || null;
  const state = c ? contestState(c, now) : null;
  const joined = c?.participants?.includes(user.id);
  const pending = c?.pending?.includes(user.id);
  const ended = c && now >= c.endsAt;
  const isOrganizer = user.role === 'ADMIN' || c?.authorId === user.id;
  const isProblemAC = (pid) =>
    Boolean(
      submissions?.some(
        (s) =>
          s.problem_id === pid &&
          s.status === 'AC' &&
          (s.contest_id === c?.id || (c?.settled && (!s.contest_id || s.contest_id === c?.id))),
      ) ||
      (c?.settled && problems?.find((p) => p.id === pid)?.solved),
    );
  const userAcCount = (c?.problemIds || []).filter(isProblemAC).length;
  const openContest = (id) => {
    setSelected(id);
    setErr(null);
    go('/contests/' + id);
  };
  const closeContest = () => {
    setSelected(null);
    setErr(null);
    go('/contests');
  };
  const copyContestLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      onNotice(trUI('Đã sao chép liên kết cuộc thi.'));
    } catch (e) {
      onNotice(window.location.href);
    }
  };
  async function create(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await live.call('CONTEST_CREATE', {
        ...form,
        startsAt: Date.parse(form.startsAt),
        endsAt: Date.parse(form.endsAt),
      });
      setShowCreate(false);
      onNotice(trUI('Đã tạo contest.'));
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  }
  async function join() {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await live.call('CONTEST_JOIN', {
        contestId: selected,
      });
      setDetail(res);
      onNotice(trUI('Đã đăng ký contest.'));
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  }
  async function approveUser(uid, approve) {
    if (!selected) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await live.call('CONTEST_APPROVE', {
        contestId: selected,
        userId: uid,
        approve,
      });
      setDetail(res);
      onNotice(trUI(approve ? 'Đã duyệt thí sinh.' : 'Đã từ chối thí sinh.'));
    } catch (e) {
      setErr(e);
    } finally {
      setBusy(false);
    }
  }

  // ==========================================
  // VIEW 1: DEDICATED CONTEST ARENA SPACE
  // ==========================================
  if (selected) {
    return (
      <div className="contest-arena min-w-0 space-y-6" id="contest-space">
        <div className="contest-arena-topbar flex flex-wrap items-center gap-2">
          <UiButton
            className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground contest-back-btn"
            onClick={closeContest}
            variant="outline"
          >
            <Icon name="fa-solid fa-arrow-left" aria-hidden="true" />
            <span>{trUI('Quay lại danh sách contest')}</span>
          </UiButton>
          {c && (
            <div className="contest-topbar-badges flex flex-wrap items-center gap-2">
              <Badge
                tone={
                  state === 'live'
                    ? 'success'
                    : state === 'upcoming'
                      ? 'warning'
                      : state === 'grading'
                        ? 'info'
                        : 'neutral'
                }
              >
                {state === 'live' && (
                  <span
                    className="pulse-dot inline-block size-2 rounded-full bg-emerald-600"
                    aria-hidden="true"
                  />
                )}
                {trUI(labels[state])}
              </Badge>
              <span
                className={
                  'contest-rated-tag inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium ' +
                  (c.rated ? 'rated' : 'unrated')
                }
              >
                {c.rated ? '★ Rated' : 'Unrated'}
              </span>
              <UiButton
                className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
                onClick={copyContestLink}
                title={trUI('Sao chép liên kết')}
                aria-label={trUI('Sao chép liên kết')}
                variant="ghost"
              >
                <Icon name="fa-regular fa-copy" aria-hidden="true" />
              </UiButton>
            </div>
          )}
        </div>

        <ErrorBox error={error || probError || err || detailError} />

        {!c && !detailError && <Loading />}

        {c && (
          <>
            {/* Dedicated Hero Banner for this contest */}
            <section className="contest-arena-hero space-y-4 rounded-[14px] border bg-card p-6">
              <div className="contest-arena-eyebrow">
                <Icon name="fa-solid fa-trophy" aria-hidden="true" />
                <span>CODEGRADE / {trUI('Không gian cuộc thi')}</span>
              </div>
              <h1 data-user-content>{c.title}</h1>
              <div className="contest-arena-chips flex flex-wrap items-center gap-2">
                <div className="contest-chip inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                  <Icon name="fa-regular fa-calendar" aria-hidden="true" />
                  <span>
                    {trUI('Bắt đầu')}: {formatDate(c.startsAt)}
                  </span>
                </div>
                <div className="contest-chip inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                  <Icon name="fa-regular fa-calendar-check" aria-hidden="true" />
                  <span>
                    {trUI('Kết thúc')}: {formatDate(c.endsAt)}
                  </span>
                </div>
                <div className="contest-chip inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                  <Icon name="fa-regular fa-clock" aria-hidden="true" />
                  <span>
                    {trUI('Thời lượng')}: {formatDuration(c.startsAt, c.endsAt)}
                  </span>
                </div>
                <div className="contest-chip inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                  <Icon name="fa-solid fa-users" aria-hidden="true" />
                  <span>{c.participants?.length || 0} Coder</span>
                </div>
                <div className="contest-chip inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                  <Icon name="fa-solid fa-file-code" aria-hidden="true" />
                  <span>
                    {c.problemCount ?? c.problemIds?.length ?? 0} {trUI('bài')}
                  </span>
                </div>
                {userAcCount > 0 && (
                  <div className="contest-chip inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium ac">
                    <Icon name="fa-solid fa-circle-check" aria-hidden="true" />
                    <span>
                      {trUI('Đã AC')}: {userAcCount}/{c.problemIds?.length || c.problemCount || 0}
                    </span>
                  </div>
                )}
                <div className="contest-chip inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
                  <Icon name="fa-solid fa-shield-halved" aria-hidden="true" />
                  <span>{trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}</span>
                </div>
              </div>
            </section>

            {/* Arena Interactive Layout Grid */}
            <div className="contest-arena-layout grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_18rem]">
              {/* Primary Content (Left) */}
              <div className="contest-arena-main min-w-0 space-y-4">
                {/* Status & Participation Action Banner */}
                {user.role === 'CODER' && (
                  <div
                    className={
                      'contest-participant-banner flex flex-wrap items-center gap-2 rounded-lg border bg-accent p-3 text-sm text-accent-foreground ' +
                      (joined
                        ? state === 'live'
                          ? 'success text-emerald-800'
                          : state === 'upcoming'
                            ? 'info'
                            : 'info'
                        : pending
                          ? 'warning text-amber-900'
                          : !ended
                            ? 'callout'
                            : 'info')
                    }
                  >
                    <div className="contest-banner-text">
                      <Icon
                        name={
                          'fa-solid ' +
                          (joined
                            ? state === 'live'
                              ? 'fa-bolt'
                              : 'fa-circle-check'
                            : pending
                              ? 'fa-clock'
                              : !ended
                                ? 'fa-trophy'
                                : 'fa-flag-checkered')
                        }
                        aria-hidden="true"
                      />
                      <div>
                        <strong>
                          {joined
                            ? state === 'live'
                              ? trUI('Cuộc thi đang diễn ra!')
                              : state === 'upcoming'
                                ? trUI('Đã đăng ký - Sẵn sàng')
                                : trUI('Cuộc thi đã kết thúc')
                            : pending
                              ? trUI('Chờ duyệt')
                              : !ended
                                ? trUI('Đăng ký tham gia ngay')
                                : trUI('Cuộc thi đã kết thúc')}
                        </strong>
                        <p>
                          {joined
                            ? state === 'live'
                              ? trUI(
                                  'Cuộc thi đang diễn ra! Hãy bắt đầu giải các bài toán bên dưới để ghi điểm trên bảng xếp hạng.',
                                )
                              : state === 'upcoming'
                                ? trUI(
                                    'Bạn đã đăng ký tham gia cuộc thi này. Hãy chuẩn bị sẵn sàng trước khi cuộc thi bắt đầu!',
                                  )
                                : trUI('Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia!')
                            : pending
                              ? trUI('Yêu cầu đăng ký của bạn đang chờ người tổ chức phê duyệt.')
                              : !ended
                                ? trUI(
                                    'Đăng ký tham gia ngay để thử sức và cải thiện điểm Elo của bạn!',
                                  )
                                : trUI('Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia!')}
                        </p>
                      </div>
                    </div>

                    {!joined && !pending && !ended && (
                      <UiButton
                        className="primary bg-primary text-primary-foreground hover:bg-primary/90 contest-join-btn"
                        onClick={join}
                        disabled={busy}
                        aria-busy={busy}
                        variant="default"
                      >
                        <Icon name="fa-solid fa-user-plus" aria-hidden="true" />
                        <span>{trUI('Đăng ký tham gia')}</span>
                      </UiButton>
                    )}

                    {joined && state === 'live' && c.problemIds?.length > 0 && (
                      <UiButton
                        className="primary bg-primary text-primary-foreground hover:bg-primary/90 contest-join-btn"
                        onClick={() => {
                          setContestTab('problems');
                          go('/solve/' + c.problemIds[0] + '?contest=' + c.id);
                        }}
                        variant="default"
                      >
                        <Icon name="fa-solid fa-play" aria-hidden="true" />
                        <span>{trUI('Làm bài ngay')}</span>
                      </UiButton>
                    )}
                  </div>
                )}

                {isOrganizer && (
                  <div className="contest-participant-banner flex flex-wrap items-center gap-2 rounded-lg border bg-accent p-3 text-sm text-accent-foreground admin">
                    <div className="contest-banner-text">
                      <Icon name="fa-solid fa-shield-halved" aria-hidden="true" />
                      <div>
                        <strong>{trUI('Quyền quản trị')}</strong>
                        <p>
                          {trUI(
                            'Quản trị cuộc thi: Bạn có toàn quyền xem đề bài, theo dõi bảng điểm và phê duyệt thí sinh.',
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-navigation tabs inside Contest Space */}
                <div
                  className="contest-space-tabs flex flex-wrap gap-1 rounded-lg bg-muted p-1"
                  role="tablist"
                >
                  <UiButton
                    role="tab"
                    aria-selected={contestTab === 'problems'}
                    className={
                      'contest-space-tab h-9 justify-center gap-2 rounded-md border-0 bg-transparent px-3 text-sm font-medium text-muted-foreground shadow-none hover:bg-card hover:text-foreground ' +
                      (contestTab === 'problems'
                        ? 'active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                        : '')
                    }
                    onClick={() => setContestTab('problems')}
                    variant="outline"
                  >
                    <Icon name="fa-solid fa-file-code" aria-hidden="true" />
                    <span>{trUI('Danh sách bài thi')}</span>
                    <span className="contest-tab-badge ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {c.problemIds?.length || c.problemCount || 0}
                    </span>
                  </UiButton>

                  <UiButton
                    role="tab"
                    aria-selected={contestTab === 'standings'}
                    className={
                      'contest-space-tab h-9 justify-center gap-2 rounded-md border-0 bg-transparent px-3 text-sm font-medium text-muted-foreground shadow-none hover:bg-card hover:text-foreground ' +
                      (contestTab === 'standings'
                        ? 'active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                        : '')
                    }
                    onClick={() => setContestTab('standings')}
                    variant="outline"
                  >
                    <Icon name="fa-solid fa-trophy" aria-hidden="true" />
                    <span>{trUI('Bảng điểm trực tiếp')}</span>
                    <span className="contest-tab-badge ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                      {detail?.standings?.length || 0}
                    </span>
                  </UiButton>

                  {isOrganizer && c.pending && c.pending.length > 0 && (
                    <UiButton
                      role="tab"
                      aria-selected={contestTab === 'approvals'}
                      className={
                        'contest-space-tab h-9 justify-center gap-2 rounded-md border-0 bg-transparent px-3 text-sm font-medium text-muted-foreground shadow-none hover:bg-card hover:text-foreground ' +
                        (contestTab === 'approvals'
                          ? 'active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                          : '')
                      }
                      onClick={() => setContestTab('approvals')}
                      variant="outline"
                    >
                      <Icon name="fa-regular fa-clock" aria-hidden="true" />
                      <span>{trUI('Đăng ký chờ duyệt')}</span>
                      <span className="contest-tab-badge ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-medium warning text-amber-900">
                        {c.pending.length}
                      </span>
                    </UiButton>
                  )}

                  <UiButton
                    role="tab"
                    aria-selected={contestTab === 'rules'}
                    className={
                      'contest-space-tab h-9 justify-center gap-2 rounded-md border-0 bg-transparent px-3 text-sm font-medium text-muted-foreground shadow-none hover:bg-card hover:text-foreground ' +
                      (contestTab === 'rules'
                        ? 'active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                        : '')
                    }
                    onClick={() => setContestTab('rules')}
                    variant="outline"
                  >
                    <Icon name="fa-solid fa-circle-info" aria-hidden="true" />
                    <span>{trUI('Thể lệ & Thông tin')}</span>
                  </UiButton>
                </div>

                {/* Tab 1: Problems List */}
                {contestTab === 'problems' && (
                  <div className="contest-tab-content space-y-4">
                    {c.problemIds && c.problemIds.length > 0 ? (
                      <div className="contest-problems-list space-y-3">
                        {c.problemIds.map((pid, i) => {
                          const prob = problems?.find((p) => p.id === pid);
                          const probTitle = c.problemTitles?.[pid] || prob?.title || pid;
                          const isAC = isProblemAC(pid);
                          return (
                            <div
                              className={
                                'contest-problem-card flex flex-wrap items-center justify-between gap-4 rounded-[14px] border bg-card p-4' +
                                (isAC ? ' is-ac text-emerald-800' : '')
                              }
                              key={pid}
                            >
                              <div className="contest-problem-info flex min-w-0 items-center gap-3">
                                <span
                                  className={
                                    'contest-letter-badge flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted font-mono text-xs font-semibold' +
                                    (isAC ? ' is-ac text-emerald-800' : '')
                                  }
                                >
                                  {isAC ? (
                                    <Icon name="fa-solid fa-check" aria-hidden="true" />
                                  ) : (
                                    String.fromCharCode(65 + i)
                                  )}
                                </span>
                                <div>
                                  <div className="inline-group flex flex-wrap items-center gap-2 gap-2 items-center flex-wrap">
                                    <h3
                                      className="contest-problem-title font-semibold text-foreground"
                                      data-user-content
                                    >
                                      {probTitle}
                                    </h3>
                                    {isAC && (
                                      <Badge tone="success">
                                        <Icon name="fa-solid fa-check" aria-hidden="true" />{' '}
                                        {trUI('Đã AC')}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="contest-problem-meta mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {prob?.publicId && <span>{prob.publicId} · </span>}
                                    {prob?.difficulty && (
                                      <span>
                                        {trUI('Mức')} {prob.difficulty} ·{' '}
                                      </span>
                                    )}
                                    <span>{prob?.category || trUI('Bài tập')}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="contest-problem-action">
                                <UiButton
                                  className={
                                    isAC
                                      ? 'secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground'
                                      : 'primary bg-primary text-primary-foreground hover:bg-primary/90'
                                  }
                                  onClick={() => go('/solve/' + pid + '?contest=' + c.id)}
                                  variant="outline"
                                >
                                  <Icon
                                    name={'fa-solid ' + (isAC ? 'fa-rotate-right' : 'fa-code')}
                                    aria-hidden="true"
                                  />
                                  <span>{isAC ? trUI('Làm lại →') : trUI('Làm bài →')}</span>
                                </UiButton>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="contest-locked-box rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
                        <div className="contest-locked-icon" aria-hidden="true">
                          <Icon name="fa-solid fa-lock" />
                        </div>
                        <h3>{trUI('Đề bài đang được bảo mật')}</h3>
                        <p>
                          {state === 'upcoming'
                            ? trUI('Đề bài chỉ mở cho người đã đăng ký khi cuộc thi bắt đầu.')
                            : !joined && !ended
                              ? trUI(
                                  'Đăng ký tham gia ngay để thử sức và cải thiện điểm Elo của bạn!',
                                )
                              : trUI('Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia!')}
                        </p>
                        {!joined && !ended && user.role === 'CODER' && (
                          <UiButton
                            className="primary bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={join}
                            disabled={busy}
                            aria-busy={busy}
                            variant="default"
                          >
                            <Icon name="fa-solid fa-user-plus" aria-hidden="true" />
                            <span>{trUI('Đăng ký tham gia')}</span>
                          </UiButton>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Standings */}
                {contestTab === 'standings' && (
                  <div className="contest-tab-content space-y-4">
                    <div className="contest-standings-box min-w-0 overflow-x-auto rounded-[14px] border bg-card">
                      <div
                        className="table-wrap min-w-0 overflow-x-auto rounded-[14px] border bg-card"
                        role="region"
                        aria-label={trUI('Bảng điểm')}
                        tabIndex={0}
                      >
                        <UiTable>
                          <UiTableHeader>
                            <UiTableRow>
                              <UiTableHead className="w-20">{trUI('Hạng')}</UiTableHead>
                              <UiTableHead>{trUI('Coder')}</UiTableHead>
                              <UiTableHead className="text-right">{trUI('Điểm')}</UiTableHead>
                              <UiTableHead className="text-center">AC</UiTableHead>
                              <UiTableHead className="text-right">Penalty (s)</UiTableHead>
                            </UiTableRow>
                          </UiTableHeader>
                          <UiTableBody>
                            {detail?.standings?.map((s, i) => {
                              const isMe = s.userId === user.id;
                              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                              return (
                                <UiTableRow
                                  key={s.userId}
                                  className={isMe ? 'my-rank bg-accent/60' : ''}
                                >
                                  <UiTableCell>
                                    <span className="contest-rank-cell">
                                      {medal ? (
                                        <span className="contest-rank-medal">{medal}</span>
                                      ) : null}
                                      <span>{i + 1}</span>
                                    </span>
                                  </UiTableCell>
                                  <UiTableCell>
                                    <div className="contest-coder-cell flex min-w-0 items-center gap-3">
                                      <span className="contest-coder-avatar flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-primary">
                                        {s.name ? s.name.slice(0, 1).toUpperCase() : 'C'}
                                      </span>
                                      <strong data-user-content>{s.name}</strong>
                                      {isMe && <Badge tone="info">{trUI('Bạn')}</Badge>}
                                    </div>
                                  </UiTableCell>
                                  <UiTableCell className="text-right font-bold">
                                    {s.score}
                                  </UiTableCell>
                                  <UiTableCell className="text-center">
                                    <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium success text-emerald-800">
                                      {s.ac}
                                    </span>
                                  </UiTableCell>
                                  <UiTableCell className="text-right font-mono">
                                    {s.penalty}
                                  </UiTableCell>
                                </UiTableRow>
                              );
                            })}
                          </UiTableBody>
                        </UiTable>
                        {(!detail?.standings || detail.standings.length === 0) && (
                          <p className="empty rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
                            {trUI('Chưa có kết quả thi đấu.')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Approvals (Admin/Author only) */}
                {contestTab === 'approvals' && isOrganizer && (
                  <div className="contest-tab-content space-y-4">
                    <InsightPanel title="Đăng ký chờ duyệt">
                      {c.pending && c.pending.length > 0 ? (
                        c.pending.map((uid) => (
                          <div
                            className="approval-row flex items-start justify-between gap-3 rounded-lg border bg-card p-4"
                            key={uid}
                          >
                            <code>{uid}</code>
                            <div className="inline-group flex flex-wrap items-center gap-2">
                              <UiButton
                                className="primary bg-primary text-primary-foreground hover:bg-primary/90"
                                disabled={busy}
                                aria-busy={busy}
                                onClick={() => approveUser(uid, true)}
                                variant="default"
                              >
                                <Icon name="fa-solid fa-check" aria-hidden="true" />
                                <span>{trUI('Duyệt')}</span>
                              </UiButton>
                              <UiButton
                                className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
                                disabled={busy}
                                aria-busy={busy}
                                onClick={() => approveUser(uid, false)}
                                variant="outline"
                              >
                                <Icon name="fa-solid fa-xmark" aria-hidden="true" />
                                <span>{trUI('Từ chối')}</span>
                              </UiButton>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty rounded-[14px] border border-dashed p-8 text-center text-muted-foreground">
                          {trUI('Không có yêu cầu chờ duyệt.')}
                        </p>
                      )}
                    </InsightPanel>
                  </div>
                )}

                {/* Tab 4: Rules & Details */}
                {contestTab === 'rules' && (
                  <div className="contest-tab-content space-y-4">
                    <div className="contest-rules-list space-y-3">
                      <div className="contest-rule-item flex items-start justify-between gap-3 rounded-lg border bg-card p-4">
                        <h3>
                          <Icon name="fa-solid fa-award" aria-hidden="true" />{' '}
                          {trUI('Quy tắc tính điểm & Xếp hạng')}
                        </h3>
                        <p>
                          {trUI(
                            'Mỗi bài nộp AC (Accepted) sẽ được cộng điểm tương ứng. Điểm penalty được tính theo thời gian nộp bài từ lúc bắt đầu contest cộng thêm 10 phút (600s) cho mỗi lần nộp sai trước khi AC.',
                          )}
                        </p>
                      </div>

                      <div className="contest-rule-item flex items-start justify-between gap-3 rounded-lg border bg-card p-4">
                        <h3>
                          <Icon name="fa-solid fa-chart-line" aria-hidden="true" />{' '}
                          {trUI('Điểm xếp hạng')}
                        </h3>
                        <p>
                          {c.rated
                            ? trUI('Elo ch? thay d?i t? k?t qu? Contest c tnh di?m.') ||
                              trUI('Rated (cập nhật Elo)')
                            : trUI('Unrated - Kết quả cuộc thi này không làm thay đổi điểm Elo.')}
                        </p>
                      </div>

                      <div className="contest-rule-item flex items-start justify-between gap-3 rounded-lg border bg-card p-4">
                        <h3>
                          <Icon name="fa-solid fa-door-open" aria-hidden="true" />{' '}
                          {trUI('Hình thức tham gia')}
                        </h3>
                        <p>
                          {c.approvalRequired
                            ? trUI('Cần phê duyệt từ người tổ chức trước khi tham gia thi đấu.')
                            : trUI('Cuộc thi mở công khai cho tất cả Coder tham gia tự do.')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Column (Right) */}
              <div className="contest-arena-sidebar min-w-0 space-y-4">
                {/* Countdown Card */}
                <div className="contest-sidebar-timer space-y-3 rounded-[14px] border bg-card p-5">
                  <h3>
                    {trUI(
                      state === 'upcoming'
                        ? 'Bắt đầu sau'
                        : state === 'live'
                          ? 'Thời gian thi còn lại'
                          : labels[state],
                    )}
                  </h3>
                  {['live', 'upcoming'].includes(state) && (
                    <TimeLeft withHours deadline={state === 'upcoming' ? c.startsAt : c.endsAt} />
                  )}
                  <p>
                    {trUI(
                      state === 'upcoming'
                        ? 'Chuẩn bị trước khi cuộc thi bắt đầu'
                        : state === 'live'
                          ? 'Cuộc thi đang diễn ra!'
                          : 'Cuộc thi đã kết thúc',
                    )}
                  </p>
                </div>

                {/* Facts Card */}
                <div className="contest-sidebar-card space-y-3 rounded-[14px] border bg-card p-5">
                  <h4>{trUI('Thông tin cuộc thi')}</h4>
                  <dl className="fact-list space-y-3 text-sm [&>li]:flex [&>li]:items-start [&>li]:gap-2">
                    <div>
                      <dt>{trUI('Bắt đầu')}</dt>
                      <dd>{formatDate(c.startsAt)}</dd>
                    </div>
                    <div>
                      <dt>{trUI('Kết thúc')}</dt>
                      <dd>{formatDate(c.endsAt)}</dd>
                    </div>
                    <div>
                      <dt>{trUI('Thời lượng')}</dt>
                      <dd>{formatDuration(c.startsAt, c.endsAt)}</dd>
                    </div>
                    <div>
                      <dt>{trUI('Hình thức tham gia')}</dt>
                      <dd>{trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}</dd>
                    </div>
                    <div>
                      <dt>{trUI('Điểm xếp hạng')}</dt>
                      <dd>{c.rated ? 'Rated' : 'Unrated'}</dd>
                    </div>
                    <div>
                      <dt>{trUI('Thí sinh')}</dt>
                      <dd>{c.participants?.length || 0} Coder</dd>
                    </div>
                  </dl>

                  <div className="contest-sidebar-actions flex flex-wrap items-center gap-2">
                    {user.role === 'CODER' && !joined && !pending && !ended && (
                      <UiButton
                        className="primary bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={join}
                        disabled={busy}
                        aria-busy={busy}
                        variant="default"
                      >
                        <Icon name="fa-solid fa-user-plus" aria-hidden="true" />
                        <span>{trUI('Đăng ký tham gia')}</span>
                      </UiButton>
                    )}

                    {joined && state === 'live' && c.problemIds?.[0] && (
                      <UiButton
                        className="primary bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                          setContestTab('problems');
                          go('/solve/' + c.problemIds[0] + '?contest=' + c.id);
                        }}
                        variant="default"
                      >
                        <Icon name="fa-solid fa-play" aria-hidden="true" />
                        <span>{trUI('Làm bài ngay')}</span>
                      </UiButton>
                    )}

                    <UiButton
                      className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
                      onClick={closeContest}
                      variant="outline"
                    >
                      <Icon name="fa-solid fa-arrow-left" aria-hidden="true" />
                      <span>{trUI('Quay lại danh sách')}</span>
                    </UiButton>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ==========================================
  // VIEW 2: CONTEST LIST VIEW (ALL CONTESTS)
  // ==========================================
  return (
    <>
      <Heading
        kind="contest"
        title={trUI('Đấu trường thuật toán')}
        highlight={{
          label: trUI('Cuộc thi tiếp theo'),
          value: overview.next?.title || trUI('Chưa có lịch thi mới'),
          userContent: true,
          detail: overview.next ? formatDate(overview.next.startsAt) : undefined,
          onClick: overview.next ? () => openContest(overview.next.id) : undefined,
        }}
        action={
          user.role !== 'CODER' ? (
            <UiButton
              onClick={() => setShowCreate(!showCreate)}
              className={
                showCreate
                  ? 'secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground'
                  : 'primary bg-primary text-primary-foreground hover:bg-primary/90'
              }
              variant="outline"
            >
              <Icon name={'fa-solid ' + (showCreate ? 'fa-xmark' : 'fa-plus')} aria-hidden="true" />
              <span>{showCreate ? trUI('Đóng biểu mẫu') : trUI('Tạo contest')}</span>
            </UiButton>
          ) : (
            <ActionLink asChild variant="outline">
              <a
                className="button secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
                href="#/practice"
              >
                <Icon name="fa-solid fa-dumbbell" aria-hidden="true" />
                <span>{trUI('Luyện tập trước kỳ thi')}</span>
              </a>
            </ActionLink>
          )
        }
      >
        {trUI('Chọn cuộc thi, theo dõi lịch bắt đầu và thử sức trên bảng điểm trực tiếp.')}
      </Heading>

      <StatGrid
        className="contest-stats-grid grid min-w-0 gap-4 sm:grid-cols-2"
        label={trUI('Tổng quan contest')}
        items={[
          {
            label: trUI('Đang diễn ra'),
            value: data ? overview.live : null,
            tone: 'live',
            icon: <Icon name="fa-solid fa-bolt" aria-hidden="true" />,
            badge:
              overview.live > 0 ? (
                <span className="stat-pill-live ml-auto rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  <span className="pulse-dot inline-block size-2 rounded-full bg-emerald-600" />{' '}
                  LIVE
                </span>
              ) : null,
            note: trUI(overview.live > 0 ? 'Đang mở làm bài' : 'Chưa có cuộc thi'),
            active: filter === 'live',
            onClick: () => setFilter(filter === 'live' ? 'all' : 'live'),
          },
          {
            label: trUI('Sắp diễn ra'),
            value: data ? overview.upcoming : null,
            tone: 'upcoming',
            icon: <Icon name="fa-regular fa-calendar-check" aria-hidden="true" />,
            note: trUI('Lịch thi sắp tới'),
            active: filter === 'upcoming',
            onClick: () => setFilter(filter === 'upcoming' ? 'all' : 'upcoming'),
          },
          {
            label: trUI('Đã tham gia'),
            value: data ? overview.joined : null,
            tone: 'joined',
            icon: <Icon name="fa-solid fa-trophy" aria-hidden="true" />,
            note: trUI('Cuộc thi của bạn'),
            active: filter === 'mine',
            onClick: () => setFilter(filter === 'mine' ? 'all' : 'mine'),
          },
          {
            label: trUI('Chờ duyệt'),
            value: data ? overview.pending : null,
            tone: 'pending',
            icon: <Icon name="fa-regular fa-hourglass-half" aria-hidden="true" />,
            note: trUI('Đang chờ xét duyệt'),
            active: filter === 'mine' && overview.pending > 0,
            onClick: () => setFilter(filter === 'mine' ? 'all' : 'mine'),
          },
        ]}
      />

      <ErrorBox error={error || probError || err} />

      {/* Create Contest Form */}
      {showCreate && (
        <form
          className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad sm:p-6 contest-create space-y-4 p-5"
          onSubmit={create}
        >
          <div className="inline-group between flex flex-wrap items-center justify-between gap-3">
            <h2>{trUI('Tạo cuộc thi mới')}</h2>
            <UiButton
              type="button"
              className="ghost bg-transparent text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
              onClick={() => setShowCreate(false)}
              aria-label={trUI('Đóng')}
              variant="ghost"
            >
              <Icon name="fa-solid fa-xmark" aria-hidden="true" />
            </UiButton>
          </div>

          <UiLabel className="grid gap-2 text-sm font-medium">
            {trUI('Tên contest')}
            <UiInput
              required
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              placeholder={trUI('Ví dụ: CodeGrade Championship 2026')}
            />
          </UiLabel>

          <div className="two-cols grid min-w-0 gap-4 sm:grid-cols-2">
            <UiLabel className="grid gap-2 text-sm font-medium">
              {trUI('Bắt đầu (giờ máy của bạn)')}
              <UiInput
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    startsAt: e.target.value,
                  })
                }
              />
            </UiLabel>
            <UiLabel className="grid gap-2 text-sm font-medium">
              {trUI('Kết thúc')}
              <UiInput
                required
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) =>
                  setForm({
                    ...form,
                    endsAt: e.target.value,
                  })
                }
              />
            </UiLabel>
          </div>

          <div className="inline-group flex flex-wrap items-center gap-2 mt-2">
            <Check
              label={trUI('Rated (cập nhật Elo)')}
              checked={form.rated}
              onChange={(v) =>
                setForm({
                  ...form,
                  rated: v,
                })
              }
            />
            <Check
              label={trUI('Cần phê duyệt')}
              checked={form.approvalRequired}
              onChange={(v) =>
                setForm({
                  ...form,
                  approvalRequired: v,
                })
              }
            />
          </div>

          <div className="subheading my-6 flex flex-wrap items-center justify-between gap-4 [&_h2]:text-lg [&_h2]:text-success [&_small]:text-xs [&_small]:text-muted-foreground">
            <h3>{trUI('Chọn bài')}</h3>
            <span className="badge inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium">
              {form.problemIds.length} {trUI('bài đã chọn')}
            </span>
          </div>

          <UiNativeSelect
            aria-label={trUI('Lọc danh mục cho contest')}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">{trUI('Tất cả category')}</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </UiNativeSelect>

          <div className="problem-checks grid max-h-72 gap-2 overflow-y-auto rounded-lg border p-3">
            {problems
              ?.filter((p) => !category || p.category_id === category)
              .map((p) => (
                <Check
                  key={p.id}
                  label={
                    p.publicId +
                    ' · ' +
                    p.title +
                    ' · ' +
                    trUI(p.status === 'draft' ? 'Bản nháp' : 'Đã công bố')
                  }
                  checked={form.problemIds.includes(p.id)}
                  onChange={(yes) =>
                    setForm({
                      ...form,
                      problemIds: yes
                        ? [...form.problemIds, p.id]
                        : form.problemIds.filter((id) => id !== p.id),
                    })
                  }
                />
              ))}
          </div>

          <div className="inline-group flex flex-wrap items-center gap-2 mt-4">
            <UiButton
              className="primary bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={busy}
              aria-busy={busy}
              variant="default"
            >
              <Icon name="fa-solid fa-plus" aria-hidden="true" />
              <span>{trUI('Tạo contest')}</span>
            </UiButton>
            <UiButton
              type="button"
              className="secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
              onClick={() => setShowCreate(false)}
              variant="outline"
            >
              {trUI('Hủy')}
            </UiButton>
          </div>
        </form>
      )}

      {/* Contest List Section */}
      <div className="subheading my-6 flex flex-wrap items-center justify-between gap-4 [&_h2]:text-lg [&_h2]:text-success [&_small]:text-xs [&_small]:text-muted-foreground">
        <h2>{trUI('Lịch thi đấu')}</h2>
        <small>
          {rows.length} {trUI('cuộc thi')}
        </small>
      </div>

      <div
        className="tabs flex w-fit max-w-full flex-wrap gap-1 rounded-[14px] border bg-muted p-1.5 [&_button]:border [&_button]:border-transparent [&_button]:bg-transparent [&_button]:text-muted-foreground [&_button[aria-pressed=true]]:border-action-text [&_button[aria-pressed=true]]:bg-action-soft [&_button[aria-pressed=true]]:text-action-text [&_button[aria-pressed=true]]:ring-0"
        aria-label={trUI('Lọc contest')}
      >
        {[
          ['all', 'Tất cả'],
          ['live', 'Đang diễn ra'],
          ['upcoming', 'Sắp diễn ra'],
          ['mine', 'Của bạn'],
          ['finished', 'Đã kết thúc'],
        ].map(([k, label]) => (
          <UiButton
            key={k}
            className={
              filter === k
                ? 'active border-primary/40 bg-accent text-accent-foreground ring-1 ring-primary/15'
                : ''
            }
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            variant="default"
          >
            {trUI(label)}
          </UiButton>
        ))}
      </div>

      {!data ? (
        <Loading />
      ) : rows.length ? (
        <div className="contest-cards grid gap-4 lg:grid-cols-2">
          {rows.map((c) => {
            const s = contestState(c, now);
            return (
              <article
                className={'contest-card space-y-4 rounded-[14px] border bg-card p-5 state-' + s}
                key={c.id}
                onClick={() => openContest(c.id)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openContest(c.id);
                  }
                }}
              >
                <div className="contest-card-header items-start">
                  <Badge
                    tone={
                      s === 'live'
                        ? 'success'
                        : s === 'upcoming'
                          ? 'warning'
                          : s === 'grading'
                            ? 'info'
                            : 'neutral'
                    }
                  >
                    {s === 'live' && (
                      <span
                        className="pulse-dot inline-block size-2 rounded-full bg-emerald-600"
                        aria-hidden="true"
                      />
                    )}
                    {trUI(labels[s])}
                  </Badge>
                  <span
                    className={
                      'contest-rated-tag inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium ' +
                      (c.rated ? 'rated' : 'unrated')
                    }
                  >
                    {c.rated ? '★ Rated' : 'Unrated'}
                  </span>
                </div>

                <h3 className="contest-card-title font-semibold text-foreground" data-user-content>
                  {c.title}
                </h3>

                <div className="contest-card-time flex items-center gap-2 rounded-lg bg-muted/60 p-3">
                  <Icon name="fa-regular fa-calendar" aria-hidden="true" />
                  <span>{formatDate(c.startsAt)}</span>
                </div>

                {['live', 'upcoming'].includes(s) ? (
                  <div
                    className={
                      'contest-card-clock inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium state-' +
                      s
                    }
                  >
                    <span className="clock-label text-xs text-muted-foreground">
                      {trUI(s === 'upcoming' ? 'Bắt đầu sau' : 'Còn lại')}
                    </span>
                    <TimeLeft withHours deadline={s === 'upcoming' ? c.startsAt : c.endsAt} />
                  </div>
                ) : (
                  <div className="contest-card-clock inline-flex items-center gap-1.5 rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium is-finished">
                    <Icon name="fa-solid fa-flag-checkered" aria-hidden="true" />
                    <span>{trUI(labels[s])}</span>
                  </div>
                )}

                <div className="contest-card-meta mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    <Icon name="fa-solid fa-file-code" aria-hidden="true" />{' '}
                    {c.problemCount ?? c.problemIds.length} {trUI('bài')}
                  </span>
                  <span>
                    <Icon name="fa-solid fa-users" aria-hidden="true" /> {c.participants.length}{' '}
                    Coder
                  </span>
                  <span>
                    <Icon name="fa-solid fa-lock" aria-hidden="true" />{' '}
                    {trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}
                  </span>
                </div>

                <div className="contest-card-footer flex flex-wrap items-center justify-between gap-3">
                  <span>{trUI('Xem chi tiết →')}</span>
                  <Icon name="fa-solid fa-arrow-right" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty border-dashed p-8 text-center paper rounded-[14px] border bg-card text-card-foreground shadow-xs">
          {trUI('Chưa có cuộc thi phù hợp.')}
        </div>
      )}
    </>
  );
}
