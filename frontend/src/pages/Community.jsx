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
import { Heading, useResource, ErrorBox, Loading, Badge } from '../components/ui';
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
  return (
    <>
      <Heading
        kind="profile"
        title={trUI('Thông tin cá nhân')}
        highlight={{
          label: 'Vai trò tài khoản',
          value: trUI(
            current.role === 'AUTHOR'
              ? 'Người tạo đề'
              : current.role === 'ADMIN'
                ? 'Admin'
                : 'Coder',
          ),
        }}
      >
        Cập nhật hồ sơ và theo dõi những cột mốc luyện tập của bạn.
      </Heading>
      <StatGrid
        label="Thành tích cá nhân"
        items={[
          {
            label: 'Bài AC trong kho',
            value: problems?.filter((p) => p.solved).length,
          },
          {
            label: 'Bài yêu thích',
            value: problems?.filter((p) => p.starred).length,
          },
          {
            label: 'Elo Contest',
            value: user.role === 'CODER' ? current.elo : '—',
          },
          {
            label: 'Thắng Code Survival',
            value: user.role === 'CODER' ? current.wins : '—',
          },
        ]}
      />
      <ErrorBox error={problemError || accountError} />
      <ProgressionStrip stats={progress} user={current} />
      <div className="profile-grid grid min-w-0 items-start gap-6 min-[851px]:grid-cols-2 [&>.password-change]:mt-5 min-[851px]:[&>.password-change]:col-span-2 min-[851px]:[&>.password-change]:max-w-[680px] [&>form]:space-y-5 [&>form]:shadow-panel">
        <InsightPanel title="Tài khoản của bạn">
          <div className="profile-identity mb-6 flex items-center gap-4 [&>.avatar]:size-14 [&>.avatar]:border [&>.avatar]:bg-primary [&>.avatar]:text-2xl [&>.avatar]:font-bold [&>.avatar]:text-white [&_p]:text-xs [&_p]:text-muted-foreground">
            <span
              className={
                'avatar flex size-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-primary avatar-frame-' +
                (progress?.avatarFrame || 'basic')
              }
            >
              {current.displayName.slice(0, 1)}
            </span>
            <div>
              <h3 data-user-content>{current.displayName}</h3>
              <p data-user-content>@{current.username}</p>
            </div>
          </div>
          <dl className="fact-list divide-y text-sm [&>div]:grid [&>div]:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] [&>div]:gap-3 [&>div]:py-3 [&_dt]:text-xs [&_dt]:text-muted-foreground [&_dd]:text-right [&_dd]:text-[13px] [&_dd]:font-medium">
            <div>
              <dt>Tên tài khoản</dt>
              <dd data-user-content>{current.username}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd data-user-content>{current.email || trUI('Chưa bổ sung')}</dd>
            </div>
            <div>
              <dt>Vai trò</dt>
              <dd>
                {trUI(
                  current.role === 'AUTHOR'
                    ? 'Người tạo đề'
                    : current.role === 'ADMIN'
                      ? 'Admin'
                      : 'Coder',
                )}
              </dd>
            </div>
          </dl>
          <ActionLink asChild variant="outline">
            <a
              className="button secondary border border-input bg-card text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground"
              href="#/submissions"
            >
              Xem lịch sử bài nộp
            </a>
          </ActionLink>
        </InsightPanel>
        <form
          className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6"
          onSubmit={save}
          aria-busy={busy}
        >
          <h2>Thông tin liên hệ</h2>
          <ErrorBox error={error} />
          <UiLabel className="grid gap-2 text-sm font-medium">
            Họ tên
            <UiInput
              required
              autoComplete="name"
              maxLength={100}
              value={name}
              onChange={(e) => N(e.target.value)}
            />
          </UiLabel>
          <UiLabel className="grid gap-2 text-sm font-medium">
            Email
            <UiInput
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => E(e.target.value)}
            />
          </UiLabel>
          <UiButton disabled={busy} aria-busy={busy} variant="default">
            Lưu thay đổi
          </UiButton>
        </form>
        <PasswordChange onNotice={onNotice} />
      </div>
    </>
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
    S(true);
    E(null);
    try {
      await live.call('COMMENT_ADD', {
        problemId: id,
        body,
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
      className="paper rounded-[14px] border bg-card text-card-foreground shadow-xs pad p-5 sm:p-6"
    >
      <h2>Bình luận</h2>
      <ErrorBox error={error || failure} />
      <form onSubmit={post} aria-busy={busy}>
        <UiLabel className="grid gap-2 text-sm font-medium">
          Viết bình luận
          <UiTextarea required maxLength={4000} value={body} onChange={(e) => B(e.target.value)} />
        </UiLabel>
        <UiButton disabled={busy} aria-busy={busy} variant="default">
          Gửi bình luận
        </UiButton>
      </form>
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="muted text-sm leading-relaxed text-muted-foreground">
          Chưa có bình luận. Chia sẻ cách tiếp cận của bạn.
        </p>
      ) : (
        items.map((x) => (
          <article key={x.id}>
            <b data-user-content>{x.display_name}</b>
            <small> {date(x.created_at)}</small>
            <p
              data-user-content
              className="user-copy grid gap-1 [&>small]:text-xs [&>small]:text-muted-foreground"
            >
              {x.body}
            </p>
          </article>
        ))
      )}
    </section>
  );
}
