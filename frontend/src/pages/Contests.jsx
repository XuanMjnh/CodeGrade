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
import { cn } from '../lib/utils';
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
      <div className="contest-arena min-w-0 space-y-4" id="contest-space">
        <ErrorBox error={error || probError || err || detailError} />

        {!c && !detailError && <Loading />}

        {c && (
          <>
            {/* Unified Compact Arena Header */}
            <section className="contest-arena-hero space-y-3 rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
              <div className="contest-arena-topbar flex flex-wrap items-center justify-between gap-2.5">
                <UiButton
                  className="contest-back-btn h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg border border-border/80 bg-card text-foreground hover:bg-muted transition-colors shadow-2xs"
                  onClick={closeContest}
                  variant="outline"
                >
                  <Icon name="fa-solid fa-arrow-left" className="size-3 text-muted-foreground" aria-hidden="true" />
                  <span>{trUI('Quay lại danh sách contest')}</span>
                </UiButton>
                <div className="contest-topbar-badges flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border',
                      state === 'live' && 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
                      state === 'upcoming' && 'bg-amber-50 text-amber-700 border-amber-200/70',
                      state === 'grading' && 'bg-blue-50 text-blue-700 border-blue-200/70',
                      state === 'finished' && 'bg-muted/70 text-muted-foreground border-border/60',
                    )}
                  >
                    {state === 'live' && (
                      <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
                    )}
                    {trUI(labels[state])}
                  </span>
                  <span
                    className={cn(
                      'contest-rated-tag inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border',
                      c.rated
                        ? 'rated bg-amber-50 text-amber-700 border-amber-200/70'
                        : 'unrated bg-muted/60 text-muted-foreground border-border/50',
                    )}
                  >
                    {c.rated ? '★ Rated' : 'Unrated'}
                  </span>
                  <UiButton
                    className="ghost size-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                    onClick={copyContestLink}
                    title={trUI('Sao chép liên kết')}
                    aria-label={trUI('Sao chép liên kết')}
                    variant="ghost"
                  >
                    <Icon name="fa-regular fa-copy" className="size-3.5" aria-hidden="true" />
                  </UiButton>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <h1
                  className="font-heading text-xl sm:text-2xl font-black text-foreground tracking-tight"
                  data-user-content
                >
                  {c.title}
                </h1>
                <div className="contest-arena-chips flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground pt-0.5">
                  <span className="contest-chip inline-flex items-center gap-1.5 font-medium">
                    <Icon name="fa-regular fa-calendar" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                    <span>
                      {trUI('Bắt đầu')}: {formatDate(c.startsAt)}
                    </span>
                  </span>
                  <span className="text-muted-foreground/30" aria-hidden="true">•</span>
                  <span className="contest-chip inline-flex items-center gap-1.5 font-medium">
                    <Icon name="fa-regular fa-calendar-check" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                    <span>
                      {trUI('Kết thúc')}: {formatDate(c.endsAt)}
                    </span>
                  </span>
                  <span className="text-muted-foreground/30" aria-hidden="true">•</span>
                  <span className="contest-chip inline-flex items-center gap-1.5 font-medium">
                    <Icon name="fa-regular fa-clock" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                    <span>
                      {trUI('Thời lượng')}: {formatDuration(c.startsAt, c.endsAt)}
                    </span>
                  </span>
                  <span className="text-muted-foreground/30" aria-hidden="true">•</span>
                  <span className="contest-chip inline-flex items-center gap-1.5 font-medium">
                    <Icon name="fa-solid fa-users" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                    <span>{c.participants?.length || 0} Coder</span>
                  </span>
                  <span className="text-muted-foreground/30" aria-hidden="true">•</span>
                  <span className="contest-chip inline-flex items-center gap-1.5 font-medium">
                    <Icon name="fa-solid fa-file-code" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                    <span>
                      {c.problemCount ?? c.problemIds?.length ?? 0} {trUI('bài')}
                    </span>
                  </span>
                  <span className="text-muted-foreground/30" aria-hidden="true">•</span>
                  <span className="contest-chip inline-flex items-center gap-1.5 font-medium">
                    <Icon
                      name={c.approvalRequired ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'}
                      className="size-3 text-muted-foreground/70"
                      aria-hidden="true"
                    />
                    <span>{trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}</span>
                  </span>
                  {userAcCount > 0 && (
                    <>
                      <span className="text-muted-foreground/30" aria-hidden="true">•</span>
                      <span className="contest-chip inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 ac">
                        <Icon name="fa-solid fa-circle-check" className="size-3" aria-hidden="true" />
                        <span>
                          {trUI('Đã AC')}: {userAcCount}/{c.problemIds?.length || c.problemCount || 0}
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Arena Interactive Layout Grid */}
            <div className="contest-arena-layout grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
              {/* Primary Content (Left) */}
              <div className="contest-arena-main min-w-0 space-y-3.5">
                {/* Status & Participation Action Banner */}
                {user.role === 'CODER' && (
                  <div
                    className={cn(
                      'contest-participant-banner flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs',
                      joined
                        ? state === 'live'
                          ? 'border-emerald-200/80 bg-emerald-50/40 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-200 success text-emerald-800'
                          : 'border-border/70 bg-muted/40 text-foreground'
                        : pending
                          ? 'border-amber-200/80 bg-amber-50/40 text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-200 warning text-amber-900'
                          : 'border-border/70 bg-muted/30 text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-card border border-border/60 text-muted-foreground shadow-2xs">
                        <Icon
                          name={
                            'fa-solid ' +
                            (joined
                              ? state === 'live'
                                ? 'fa-bolt text-emerald-600'
                                : 'fa-circle-check text-emerald-600'
                              : pending
                                ? 'fa-clock text-amber-600'
                                : !ended
                                  ? 'fa-trophy text-amber-600'
                                  : 'fa-flag-checkered text-muted-foreground')
                          }
                          aria-hidden="true"
                        />
                      </div>
                      <div className="min-w-0">
                        <strong className="block font-semibold">
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
                        <p className="text-muted-foreground line-clamp-1">
                          {joined
                            ? state === 'live'
                              ? trUI(
                                  'Hãy bắt đầu giải các bài toán bên dưới để ghi điểm trên bảng xếp hạng.',
                                )
                              : state === 'upcoming'
                                ? trUI(
                                    'Bạn đã đăng ký tham gia cuộc thi này. Hãy chuẩn bị sẵn sàng!',
                                  )
                                : trUI('Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia!')
                            : pending
                              ? trUI('Yêu cầu đăng ký của bạn đang chờ người tổ chức phê duyệt.')
                              : !ended
                                ? trUI('Đăng ký tham gia để thử sức và cải thiện điểm Elo của bạn.')
                                : trUI('Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia!')}
                        </p>
                      </div>
                    </div>

                    {!joined && !pending && !ended && (
                      <UiButton
                        className="contest-join-btn h-8 px-3.5 text-xs font-semibold gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs shrink-0"
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
                        className="contest-join-btn h-8 px-3.5 text-xs font-semibold gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs shrink-0"
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
                  <div className="contest-participant-banner admin flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 text-xs text-emerald-950 dark:text-emerald-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        name="fa-solid fa-shield-halved"
                        className="size-3.5 text-emerald-600 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <span className="font-bold">{trUI('Quyền quản trị')}: </span>
                        <span className="opacity-90">
                          {trUI(
                            'Bạn có toàn quyền xem đề bài, theo dõi bảng điểm và phê duyệt thí sinh.',
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-navigation tabs inside Contest Space */}
                <div
                  className="contest-space-tabs flex flex-wrap gap-1 rounded-xl bg-muted/60 p-1 border border-border/50"
                  role="tablist"
                >
                  <UiButton
                    role="tab"
                    aria-selected={contestTab === 'problems'}
                    className={cn(
                      'contest-space-tab h-8 justify-center gap-2 rounded-lg border-0 px-3 text-xs font-semibold transition-all shadow-none',
                      contestTab === 'problems'
                        ? 'active bg-card text-foreground shadow-2xs border border-border/60'
                        : 'bg-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground',
                    )}
                    onClick={() => setContestTab('problems')}
                    variant="ghost"
                  >
                    <Icon name="fa-solid fa-file-code" className="size-3" aria-hidden="true" />
                    <span>{trUI('Danh sách bài thi')}</span>
                    <span
                      className={cn(
                        'contest-tab-badge ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                        contestTab === 'problems'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted-foreground/15 text-muted-foreground',
                      )}
                    >
                      {c.problemIds?.length || c.problemCount || 0}
                    </span>
                  </UiButton>

                  <UiButton
                    role="tab"
                    aria-selected={contestTab === 'standings'}
                    className={cn(
                      'contest-space-tab h-8 justify-center gap-2 rounded-lg border-0 px-3 text-xs font-semibold transition-all shadow-none',
                      contestTab === 'standings'
                        ? 'active bg-card text-foreground shadow-2xs border border-border/60'
                        : 'bg-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground',
                    )}
                    onClick={() => setContestTab('standings')}
                    variant="ghost"
                  >
                    <Icon name="fa-solid fa-trophy" className="size-3" aria-hidden="true" />
                    <span>{trUI('Bảng điểm trực tiếp')}</span>
                    <span
                      className={cn(
                        'contest-tab-badge ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                        contestTab === 'standings'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted-foreground/15 text-muted-foreground',
                      )}
                    >
                      {detail?.standings?.length || 0}
                    </span>
                  </UiButton>

                  {isOrganizer && c.pending && c.pending.length > 0 && (
                    <UiButton
                      role="tab"
                      aria-selected={contestTab === 'approvals'}
                      className={cn(
                        'contest-space-tab h-8 justify-center gap-2 rounded-lg border-0 px-3 text-xs font-semibold transition-all shadow-none',
                        contestTab === 'approvals'
                          ? 'active bg-card text-foreground shadow-2xs border border-border/60'
                          : 'bg-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground',
                      )}
                      onClick={() => setContestTab('approvals')}
                      variant="ghost"
                    >
                      <Icon name="fa-regular fa-clock" className="size-3" aria-hidden="true" />
                      <span>{trUI('Đăng ký chờ duyệt')}</span>
                      <span className="contest-tab-badge ml-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 px-1.5 py-0.2 text-[10px] font-bold warning">
                        {c.pending.length}
                      </span>
                    </UiButton>
                  )}

                  <UiButton
                    role="tab"
                    aria-selected={contestTab === 'rules'}
                    className={cn(
                      'contest-space-tab h-8 justify-center gap-2 rounded-lg border-0 px-3 text-xs font-semibold transition-all shadow-none',
                      contestTab === 'rules'
                        ? 'active bg-card text-foreground shadow-2xs border border-border/60'
                        : 'bg-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground',
                    )}
                    onClick={() => setContestTab('rules')}
                    variant="ghost"
                  >
                    <Icon name="fa-solid fa-circle-info" className="size-3" aria-hidden="true" />
                    <span>{trUI('Thể lệ & Thông tin')}</span>
                  </UiButton>
                </div>

                {/* Tab 1: Problems List */}
                {contestTab === 'problems' && (
                  <div className="contest-tab-content space-y-3">
                    {c.problemIds && c.problemIds.length > 0 ? (
                      <div className="contest-problems-list space-y-2.5">
                        {c.problemIds.map((pid, i) => {
                          const prob = problems?.find((p) => p.id === pid);
                          const probTitle = c.problemTitles?.[pid] || prob?.title || pid;
                          const isAC = isProblemAC(pid);
                          return (
                            <div
                              className={cn(
                                'contest-problem-card group flex items-center justify-between gap-3 rounded-xl border p-3 sm:p-3.5 transition-all shadow-2xs',
                                isAC
                                  ? 'is-ac bg-emerald-50/25 border-emerald-200/70 dark:bg-emerald-950/15 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200'
                                  : 'bg-card border-border/70 hover:border-border hover:shadow-xs',
                              )}
                              key={pid}
                            >
                              <div className="contest-problem-info flex min-w-0 items-center gap-3">
                                <span
                                  className={cn(
                                    'contest-letter-badge flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold transition-colors',
                                    isAC
                                      ? 'is-ac bg-emerald-100 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60'
                                      : 'bg-muted/80 text-foreground/80 border border-border/60',
                                  )}
                                >
                                  {isAC ? (
                                    <Icon name="fa-solid fa-check" aria-hidden="true" />
                                  ) : (
                                    String.fromCharCode(65 + i)
                                  )}
                                </span>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3
                                      className="contest-problem-title font-heading text-sm sm:text-[15px] font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1"
                                      data-user-content
                                    >
                                      {probTitle}
                                    </h3>
                                    {isAC && (
                                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-[10px] font-bold bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60">
                                        <Icon
                                          name="fa-solid fa-check"
                                          className="size-2.5"
                                          aria-hidden="true"
                                        />
                                        <span>{trUI('Đã AC')}</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="contest-problem-meta flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {prob?.publicId && (
                                      <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50/90 border border-orange-200/80 px-1.5 py-0.2 rounded dark:bg-orange-950/30 dark:border-orange-800/40 dark:text-orange-400">
                                        {prob.publicId}
                                      </span>
                                    )}
                                    {prob?.difficulty && (
                                      <span
                                        className={cn(
                                          'inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold border',
                                          prob.difficulty <= 2
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
                                            : prob.difficulty <= 4
                                              ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40'
                                              : 'bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800/40',
                                        )}
                                      >
                                        {trUI('Mức')} {prob.difficulty}
                                      </span>
                                    )}
                                    <span className="text-muted-foreground/70">
                                      {prob?.category || trUI('Bài tập')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="contest-problem-action shrink-0">
                                <UiButton
                                  className={cn(
                                    'h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg shadow-2xs transition-all',
                                    isAC
                                      ? 'secondary border border-border/80 bg-card text-foreground hover:bg-muted'
                                      : 'primary bg-primary text-primary-foreground hover:bg-primary-hover',
                                  )}
                                  onClick={() => go('/solve/' + pid + '?contest=' + c.id)}
                                  variant={isAC ? 'outline' : 'default'}
                                >
                                  <Icon
                                    name={'fa-solid ' + (isAC ? 'fa-rotate-right' : 'fa-code')}
                                    className="size-3"
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
                      <div className="contest-locked-box rounded-2xl border border-dashed border-border/80 p-8 text-center text-muted-foreground space-y-3 bg-muted/20">
                        <div
                          className="contest-locked-icon mx-auto flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                          aria-hidden="true"
                        >
                          <Icon name="fa-solid fa-lock" />
                        </div>
                        <h3 className="font-heading font-bold text-foreground">
                          {trUI('Đề bài đang được bảo mật')}
                        </h3>
                        <p className="text-xs max-w-sm mx-auto">
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
                            className="primary h-8 px-3.5 text-xs font-semibold gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs"
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
                    <div className="contest-standings-box min-w-0 overflow-x-auto rounded-2xl border border-border/80 bg-card shadow-2xs">
                      <div
                        className="table-wrap min-w-0 overflow-x-auto"
                        role="region"
                        aria-label={trUI('Bảng điểm')}
                        tabIndex={0}
                      >
                        <UiTable>
                          <UiTableHeader>
                            <UiTableRow>
                              <UiTableHead className="w-16 text-center">{trUI('Hạng')}</UiTableHead>
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
                                  className={isMe ? 'my-rank bg-primary/5 font-medium' : ''}
                                >
                                  <UiTableCell className="text-center">
                                    <span className="contest-rank-cell inline-flex items-center justify-center gap-1 font-bold">
                                      {medal ? (
                                        <span className="contest-rank-medal text-base">{medal}</span>
                                      ) : null}
                                      <span>{i + 1}</span>
                                    </span>
                                  </UiTableCell>
                                  <UiTableCell>
                                    <div className="contest-coder-cell flex min-w-0 items-center gap-2.5">
                                      <span className="contest-coder-avatar flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-xs text-primary">
                                        {s.name ? s.name.slice(0, 1).toUpperCase() : 'C'}
                                      </span>
                                      <strong className="font-semibold text-foreground" data-user-content>
                                        {s.name}
                                      </strong>
                                      {isMe && (
                                        <span className="inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                          {trUI('Bạn')}
                                        </span>
                                      )}
                                    </div>
                                  </UiTableCell>
                                  <UiTableCell className="text-right font-bold text-foreground">
                                    {s.score}
                                  </UiTableCell>
                                  <UiTableCell className="text-center">
                                    <span className="badge inline-flex items-center gap-1 rounded-full px-2 py-0.2 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300">
                                      {s.ac}
                                    </span>
                                  </UiTableCell>
                                  <UiTableCell className="text-right font-mono text-xs text-muted-foreground">
                                    {s.penalty}
                                  </UiTableCell>
                                </UiTableRow>
                              );
                            })}
                          </UiTableBody>
                        </UiTable>
                        {(!detail?.standings || detail.standings.length === 0) && (
                          <div className="empty p-8 text-center text-xs text-muted-foreground">
                            {trUI('Chưa có kết quả thi đấu.')}
                          </div>
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
                            className="approval-row flex items-center justify-between gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-2xs"
                            key={uid}
                          >
                            <code className="text-xs font-mono font-semibold px-2 py-1 rounded bg-muted/70">{uid}</code>
                            <div className="inline-group flex flex-wrap items-center gap-2">
                              <UiButton
                                className="primary h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs"
                                disabled={busy}
                                aria-busy={busy}
                                onClick={() => approveUser(uid, true)}
                                variant="default"
                              >
                                <Icon name="fa-solid fa-check" className="size-3" aria-hidden="true" />
                                <span>{trUI('Duyệt')}</span>
                              </UiButton>
                              <UiButton
                                className="secondary h-7 px-2.5 text-xs font-semibold gap-1 rounded-lg border border-border/80 bg-card text-foreground hover:bg-muted"
                                disabled={busy}
                                aria-busy={busy}
                                onClick={() => approveUser(uid, false)}
                                variant="outline"
                              >
                                <Icon name="fa-solid fa-xmark" className="size-3" aria-hidden="true" />
                                <span>{trUI('Từ chối')}</span>
                              </UiButton>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty rounded-xl border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
                          {trUI('Không có yêu cầu chờ duyệt.')}
                        </p>
                      )}
                    </InsightPanel>
                  </div>
                )}

                {/* Tab 4: Rules & Details */}
                {contestTab === 'rules' && (
                  <div className="contest-tab-content space-y-3">
                    <div className="contest-rules-list space-y-2.5">
                      <div className="contest-rule-item flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                          <Icon name="fa-solid fa-award" className="size-3.5" aria-hidden="true" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <h3 className="font-heading font-bold text-foreground text-sm">
                            {trUI('Quy tắc tính điểm & Xếp hạng')}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {trUI(
                              'Mỗi bài nộp AC (Accepted) sẽ được cộng điểm tương ứng. Điểm penalty được tính theo thời gian nộp bài từ lúc bắt đầu contest cộng thêm 10 phút (600s) cho mỗi lần nộp sai trước khi AC.',
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="contest-rule-item flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                          <Icon name="fa-solid fa-chart-line" className="size-3.5" aria-hidden="true" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <h3 className="font-heading font-bold text-foreground text-sm">
                            {trUI('Điểm xếp hạng')}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {c.rated
                              ? trUI('Rated - Kết quả cuộc thi này sẽ được tính vào bảng xếp hạng Elo.')
                              : trUI('Unrated - Kết quả cuộc thi này không làm thay đổi điểm Elo.')}
                          </p>
                        </div>
                      </div>

                      <div className="contest-rule-item flex items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-700 border border-orange-200/60 dark:bg-orange-950/40 dark:text-orange-300">
                          <Icon name="fa-solid fa-door-open" className="size-3.5" aria-hidden="true" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <h3 className="font-heading font-bold text-foreground text-sm">
                            {trUI('Hình thức tham gia')}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {c.approvalRequired
                              ? trUI('Cần phê duyệt từ người tổ chức trước khi tham gia thi đấu.')
                              : trUI('Cuộc thi mở công khai cho tất cả Coder tham gia tự do.')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Column (Right) */}
              <div className="contest-arena-sidebar min-w-0 space-y-4">
                {/* Countdown Card */}
                <div className="contest-sidebar-timer space-y-2.5 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>
                      {trUI(
                        state === 'upcoming'
                          ? 'Bắt đầu sau'
                          : state === 'live'
                            ? 'Thời gian thi còn lại'
                            : labels[state],
                      )}
                    </span>
                    <Icon
                      name={state === 'live' ? 'fa-solid fa-clock' : 'fa-regular fa-hourglass-half'}
                      className="size-3 text-muted-foreground/70"
                      aria-hidden="true"
                    />
                  </div>

                  {['live', 'upcoming'].includes(state) && (
                    <div
                      className={cn(
                        'contest-sidebar-timer-clock flex items-center justify-center py-2.5 px-3 rounded-xl border font-mono text-2xl sm:text-3xl font-black tracking-wider text-center',
                        state === 'live'
                          ? 'bg-orange-50/60 text-orange-600 border-orange-200/80 dark:bg-orange-950/20 dark:border-orange-800/40 dark:text-orange-400'
                          : 'bg-amber-50/60 text-amber-700 border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40 dark:text-amber-400',
                      )}
                    >
                      <TimeLeft withHours deadline={state === 'upcoming' ? c.startsAt : c.endsAt} />
                    </div>
                  )}

                  <p className="text-center text-[11px] text-muted-foreground">
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
                <div className="contest-sidebar-card space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Icon
                      name="fa-solid fa-circle-info"
                      className="size-3 text-muted-foreground/70"
                      aria-hidden="true"
                    />
                    <span>{trUI('Thông tin cuộc thi')}</span>
                  </h4>
                  <dl className="fact-list divide-y divide-border/40 text-xs">
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{trUI('Bắt đầu')}</dt>
                      <dd className="font-medium text-foreground">{formatDate(c.startsAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{trUI('Kết thúc')}</dt>
                      <dd className="font-medium text-foreground">{formatDate(c.endsAt)}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{trUI('Thời lượng')}</dt>
                      <dd className="font-medium text-foreground">
                        {formatDuration(c.startsAt, c.endsAt)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{trUI('Hình thức')}</dt>
                      <dd className="font-medium text-foreground">
                        {trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{trUI('Điểm xếp hạng')}</dt>
                      <dd className="font-medium text-foreground">
                        {c.rated ? (
                          <span className="font-bold text-amber-700 dark:text-amber-400">★ Rated</span>
                        ) : (
                          <span className="text-muted-foreground">Unrated</span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <dt className="text-muted-foreground">{trUI('Thí sinh')}</dt>
                      <dd className="font-medium text-foreground">{c.participants?.length || 0} Coder</dd>
                    </div>
                  </dl>

                  {((user.role === 'CODER' && !joined && !pending && !ended) ||
                    (joined && state === 'live' && c.problemIds?.[0])) && (
                    <div className="contest-sidebar-actions pt-2 border-t border-border/40 flex flex-col gap-2">
                      {user.role === 'CODER' && !joined && !pending && !ended && (
                        <UiButton
                          className="primary w-full h-8 text-xs font-semibold gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs"
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
                          className="primary w-full h-8 text-xs font-semibold gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover shadow-2xs"
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
        <div className="flex items-center gap-3">
          <h2>{trUI('Lịch thi đấu')}</h2>
          <small>
            {rows.length} {trUI('cuộc thi')}
          </small>
        </div>
        {user.role !== 'CODER' && (
          <UiButton
            onClick={() => setShowCreate(!showCreate)}
            className={
              showCreate
                ? 'secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground'
                : 'primary bg-primary text-primary-foreground hover:bg-primary/90'
            }
            variant="outline"
            size="sm"
          >
            <Icon name={'fa-solid ' + (showCreate ? 'fa-xmark' : 'fa-plus')} aria-hidden="true" />
            <span>{showCreate ? trUI('Đóng biểu mẫu') : trUI('Tạo contest')}</span>
          </UiButton>
        )}
      </div>

      <div
        className="tabs flex w-fit max-w-full flex-wrap gap-1 rounded-xl bg-muted/60 p-1 border border-border/50"
        aria-label={trUI('Lọc contest')}
      >
        {[
          ['all', 'Tất cả'],
          ['live', 'Đang diễn ra'],
          ['upcoming', 'Sắp diễn ra'],
          ['mine', 'Của bạn'],
          ['finished', 'Đã kết thúc'],
        ].map(([k, label]) => {
          const isActive = filter === k;
          return (
            <UiButton
              key={k}
              className={cn(
                'h-8 px-3 text-xs font-semibold rounded-lg transition-all border-0 shadow-none',
                isActive
                  ? 'active bg-card text-foreground shadow-2xs border border-border/60 font-bold'
                  : 'bg-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground',
              )}
              aria-pressed={isActive}
              onClick={() => setFilter(k)}
              variant="ghost"
            >
              {trUI(label)}
            </UiButton>
          );
        })}
      </div>

      {!data ? (
        <Loading />
      ) : rows.length ? (
        <div className="contest-cards grid gap-3 lg:grid-cols-2">
          {rows.map((c) => {
            const s = contestState(c, now);
            return (
              <article
                className={cn(
                  'contest-card group relative flex flex-col justify-between rounded-xl border border-border/80 bg-card p-3.5 sm:px-4 sm:py-3.5 text-left transition-all duration-150 hover:border-border hover:shadow-subtle cursor-pointer',
                  'state-' + s,
                )}
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
                <div>
                  {/* Hàng 1: Tiêu đề bên trái, Trạng thái & Rated bên phải */}
                  <div className="contest-card-header flex items-center justify-between gap-2">
                    <h3
                      className="contest-card-title font-heading text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight line-clamp-1"
                      data-user-content
                    >
                      {c.title}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight',
                          s === 'live' && 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
                          s === 'upcoming' && 'bg-amber-50 text-amber-700 border border-amber-200/60',
                          s === 'grading' && 'bg-blue-50 text-blue-700 border border-blue-200/60',
                          s === 'finished' && 'bg-muted/70 text-muted-foreground border border-border/60',
                        )}
                      >
                        {s === 'live' && (
                          <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        )}
                        {trUI(labels[s])}
                      </span>
                      <span
                        className={cn(
                          'contest-rated-tag inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                          c.rated
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-muted/50 text-muted-foreground/60 border border-border/50',
                          c.rated ? 'rated' : 'unrated',
                        )}
                      >
                        {c.rated ? '★ Rated' : 'Unrated'}
                      </span>
                    </div>
                  </div>

                  {/* Hàng 2: Thông tin lịch trình & metadata xếp gọn gàng trên 1 dòng */}
                  <div className="contest-card-meta contest-card-time mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                      <Icon name="fa-regular fa-calendar" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                      <span>{formatDate(c.startsAt)}</span>
                    </span>
                    <span className="text-muted-foreground/40" aria-hidden="true">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="fa-regular fa-clock" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                      <span>{formatDuration(c.startsAt, c.endsAt)}</span>
                    </span>
                    <span className="text-muted-foreground/40" aria-hidden="true">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="fa-solid fa-file-code" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                      <span>{c.problemCount ?? c.problemIds.length} {trUI('bài')}</span>
                    </span>
                    <span className="text-muted-foreground/40" aria-hidden="true">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="fa-solid fa-users" className="size-3 text-muted-foreground/70" aria-hidden="true" />
                      <span>{c.participants.length} Coder</span>
                    </span>
                    <span className="text-muted-foreground/40" aria-hidden="true">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon
                        name={c.approvalRequired ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open'}
                        className="size-3 text-muted-foreground/70"
                        aria-hidden="true"
                      />
                      <span>{trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}</span>
                    </span>
                  </div>
                </div>

                {/* Hàng 3: Chân thẻ với Đồng hồ bên trái & Xem chi tiết bên phải */}
                <div className="contest-card-footer mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                  {['live', 'upcoming'].includes(s) ? (
                    <div
                      className={cn(
                        'contest-card-clock inline-flex items-center gap-1 font-mono text-xs font-semibold',
                        s === 'live' ? 'text-orange-600' : 'text-amber-700',
                        'state-' + s,
                      )}
                    >
                      <Icon
                        name={s === 'live' ? 'clock' : 'hourglass-half'}
                        className="size-3 shrink-0 opacity-80"
                      />
                      <span className="clock-label font-sans text-[11px] text-muted-foreground font-normal">
                        {trUI(s === 'upcoming' ? 'Bắt đầu sau' : 'Còn lại')}:
                      </span>
                      <TimeLeft withHours deadline={s === 'upcoming' ? c.startsAt : c.endsAt} />
                    </div>
                  ) : (
                    <div className="contest-card-clock inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground is-finished">
                      <Icon name="fa-solid fa-flag-checkered" className="size-3 opacity-70" aria-hidden="true" />
                      <span>{trUI(labels[s])}</span>
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1 font-semibold text-primary transition-colors group-hover:text-primary-hover">
                    {trUI('Xem chi tiết →')}
                  </span>
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
