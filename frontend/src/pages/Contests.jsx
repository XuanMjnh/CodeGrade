import React, { useState, useEffect } from 'react';
import { t as trUI, locale } from '../lib/locale';
import { live } from '../lib/live';
import { Heading, ErrorBox, Loading, useResource, Badge, go, Check, TimeLeft } from '../components/ui';
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
    { contestId: selected },
    revision
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
          (s.contest_id === c?.id || (c?.settled && (!s.contest_id || s.contest_id === c?.id)))
      ) || (c?.settled && problems?.find((p) => p.id === pid)?.solved)
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
      const res = await live.call('CONTEST_JOIN', { contestId: selected });
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
      <div className="contest-arena" id="contest-space">
        <div className="contest-arena-topbar">
          <button className="secondary contest-back-btn" onClick={closeContest}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            <span>{trUI('Quay lại danh sách contest')}</span>
          </button>
          {c && (
            <div className="contest-topbar-badges">
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
                {state === 'live' && <span className="pulse-dot" aria-hidden="true" />}
                {trUI(labels[state])}
              </Badge>
              <span className={'contest-rated-tag ' + (c.rated ? 'rated' : 'unrated')}>
                {c.rated ? '★ Rated' : 'Unrated'}
              </span>
              <button
                className="ghost"
                onClick={copyContestLink}
                title={trUI('Sao chép liên kết')}
                aria-label={trUI('Sao chép liên kết')}
              >
                <i className="fa-regular fa-copy" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <ErrorBox error={error || probError || err || detailError} />

        {!c && !detailError && <Loading />}

        {c && (
          <>
            {/* Dedicated Hero Banner for this contest */}
            <section className="contest-arena-hero">
              <div className="contest-arena-eyebrow">
                <i className="fa-solid fa-trophy" aria-hidden="true" />
                <span>CODEGRADE / {trUI('Không gian cuộc thi')}</span>
              </div>
              <h1 data-user-content>{c.title}</h1>
              <div className="contest-arena-chips">
                <div className="contest-chip">
                  <i className="fa-regular fa-calendar" aria-hidden="true" />
                  <span>
                    {trUI('Bắt đầu')}: {formatDate(c.startsAt)}
                  </span>
                </div>
                <div className="contest-chip">
                  <i className="fa-regular fa-calendar-check" aria-hidden="true" />
                  <span>
                    {trUI('Kết thúc')}: {formatDate(c.endsAt)}
                  </span>
                </div>
                <div className="contest-chip">
                  <i className="fa-regular fa-clock" aria-hidden="true" />
                  <span>
                    {trUI('Thời lượng')}: {formatDuration(c.startsAt, c.endsAt)}
                  </span>
                </div>
                <div className="contest-chip">
                  <i className="fa-solid fa-users" aria-hidden="true" />
                  <span>{c.participants?.length || 0} Coder</span>
                </div>
                <div className="contest-chip">
                  <i className="fa-solid fa-file-code" aria-hidden="true" />
                  <span>
                    {c.problemCount ?? c.problemIds?.length ?? 0} {trUI('bài')}
                  </span>
                </div>
                {userAcCount > 0 && (
                  <div className="contest-chip ac">
                    <i className="fa-solid fa-circle-check" aria-hidden="true" />
                    <span>
                      {trUI('Đã AC')}: {userAcCount}/{c.problemIds?.length || c.problemCount || 0}
                    </span>
                  </div>
                )}
                <div className="contest-chip">
                  <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                  <span>{trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}</span>
                </div>
              </div>
            </section>

            {/* Arena Interactive Layout Grid */}
            <div className="contest-arena-layout">
              {/* Primary Content (Left) */}
              <div className="contest-arena-main">
                {/* Status & Participation Action Banner */}
                {user.role === 'CODER' && (
                  <div
                    className={
                      'contest-participant-banner ' +
                      (joined
                        ? state === 'live'
                          ? 'success'
                          : state === 'upcoming'
                          ? 'info'
                          : 'info'
                        : pending
                        ? 'warning'
                        : !ended
                        ? 'callout'
                        : 'info')
                    }
                  >
                    <div className="contest-banner-text">
                      <i
                        className={
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
                              ? trUI('Cuộc thi đang diễn ra! Hãy bắt đầu giải các bài toán bên dưới để ghi điểm trên bảng xếp hạng.')
                              : state === 'upcoming'
                              ? trUI('Bạn đã đăng ký tham gia cuộc thi này. Hãy chuẩn bị sẵn sàng trước khi cuộc thi bắt đầu!')
                              : trUI('Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia!')
                            : pending
                            ? trUI('Yêu cầu đăng ký của bạn đang chờ người tổ chức phê duyệt.')
                            : !ended
                            ? trUI('Đăng ký tham gia ngay để thử sức và cải thiện điểm Elo của bạn!')
                            : trUI('Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia!')}
                        </p>
                      </div>
                    </div>

                    {!joined && !pending && !ended && (
                      <button
                        className="primary contest-join-btn"
                        onClick={join}
                        disabled={busy}
                        aria-busy={busy}
                      >
                        <i className="fa-solid fa-user-plus" aria-hidden="true" />
                        <span>{trUI('Đăng ký tham gia')}</span>
                      </button>
                    )}

                    {joined && state === 'live' && c.problemIds?.length > 0 && (
                      <button
                        className="primary contest-join-btn"
                        onClick={() => {
                          setContestTab('problems');
                          go('/solve/' + c.problemIds[0] + '?contest=' + c.id);
                        }}
                      >
                        <i className="fa-solid fa-play" aria-hidden="true" />
                        <span>{trUI('Làm bài ngay')}</span>
                      </button>
                    )}
                  </div>
                )}

                {isOrganizer && (
                  <div className="contest-participant-banner admin">
                    <div className="contest-banner-text">
                      <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                      <div>
                        <strong>{trUI('Quyền quản trị')}</strong>
                        <p>{trUI('Quản trị cuộc thi: Bạn có toàn quyền xem đề bài, theo dõi bảng điểm và phê duyệt thí sinh.')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-navigation tabs inside Contest Space */}
                <div className="contest-space-tabs" role="tablist">
                  <button
                    role="tab"
                    aria-selected={contestTab === 'problems'}
                    className={'contest-space-tab ' + (contestTab === 'problems' ? 'active' : '')}
                    onClick={() => setContestTab('problems')}
                  >
                    <i className="fa-solid fa-file-code" aria-hidden="true" />
                    <span>{trUI('Danh sách bài thi')}</span>
                    <span className="contest-tab-badge">
                      {c.problemIds?.length || c.problemCount || 0}
                    </span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={contestTab === 'standings'}
                    className={'contest-space-tab ' + (contestTab === 'standings' ? 'active' : '')}
                    onClick={() => setContestTab('standings')}
                  >
                    <i className="fa-solid fa-trophy" aria-hidden="true" />
                    <span>{trUI('Bảng điểm trực tiếp')}</span>
                    <span className="contest-tab-badge">
                      {detail?.standings?.length || 0}
                    </span>
                  </button>

                  {isOrganizer && c.pending && c.pending.length > 0 && (
                    <button
                      role="tab"
                      aria-selected={contestTab === 'approvals'}
                      className={'contest-space-tab ' + (contestTab === 'approvals' ? 'active' : '')}
                      onClick={() => setContestTab('approvals')}
                    >
                      <i className="fa-regular fa-clock" aria-hidden="true" />
                      <span>{trUI('Đăng ký chờ duyệt')}</span>
                      <span className="contest-tab-badge warning">
                        {c.pending.length}
                      </span>
                    </button>
                  )}

                  <button
                    role="tab"
                    aria-selected={contestTab === 'rules'}
                    className={'contest-space-tab ' + (contestTab === 'rules' ? 'active' : '')}
                    onClick={() => setContestTab('rules')}
                  >
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    <span>{trUI('Thể lệ & Thông tin')}</span>
                  </button>
                </div>

                {/* Tab 1: Problems List */}
                {contestTab === 'problems' && (
                  <div className="contest-tab-content">
                    {c.problemIds && c.problemIds.length > 0 ? (
                      <div className="contest-problems-list">
                        {c.problemIds.map((pid, i) => {
                          const prob = problems?.find((p) => p.id === pid);
                          const probTitle =
                            c.problemTitles?.[pid] || prob?.title || pid;
                          const isAC = isProblemAC(pid);
                          return (
                            <div
                              className={'contest-problem-card' + (isAC ? ' is-ac' : '')}
                              key={pid}
                            >
                              <div className="contest-problem-info">
                                <span
                                  className={'contest-letter-badge' + (isAC ? ' is-ac' : '')}
                                >
                                  {isAC ? (
                                    <i className="fa-solid fa-check" aria-hidden="true" />
                                  ) : (
                                    String.fromCharCode(65 + i)
                                  )}
                                </span>
                                <div>
                                  <div
                                    className="inline"
                                    style={{ gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}
                                  >
                                    <h3
                                      className="contest-problem-title"
                                      data-user-content
                                    >
                                      {probTitle}
                                    </h3>
                                    {isAC && (
                                      <Badge tone="success">
                                        <i className="fa-solid fa-check" aria-hidden="true" />{' '}
                                        {trUI('Đã AC')}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="contest-problem-meta">
                                    {prob?.publicId && (
                                      <span>{prob.publicId} · </span>
                                    )}
                                    {prob?.difficulty && (
                                      <span>
                                        {trUI('Mức')} {prob.difficulty} ·{' '}
                                      </span>
                                    )}
                                    <span>
                                      {prob?.category || trUI('Bài tập')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="contest-problem-action">
                                <button
                                  className={isAC ? 'secondary' : 'primary'}
                                  onClick={() =>
                                    go('/solve/' + pid + '?contest=' + c.id)
                                  }
                                >
                                  <i
                                    className={
                                      'fa-solid ' +
                                      (isAC ? 'fa-rotate-right' : 'fa-code')
                                    }
                                    aria-hidden="true"
                                  />
                                  <span>
                                    {isAC ? trUI('Làm lại →') : trUI('Làm bài →')}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="contest-locked-box">
                        <div className="contest-locked-icon" aria-hidden="true">
                          <i className="fa-solid fa-lock" />
                        </div>
                        <h3>{trUI('Đề bài đang được bảo mật')}</h3>
                        <p>
                          {state === 'upcoming'
                            ? trUI('Đề bài chỉ mở cho người đã đăng ký khi cuộc thi bắt đầu.')
                            : !joined && !ended
                            ? trUI('Đăng ký tham gia ngay để thử sức và cải thiện điểm Elo của bạn!')
                            : trUI('Cuộc thi đã kết thúc. Cảm ơn bạn đã tham gia!')}
                        </p>
                        {!joined && !ended && user.role === 'CODER' && (
                          <button
                            className="primary"
                            onClick={join}
                            disabled={busy}
                            aria-busy={busy}
                          >
                            <i className="fa-solid fa-user-plus" aria-hidden="true" />
                            <span>{trUI('Đăng ký tham gia')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Standings */}
                {contestTab === 'standings' && (
                  <div className="contest-tab-content">
                    <div className="contest-standings-box">
                      <div
                        className="table-wrap"
                        role="region"
                        aria-label={trUI('Bảng điểm')}
                        tabIndex={0}
                      >
                        <table>
                          <thead>
                            <tr>
                              <th style={{ width: 80 }}>{trUI('Hạng')}</th>
                              <th>{trUI('Coder')}</th>
                              <th style={{ textAlign: 'right' }}>{trUI('Điểm')}</th>
                              <th style={{ textAlign: 'center' }}>AC</th>
                              <th style={{ textAlign: 'right' }}>Penalty (s)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detail?.standings?.map((s, i) => {
                              const isMe = s.userId === user.id;
                              const medal =
                                i === 0
                                  ? '🥇'
                                  : i === 1
                                  ? '🥈'
                                  : i === 2
                                  ? '🥉'
                                  : null;
                              return (
                                <tr key={s.userId} className={isMe ? 'my-rank' : ''}>
                                  <td>
                                    <span className="contest-rank-cell">
                                      {medal ? (
                                        <span className="contest-rank-medal">
                                          {medal}
                                        </span>
                                      ) : null}
                                      <span>{i + 1}</span>
                                    </span>
                                  </td>
                                  <td>
                                    <div className="contest-coder-cell">
                                      <span className="contest-coder-avatar">
                                        {s.name
                                          ? s.name.slice(0, 1).toUpperCase()
                                          : 'C'}
                                      </span>
                                      <strong data-user-content>{s.name}</strong>
                                      {isMe && <Badge tone="info">{trUI('Bạn')}</Badge>}
                                    </div>
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                    {s.score}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className="badge success">{s.ac}</span>
                                  </td>
                                  <td
                                    style={{
                                      textAlign: 'right',
                                      fontFamily: 'var(--font-family-code)',
                                    }}
                                  >
                                    {s.penalty}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {(!detail?.standings || detail.standings.length === 0) && (
                          <p className="empty">{trUI('Chưa có kết quả thi đấu.')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Approvals (Admin/Author only) */}
                {contestTab === 'approvals' && isOrganizer && (
                  <div className="contest-tab-content">
                    <InsightPanel title="Đăng ký chờ duyệt">
                      {c.pending && c.pending.length > 0 ? (
                        c.pending.map((uid) => (
                          <div className="approval-row" key={uid}>
                            <code>{uid}</code>
                            <div className="inline">
                              <button
                                className="primary"
                                disabled={busy}
                                aria-busy={busy}
                                onClick={() => approveUser(uid, true)}
                              >
                                <i className="fa-solid fa-check" aria-hidden="true" />
                                <span>{trUI('Duyệt')}</span>
                              </button>
                              <button
                                className="secondary"
                                disabled={busy}
                                aria-busy={busy}
                                onClick={() => approveUser(uid, false)}
                              >
                                <i className="fa-solid fa-xmark" aria-hidden="true" />
                                <span>{trUI('Từ chối')}</span>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty">{trUI('Không có yêu cầu chờ duyệt.')}</p>
                      )}
                    </InsightPanel>
                  </div>
                )}

                {/* Tab 4: Rules & Details */}
                {contestTab === 'rules' && (
                  <div className="contest-tab-content">
                    <div className="contest-rules-list">
                      <div className="contest-rule-item">
                        <h3>
                          <i className="fa-solid fa-award" aria-hidden="true" />{' '}
                          {trUI('Quy tắc tính điểm & Xếp hạng')}
                        </h3>
                        <p>
                          {trUI(
                            'Mỗi bài nộp AC (Accepted) sẽ được cộng điểm tương ứng. Điểm penalty được tính theo thời gian nộp bài từ lúc bắt đầu contest cộng thêm 10 phút (600s) cho mỗi lần nộp sai trước khi AC.'
                          )}
                        </p>
                      </div>

                      <div className="contest-rule-item">
                        <h3>
                          <i className="fa-solid fa-chart-line" aria-hidden="true" />{' '}
                          {trUI('Điểm xếp hạng')}
                        </h3>
                        <p>
                          {c.rated
                            ? trUI('Elo ch? thay d?i t? k?t qu? Contest c tnh di?m.') ||
                              trUI('Rated (cập nhật Elo)')
                            : trUI('Unrated - Kết quả cuộc thi này không làm thay đổi điểm Elo.')}
                        </p>
                      </div>

                      <div className="contest-rule-item">
                        <h3>
                          <i className="fa-solid fa-door-open" aria-hidden="true" />{' '}
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
              <div className="contest-arena-sidebar">
                {/* Countdown Card */}
                <div className="contest-sidebar-timer">
                  <h3>
                    {trUI(
                      state === 'upcoming'
                        ? 'Bắt đầu sau'
                        : state === 'live'
                        ? 'Thời gian thi còn lại'
                        : labels[state]
                    )}
                  </h3>
                  {['live', 'upcoming'].includes(state) && (
                    <TimeLeft
                      withHours
                      deadline={state === 'upcoming' ? c.startsAt : c.endsAt}
                    />
                  )}
                  <p>
                    {trUI(
                      state === 'upcoming'
                        ? 'Chuẩn bị trước khi cuộc thi bắt đầu'
                        : state === 'live'
                        ? 'Cuộc thi đang diễn ra!'
                        : 'Cuộc thi đã kết thúc'
                    )}
                  </p>
                </div>

                {/* Facts Card */}
                <div className="contest-sidebar-card">
                  <h4>{trUI('Thông tin cuộc thi')}</h4>
                  <dl className="fact-list">
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
                      <dd>
                        {trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}
                      </dd>
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

                  <div className="contest-sidebar-actions">
                    {user.role === 'CODER' &&
                      !joined &&
                      !pending &&
                      !ended && (
                        <button
                          className="primary"
                          onClick={join}
                          disabled={busy}
                          aria-busy={busy}
                        >
                          <i className="fa-solid fa-user-plus" aria-hidden="true" />
                          <span>{trUI('Đăng ký tham gia')}</span>
                        </button>
                      )}

                    {joined && state === 'live' && c.problemIds?.[0] && (
                      <button
                        className="primary"
                        onClick={() => {
                          setContestTab('problems');
                          go('/solve/' + c.problemIds[0] + '?contest=' + c.id);
                        }}
                      >
                        <i className="fa-solid fa-play" aria-hidden="true" />
                        <span>{trUI('Làm bài ngay')}</span>
                      </button>
                    )}

                    <button className="secondary" onClick={closeContest}>
                      <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                      <span>{trUI('Quay lại danh sách')}</span>
                    </button>
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
        }}
        action={
          user.role !== 'CODER' ? (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className={showCreate ? 'secondary' : 'primary'}
            >
              <i
                className={'fa-solid ' + (showCreate ? 'fa-xmark' : 'fa-plus')}
                aria-hidden="true"
              />
              <span>{showCreate ? trUI('Đóng biểu mẫu') : trUI('Tạo contest')}</span>
            </button>
          ) : (
            <a className="button secondary" href="#/practice">
              <i className="fa-solid fa-dumbbell" aria-hidden="true" />
              <span>{trUI('Luyện tập trước kỳ thi')}</span>
            </a>
          )
        }
      >
        {trUI('Chọn cuộc thi, theo dõi lịch bắt đầu và thử sức trên bảng điểm trực tiếp.')}
      </Heading>

      <StatGrid
        label={trUI('Tổng quan contest')}
        items={[
          { label: trUI('Đang diễn ra'), value: data ? overview.live : null, tone: 'positive' },
          { label: trUI('Sắp diễn ra'), value: data ? overview.upcoming : null },
          { label: trUI('Đã tham gia'), value: data ? overview.joined : null },
          { label: trUI('Chờ duyệt'), value: data ? overview.pending : null },
        ]}
      />

      <ErrorBox error={error || probError || err} />

      {/* Create Contest Form */}
      {showCreate && (
        <form className="paper pad contest-create" onSubmit={create}>
          <div className="inline between">
            <h2>{trUI('Tạo cuộc thi mới')}</h2>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowCreate(false)}
              aria-label={trUI('Đóng')}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>

          <label>
            {trUI('Tên contest')}
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={trUI('Ví dụ: CodeGrade Championship 2026')}
            />
          </label>

          <div className="two-cols">
            <label>
              {trUI('Bắt đầu (giờ máy của bạn)')}
              <input
                required
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </label>
            <label>
              {trUI('Kết thúc')}
              <input
                required
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </label>
          </div>

          <div className="inline" style={{ marginTop: 'var(--space-2)' }}>
            <Check
              label={trUI('Rated (cập nhật Elo)')}
              checked={form.rated}
              onChange={(v) => setForm({ ...form, rated: v })}
            />
            <Check
              label={trUI('Cần phê duyệt')}
              checked={form.approvalRequired}
              onChange={(v) => setForm({ ...form, approvalRequired: v })}
            />
          </div>

          <div className="subheading" style={{ marginTop: 'var(--space-5)' }}>
            <h3>{trUI('Chọn bài')}</h3>
            <span className="badge">
              {form.problemIds.length} {trUI('bài đã chọn')}
            </span>
          </div>

          <select
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
          </select>

          <div className="problem-checks">
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
                        ? [...form.problemIds,p.id]
                        : form.problemIds.filter((id) => id !== p.id),
                    })
                  }
                />
              ))}
          </div>

          <div className="inline" style={{ marginTop: 'var(--space-4)' }}>
            <button className="primary" disabled={busy} aria-busy={busy}>
              <i className="fa-solid fa-plus" aria-hidden="true" />
              <span>{trUI('Tạo contest')}</span>
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setShowCreate(false)}
            >
              {trUI('Hủy')}
            </button>
          </div>
        </form>
      )}

      {/* Contest List Section */}
      <div className="subheading">
        <h2>{trUI('Lịch thi đấu')}</h2>
        <small>
          {rows.length} {trUI('cuộc thi')}
        </small>
      </div>

      <div className="tabs" aria-label={trUI('Lọc contest')}>
        {[
          ['all', 'Tất cả'],
          ['live', 'Đang diễn ra'],
          ['upcoming', 'Sắp diễn ra'],
          ['mine', 'Của bạn'],
          ['finished', 'Đã kết thúc'],
        ].map(([k, label]) => (
          <button
            key={k}
            className={filter === k ? 'active' : ''}
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
          >
            {trUI(label)}
          </button>
        ))}
      </div>

      {!data ? (
        <Loading />
      ) : rows.length ? (
        <div className="contest-cards">
          {rows.map((c) => {
            const s = contestState(c, now);
            return (
              <article
                className={'contest-card state-' + s}
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
                <div className="contest-card-header">
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
                      <span className="pulse-dot" aria-hidden="true" />
                    )}
                    {trUI(labels[s])}
                  </Badge>
                  <span
                    className={
                      'contest-rated-tag ' + (c.rated ? 'rated' : 'unrated')
                    }
                  >
                    {c.rated ? '★ Rated' : 'Unrated'}
                  </span>
                </div>

                <h3 className="contest-card-title" data-user-content>
                  {c.title}
                </h3>

                <div className="contest-card-time">
                  <i className="fa-regular fa-calendar" aria-hidden="true" />
                  <span>{formatDate(c.startsAt)}</span>
                </div>

                {['live', 'upcoming'].includes(s) ? (
                  <div className={'contest-card-clock state-' + s}>
                    <span className="clock-label">
                      {trUI(s === 'upcoming' ? 'Bắt đầu sau' : 'Còn lại')}
                    </span>
                    <TimeLeft
                      withHours
                      deadline={s === 'upcoming' ? c.startsAt : c.endsAt}
                    />
                  </div>
                ) : (
                  <div className="contest-card-clock is-finished">
                    <i className="fa-solid fa-flag-checkered" aria-hidden="true" />
                    <span>{trUI(labels[s])}</span>
                  </div>
                )}

                <div className="contest-card-meta">
                  <span>
                    <i className="fa-solid fa-file-code" aria-hidden="true" />{' '}
                    {c.problemCount ?? c.problemIds.length} {trUI('bài')}
                  </span>
                  <span>
                    <i className="fa-solid fa-users" aria-hidden="true" />{' '}
                    {c.participants.length} Coder
                  </span>
                  <span>
                    <i className="fa-solid fa-lock" aria-hidden="true" />{' '}
                    {trUI(c.approvalRequired ? 'Cần phê duyệt' : 'Công khai')}
                  </span>
                </div>

                <div className="contest-card-footer">
                  <span>{trUI('Xem chi tiết →')}</span>
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty paper">{trUI('Chưa có cuộc thi phù hợp.')}</div>
      )}
    </>
  );
}
