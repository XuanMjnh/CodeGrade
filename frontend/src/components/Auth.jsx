import React, { useState } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { t, LanguageButton } from '../lib/locale';
import { live } from '../lib/live';
import { ErrorBox } from './ui';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Logo } from './layout/AppShell';
const features = [
  ['Luyện tập', 'Bài tập theo chủ đề, chấm kết quả tự động.'],
  ['Code Survival', 'Thi đấu theo vòng, giải đúng để đi tiếp.'],
  ['Contest', 'Cuộc thi theo lịch, bảng điểm và Elo.'],
];
export default function Auth({ onUser, status, notice }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', email: '' });
  const [error, setError] = useState(null),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(false);
  const connected = !['offline', 'connecting'].includes(status);
  const field = (key) => (event) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onUser(await live.signIn(register ? 'REGISTER' : 'LOGIN', form));
    } catch (reason) {
      setError(reason);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout grid min-h-dvh place-items-center bg-background px-4 py-8 sm:px-6 sm:py-10">
      <Card className="auth-shell grid w-full max-w-[1040px] grid-cols-1 gap-0 overflow-hidden rounded-[20px] border bg-card py-0 shadow-[0_20px_60px_rgb(14_23_36/.10),0_3px_12px_rgb(14_23_36/.04)] min-[641px]:grid-cols-2">
        <header className="auth-header col-span-full flex items-center justify-between gap-4 border-b px-6 py-5 sm:px-8">
          <Logo network />
          <LanguageButton />
        </header>
        <section
          className="auth-story flex flex-col items-start border-r bg-inverse px-8 pt-10 pb-7 font-mono max-[640px]:hidden"
          aria-label={t('Khám phá CodeGrade Network')}
        >
          <h1 className="mb-3 font-heading text-[30px] leading-[1.45] font-semibold tracking-[-.025em] text-white">
            {t('Luyện tập lập trình')}
          </h1>
          <p className="max-w-[39ch] text-[13px] leading-[1.7] text-inverse-muted">
            {t('Nộp lời giải, theo dõi kết quả chấm và tham gia các cuộc thi.')}
          </p>
          <dl className="my-[30px] grid gap-[18px]">
            {features.map(([title, detail]) => (
              <div key={title}>
                <dt className="mb-[3px] text-[13px] font-semibold text-white">{t(title)}</dt>
                <dd className="text-xs leading-[1.6] text-inverse-muted">{t(detail)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-auto w-full border-t pt-5 text-[11px] text-inverse-muted">
            C++11 · C++17 · C++20 · Python 3.11
          </p>
        </section>
        <main className="auth-card flex w-full flex-col justify-center bg-card px-6 pt-9 pb-7 sm:px-9">
          <h2 className="mb-2 font-heading text-[22px] leading-[1.35] font-bold tracking-[-.02em]">
            {t(register ? 'Tạo tài khoản' : 'Đăng nhập')}
          </h2>
          <p className="mb-7 text-[13px] leading-[1.6] text-muted-foreground">
            {t(
              register
                ? 'Đăng ký tài khoản để luyện tập và tham gia thi đấu.'
                : 'Sử dụng tài khoản CodeGrade của bạn.',
            )}
          </p>
          {notice && (
            <p
              role="status"
              className="mb-4 rounded-md bg-success-soft p-3 text-[13px] text-success"
            >
              {notice}
            </p>
          )}
          <ErrorBox error={error} />
          {!connected && (
            <p role="status" className="mb-4 text-xs text-muted-foreground">
              {t(
                status === 'offline'
                  ? 'Mất kết nối máy chủ. Đang kết nối lại…'
                  : 'Đang kết nối máy chủ…',
              )}
            </p>
          )}
          <form className="space-y-[18px]" onSubmit={submit} aria-busy={busy}>
            {register && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="auth-email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="auth-email"
                    required
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={field('email')}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auth-name" className="text-xs">
                    {t('Họ tên')}
                  </Label>
                  <Input
                    id="auth-name"
                    required
                    maxLength={100}
                    autoComplete="name"
                    value={form.displayName}
                    onChange={field('displayName')}
                  />
                </div>
              </>
            )}
            <div className="grid gap-2">
              <Label htmlFor="auth-username" className="text-xs">
                {t('Tên tài khoản')}
              </Label>
              <Input
                id="auth-username"
                required
                pattern="[A-Za-z0-9_]{3,40}"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                value={form.username}
                onChange={field('username')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="auth-password" className="text-xs">
                {t('Mật khẩu')}
              </Label>
              <div className="relative">
                <Input
                  id="auth-password"
                  className="pr-11"
                  required
                  type={visible ? 'text' : 'password'}
                  minLength={register ? 10 : 1}
                  maxLength={72}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  value={form.password}
                  onChange={field('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 text-muted-foreground"
                  aria-label={t(visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')}
                  onClick={() => setVisible((value) => !value)}
                >
                  {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="mt-1.5 w-full bg-action text-[13px] text-white hover:bg-action-hover"
              aria-busy={busy}
              disabled={busy || !connected}
            >
              {busy && <LoaderCircle className="size-4 animate-spin" />}
              {t(busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập')}
            </Button>
          </form>
          <p className="mt-6 border-t pt-5 text-xs text-muted-foreground">
            {t(register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?')}{' '}
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-8 px-[3px] text-xs font-medium text-success"
              onClick={() => {
                setRegister((value) => !value);
                setError(null);
                setForm((previous) => ({ ...previous, password: '' }));
              }}
            >
              {t(register ? 'Đăng nhập' : 'Đăng ký')}
            </Button>
          </p>
        </main>
      </Card>
    </div>
  );
}
