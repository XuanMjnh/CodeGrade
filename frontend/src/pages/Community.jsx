import { Button as ActionLink, Button as UiButton } from '../components/ui/button';
import { Input as UiInput } from '../components/ui/input';
import { Label as UiLabel } from '../components/ui/label';
import { Textarea as UiTextarea } from '../components/ui/textarea';
import ProgressionStrip from '../components/ProgressionStrip';
import PasswordChange from '../components/PasswordChange';
import { StatGrid, InsightPanel } from '../components/Insights';
import { t as trUI } from '../lib/locale';
import React, { useState } from 'react';
import { live } from '../lib/live';
import { cn } from '../lib/utils';
import { Heading, useResource, ErrorBox, Loading, Badge } from '../components/ui';
import {
  User,
  Mail,
  AtSign,
  Shield,
  CheckCircle2,
  Star,
  Zap,
  Crown,
  History,
  ArrowRight,
  Save,
  Sparkles,
  MessageSquare,
  MessageSquareQuote,
  MessageSquareDashed,
  Send,
  Clock,
  Loader2,
} from 'lucide-react';
const date = (value) =>
  new Date(value).toLocaleString(localStorage.getItem('cg-locale') === 'en' ? 'en-US' : 'vi-VN');
export function Profile({ user, revision, onUserChange, onNotice }) {
  const [name, N] = useState(user.displayName),
    [email, E] = useState(user.email || ''),
    [error, X] = useState(null),
    [busy, B] = useState(false),
    [problems, problemError] = useResource('PROBLEMS', {}, revision),
    [account, accountError] = useResource('ME', {}, revision);
  const current = account || user;
  const [progress] = useResource('PROGRESSION_GET', {}, revision);
  async function save(e) {
    e.preventDefault();
    B(true);
    X(null);
    try {
      await live.call('PROFILE_SAVE', {
        displayName: name,
        email,
      });
      const updated = await live.call('ME');
      onUserChange?.(updated);
      onNotice(trUI('Đã lưu hồ sơ.'));
    } catch (e) {
      X(e);
    } finally {
      B(false);
    }
  }

  const roleLabel =
    current.role === 'AUTHOR'
      ? trUI('Người tạo đề')
      : current.role === 'ADMIN'
        ? trUI('Quản trị viên')
        : trUI('Coder');

  const roleColor =
    current.role === 'AUTHOR'
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
      : current.role === 'ADMIN'
        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
        : 'bg-action/10 text-action border-action/30';

  const statsList = [
    {
      label: trUI('Bài AC trong kho'),
      value: problems ? problems.filter((p) => p.solved).length : '—',
      icon: CheckCircle2,
      note: trUI('Đã vượt qua kiểm thử'),
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      textColor: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: trUI('Bài yêu thích'),
      value: problems ? problems.filter((p) => p.starred).length : '—',
      icon: Star,
      note: trUI('Đã lưu ôn tập'),
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      textColor: 'text-amber-700 dark:text-amber-300',
    },
    {
      label: trUI('Elo Contest'),
      value: user.role === 'CODER' ? (current.elo ?? 1200) : '—',
      icon: Zap,
      note: trUI('Xếp hạng thi đấu'),
      color: 'text-action bg-action/10 border-action/20',
      textColor: 'text-action',
    },
    {
      label: trUI('Thắng Code Survival'),
      value: user.role === 'CODER' ? (current.wins ?? 0) : '—',
      icon: Crown,
      note: trUI('Chiến thắng sinh tồn'),
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
      textColor: 'text-amber-700 dark:text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Profile Card */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Avatar Frame */}
            <div className="relative shrink-0">
              <span
                className={cn(
                  'flex size-16 sm:size-18 items-center justify-center rounded-2xl border-2 font-heading text-2xl sm:text-3xl font-black shadow-xs',
                  'bg-action/10 border-action/30 text-action',
                  'avatar-frame-' + (progress?.avatarFrame || 'basic'),
                )}
                aria-hidden="true"
              >
                {current.displayName?.slice(0, 1)?.toUpperCase() || 'U'}
              </span>
              <span
                className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card"
                title="Online"
              >
                <span className="size-2 rounded-full bg-white" />
              </span>
            </div>

            {/* Profile Info */}
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className="font-heading text-xl sm:text-2xl font-black tracking-tight text-foreground truncate"
                  data-user-content
                >
                  {current.displayName}
                </h1>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                    roleColor,
                  )}
                >
                  <Shield className="size-3" />
                  {roleLabel}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono" data-user-content>
                  <AtSign className="size-3.5 text-muted-foreground/70" />
                  {current.username}
                </span>
                <span className="flex items-center gap-1.5" data-user-content>
                  <Mail className="size-3.5 text-muted-foreground/70" />
                  {current.email || trUI('Chưa liên kết email')}
                </span>
              </div>

              {progress && (
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-action">
                    <Sparkles className="size-3.5" />
                    Cấp {progress.level} · {progress.rank || 'Đồng'} ({progress.rating || 1000} rating)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 sm:self-center shrink-0">
            <a
              href="#/submissions"
              className="group inline-flex items-center gap-2 rounded-xl border border-border/90 bg-muted/30 hover:bg-action/10 hover:border-action/40 hover:text-action px-4 py-2.5 text-xs sm:text-sm font-semibold text-foreground transition-all shadow-2xs"
            >
              <History className="size-4 text-action transition-transform group-hover:-rotate-45" />
              <span>{trUI('Xem lịch sử bài nộp')}</span>
              <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-action" />
            </a>
          </div>
        </div>
      </section>

      {/* 4 Stat Cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={trUI('Thống kê cá nhân')}>
        {statsList.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs transition-all hover:border-action/30 hover:shadow-subtle"
          >
            <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl border', s.color)}>
              <s.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                {s.label}
              </div>
              <div className={cn('mt-0.5 font-heading text-xl sm:text-2xl font-black tracking-tight leading-none', s.textColor)}>
                {s.value}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground/80 truncate">
                {s.note}
              </div>
            </div>
          </div>
        ))}
      </section>

      <ErrorBox error={problemError || accountError} />

      {/* League of Legends Ranked & Level Progress */}
      <ProgressionStrip stats={progress} user={current} showRankGuide={true} />

      {/* Account Settings & Security (2 Columns Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Col 1: Thông tin hồ sơ */}
        <form
          className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-4"
          onSubmit={save}
          aria-busy={busy}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-action border border-orange-500/20">
              <User className="size-4" />
            </span>
            <div>
              <h3 className="font-heading text-base font-extrabold text-foreground">
                {trUI('Thông tin hồ sơ')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {trUI('Cập nhật họ tên hiển thị và email liên hệ')}
              </p>
            </div>
          </div>

          <ErrorBox error={error} />

          {/* Username (Read only) */}
          <div className="space-y-1.5">
            <UiLabel htmlFor="profile-username" className="text-xs font-bold text-foreground">
              {trUI('Tên tài khoản')}
            </UiLabel>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60 pointer-events-none" />
              <UiInput
                id="profile-username"
                disabled
                readOnly
                value={current.username}
                className="h-10 pl-9 rounded-xl border border-border/60 bg-muted/40 font-mono text-sm font-semibold text-muted-foreground cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {trUI('Tên đăng nhập cố định của tài khoản')}
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <UiLabel htmlFor="profile-displayname" className="text-xs font-bold text-foreground">
              {trUI('Họ tên hiển thị')}
            </UiLabel>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <UiInput
                id="profile-displayname"
                required
                autoComplete="name"
                maxLength={100}
                value={name}
                onChange={(e) => N(e.target.value)}
                placeholder={trUI('Nhập họ tên của bạn')}
                className="h-10 pl-9 rounded-xl border border-border/90 bg-slate-100/60 dark:bg-slate-900/50 text-sm font-semibold text-foreground transition-all shadow-xs focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <UiLabel htmlFor="profile-email" className="text-xs font-bold text-foreground">
              {trUI('Email liên hệ')}
            </UiLabel>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <UiInput
                id="profile-email"
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => E(e.target.value)}
                placeholder="example@codegrade.vn"
                className="h-10 pl-9 rounded-xl border border-border/90 bg-slate-100/60 dark:bg-slate-900/50 text-sm font-semibold text-foreground transition-all shadow-xs focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20"
              />
            </div>
          </div>

          {/* Account Role Info */}
          <div className="space-y-1.5 pt-1">
            <UiLabel className="text-xs font-bold text-foreground">
              {trUI('Vai trò tài khoản')}
            </UiLabel>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold border',
                  roleColor,
                )}
              >
                <Shield className="size-3.5" />
                {roleLabel}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {current.role === 'AUTHOR'
                  ? trUI('Quyền tạo và biên soạn bài tập')
                  : current.role === 'ADMIN'
                    ? trUI('Toàn quyền quản trị hệ thống')
                    : trUI('Tham gia giải bài, contest và thi đấu')}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <UiButton
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className="h-10 px-5 rounded-xl bg-action hover:bg-action-hover active:bg-action-active text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Save className="size-4" />
              <span>{busy ? trUI('Đang lưu…') : trUI('Lưu thay đổi')}</span>
            </UiButton>
          </div>
        </form>

        {/* Col 2: Đổi mật khẩu & Bảo mật */}
        <PasswordChange onNotice={onNotice} />
      </div>
    </div>
  );
}
export function Announcements({ user, revision, onNotice }) {
  const [items, error] = useResource('ANNOUNCEMENTS', {}, revision),
    [title, T] = useState(''),
    [body, B] = useState(''),
    [busy, S] = useState(false),
    [failure, E] = useState(null),
    [compose, C] = useState(false);
  async function publish(e) {
    e.preventDefault();
    S(true);
    E(null);
    try {
      await live.call('ANNOUNCEMENT_ADD', {
        title,
        body,
      });
      T('');
      B('');
      C(false);
      onNotice(trUI('Đã đăng thông báo.'));
    } catch (e) {
      E(e);
    } finally {
      S(false);
    }
  }
  return (
    <>
      <Heading
        kind="announcements"
        title={trUI('Thông báo')}
        highlight={{
          label: 'Cập nhật gần nhất',
          value: items?.[0] ? date(items[0].created_at) : '—',
        }}
        action={
          user.role === 'ADMIN' && (
            <UiButton onClick={() => C(!compose)} variant="default">
              {trUI(compose ? 'Đóng biểu mẫu' : 'Soạn thông báo')}
            </UiButton>
          )
        }
      >
        Lịch thi, cập nhật quan trọng và thông tin mới từ ban quản trị.
      </Heading>
      <ErrorBox error={error || failure} />
      <div className="notice-summary space-y-3 p-5">
        <span>
          <b>{items?.length ?? '—'}</b> {trUI('thông báo đã đăng')}
        </span>
        <span>
          {trUI('Nguồn')}: {trUI('Ban quản trị')}
        </span>
        <a href="#/contests">Xem lịch thi đấu</a>
      </div>
      {user.role === 'ADMIN' && compose && (
        <form
          className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6"
          onSubmit={publish}
          aria-busy={busy}
        >
          <h2>Soạn thông báo</h2>
          <UiLabel className="grid gap-2 text-sm font-medium">
            Tiêu đề
            <UiInput required maxLength={200} value={title} onChange={(e) => T(e.target.value)} />
          </UiLabel>
          <UiLabel className="grid gap-2 text-sm font-medium">
            Nội dung
            <UiTextarea
              required
              maxLength={4000}
              value={body}
              onChange={(e) => B(e.target.value)}
            />
          </UiLabel>
          <UiButton disabled={busy} aria-busy={busy} variant="default">
            Đăng thông báo
          </UiButton>
        </form>
      )}
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="empty border-dashed p-8 text-center paper rounded-[14px] border bg-card text-card-foreground shadow-xs">
          Chưa có thông báo.
        </div>
      ) : (
        <>
          <article className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs featured-notice space-y-3 p-5">
            <div className="inline-group between flex flex-wrap items-center justify-between gap-3">
              <Badge tone="success">Mới nhất</Badge>
              <small>{date(items[0].created_at)}</small>
            </div>
            <h2 data-user-content>{items[0].title}</h2>
            <p
              data-user-content
              className="user-copy grid gap-1 [&>small]:text-xs [&>small]:text-muted-foreground"
            >
              {items[0].body}
            </p>
            <small>Ban quản trị CodeGrade</small>
          </article>
          {items.length > 1 && (
            <>
              <div className="subheading flex flex-wrap items-center justify-between gap-3">
                <h2>Thông báo trước đó</h2>
                <small>
                  {items.length - 1} {trUI('thông báo')}
                </small>
              </div>
              <div data-paginate className="notice-archive space-y-3 p-5">
                {items.slice(1).map((x) => (
                  <article
                    className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6"
                    key={x.id}
                  >
                    <small>{date(x.created_at)}</small>
                    <h2 data-user-content>{x.title}</h2>
                    <p
                      data-user-content
                      className="user-copy grid gap-1 [&>small]:text-xs [&>small]:text-muted-foreground"
                    >
                      {x.body}
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
export function Discussion({ id, revision }) {
  const [items, error, set] = useResource(
      'COMMENTS',
      {
        problemId: id,
      },
      revision,
    ),
    [body, B] = useState(''),
    [busy, S] = useState(false),
    [failure, E] = useState(null);
  async function post(e) {
    e.preventDefault();
    if (!body.trim()) return;
    S(true);
    E(null);
    try {
      await live.call('COMMENT_ADD', {
        problemId: id,
        body: body.trim(),
      });
      B('');
      set(
        await live.call('COMMENTS', {
          problemId: id,
        }),
      );
    } catch (e) {
      E(e);
    } finally {
      S(false);
    }
  }
  return (
    <section
      data-paginate
      className="paper rounded-2xl border border-border/80 bg-card text-card-foreground shadow-xs p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-2xs">
            <MessageSquareQuote className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-black tracking-tight text-foreground m-0">
                {trUI('Bình luận')}
              </h2>
              {items && items.length > 0 && (
                <span className="rounded-full bg-muted border border-border/60 px-2.5 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                  {items.length}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trUI('Trao đổi giải pháp, chia sẻ gợi ý và thảo luận thuật toán cùng cộng đồng.')}
            </p>
          </div>
        </div>
      </div>

      <ErrorBox error={error || failure} />

      {/* Editor Form */}
      <form onSubmit={post} aria-busy={busy} className="space-y-3">
        <div className="rounded-2xl border border-border/80 bg-muted/20 p-3 sm:p-4 transition-all focus-within:border-action/60 focus-within:bg-card focus-within:ring-2 focus-within:ring-action/15 shadow-2xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40 text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-action" />
              {trUI('Viết bình luận')}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {body.length} / 4000
            </span>
          </div>

          <UiTextarea
            required
            maxLength={4000}
            rows={3}
            value={body}
            onChange={(e) => B(e.target.value)}
            placeholder={trUI('Chia sẻ cách tiếp cận, giải thích ý tưởng hoặc đặt câu hỏi...')}
            className="w-full resize-y min-h-[85px] border-0 bg-transparent p-0 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:outline-none shadow-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-border/40">
            <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
              <span>💡</span>
              {trUI('Giữ thảo luận văn minh và tránh tiết lộ đáp án trực tiếp.')}
            </p>
            <UiButton
              type="submit"
              disabled={busy || !body.trim()}
              aria-busy={busy}
              className="h-9 rounded-xl bg-action hover:bg-action/90 text-white font-bold text-xs px-4 gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {busy ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>{trUI('Đang gửi…')}</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>{trUI('Gửi bình luận')}</span>
                </>
              )}
            </UiButton>
          </div>
        </div>
      </form>

      {/* List / Empty State */}
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-dashed border-border/80 bg-muted/15">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-card border border-border/80 shadow-2xs mb-3 text-muted-foreground/70">
            <MessageSquareDashed className="size-7 text-action" />
          </div>
          <p className="font-heading font-bold text-sm text-foreground">
            {trUI('Chưa có bình luận nào')}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
            {trUI('Chưa có bình luận. Chia sẻ cách tiếp cận của bạn.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {items.map((x) => (
            <article
              key={x.id}
              className="group relative flex gap-3.5 rounded-2xl border border-border/70 bg-card/60 p-4 transition-all hover:bg-card hover:border-border hover:shadow-2xs"
            >
              <div className="flex size-9.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-action/20 to-orange-500/10 border border-action/25 text-action font-heading font-black text-sm shadow-2xs">
                {x.display_name?.slice(0, 1)?.toUpperCase() || 'U'}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    data-user-content
                    className="font-heading font-bold text-sm text-foreground"
                  >
                    {x.display_name}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
                    <Clock className="size-3 text-muted-foreground/70" />
                    {date(x.created_at)}
                  </span>
                </div>
                <div
                  data-user-content
                  className="user-copy text-xs sm:text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words"
                >
                  {x.body}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
