import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  User,
  UserPlus,
  LogIn,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { t, LanguageButton } from '../lib/locale';
import { live } from '../lib/live';
import { ErrorBox } from './ui';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Logo } from './layout/AppShell';
import { cn } from '../lib/utils';

export default function Auth({ onUser, status, notice }) {
  const [register, setRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', email: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);

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
    <div className="auth-layout relative flex min-h-dvh items-center justify-center bg-background px-4 py-8 sm:px-6 sm:py-12 overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-96 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-96 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" aria-hidden="true" />

      <Card className="auth-shell relative z-10 w-full max-w-[460px] overflow-hidden rounded-3xl border border-border/80 bg-card p-0 gap-0 shadow-[0_20px_60px_rgba(0,0,0,0.07),0_4px_16px_rgba(0,0,0,0.03)]">
        {/* Top Header */}
        <header className="auth-header flex items-center justify-between gap-4 border-b border-border/70 bg-card px-6 py-4">
          <Logo network />
          <LanguageButton />
        </header>

        {/* Authentication Form */}
        <main className="auth-card flex w-full flex-col justify-center bg-card p-6 sm:p-8">
          {/* Segmented Switcher Tab */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-muted/80 mb-6 border border-border/60">
            <button
              type="button"
              onClick={() => {
                setRegister(false);
                setError(null);
              }}
              className={cn(
                "h-10 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                !register
                  ? "bg-card text-foreground shadow-xs font-extrabold border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LogIn className="size-3.5" aria-hidden="true" />
              <span>{t('Đăng nhập')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRegister(true);
                setError(null);
              }}
              className={cn(
                "h-10 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2",
                register
                  ? "bg-card text-foreground shadow-xs font-extrabold border border-border/50"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <UserPlus className="size-3.5" aria-hidden="true" />
              <span>{t('Tạo tài khoản')}</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="mb-5 space-y-1">
            <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {t(register ? 'Tạo tài khoản CodeGrade' : 'Chào mừng trở lại!')}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                register
                  ? 'Đăng ký tài khoản để bắt đầu luyện tập và thi đấu ngay.'
                  : 'Đăng nhập vào tài khoản của bạn để tiếp tục rèn luyện.',
              )}
            </p>
          </div>

          {notice && (
            <div
              role="status"
              className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
            >
              <Sparkles className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}

          <ErrorBox error={error} />

          {!connected && (
            <p role="status" className="mb-4 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                {t(
                  status === 'offline'
                    ? 'Mất kết nối máy chủ. Đang kết nối lại…'
                    : 'Đang kết nối máy chủ…',
                )}
              </span>
            </p>
          )}

          {/* Form Fields */}
          <form className="space-y-4" onSubmit={submit} aria-busy={busy}>
            {register && (
              <>
                {/* Email */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-action" aria-hidden="true" />
                    <Label htmlFor="auth-email" className="text-xs font-bold text-foreground">
                      Email
                    </Label>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <Input
                      id="auth-email"
                      required
                      type="email"
                      autoComplete="email"
                      placeholder="coder@example.com"
                      value={form.email}
                      onChange={field('email')}
                      className="h-10 pl-9 rounded-xl border border-border/90 bg-slate-100/60 text-sm font-semibold text-foreground transition-all shadow-xs hover:border-action/60 hover:bg-card focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20 dark:border-border dark:bg-slate-900/50 dark:hover:bg-card dark:focus-visible:bg-card"
                    />
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-action" aria-hidden="true" />
                    <Label htmlFor="auth-name" className="text-xs font-bold text-foreground">
                      {t('Họ và tên')}
                    </Label>
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <Input
                      id="auth-name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Nguyễn Văn A"
                      value={form.displayName}
                      onChange={field('displayName')}
                      className="h-10 pl-9 rounded-xl border border-border/90 bg-slate-100/60 text-sm font-semibold text-foreground transition-all shadow-xs hover:border-action/60 hover:bg-card focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20 dark:border-border dark:bg-slate-900/50 dark:hover:bg-card dark:focus-visible:bg-card"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-action" aria-hidden="true" />
                <Label htmlFor="auth-username" className="text-xs font-bold text-foreground">
                  {t('Tên tài khoản')}
                </Label>
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="auth-username"
                  required
                  pattern="[A-Za-z0-9_]{3,40}"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="username (3–40 ký tự)"
                  value={form.username}
                  onChange={field('username')}
                  className="h-10 pl-9 rounded-xl border border-border/90 bg-slate-100/60 text-sm font-semibold text-foreground transition-all shadow-xs hover:border-action/60 hover:bg-card focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20 dark:border-border dark:bg-slate-900/50 dark:hover:bg-card dark:focus-visible:bg-card"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-action" aria-hidden="true" />
                  <Label htmlFor="auth-password" className="text-xs font-bold text-foreground">
                    {t('Mật khẩu')}
                  </Label>
                </div>
                {register && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="size-3 text-emerald-600" aria-hidden="true" /> Tối thiểu 10 ký tự
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <Input
                  id="auth-password"
                  required
                  type={visible ? 'text' : 'password'}
                  minLength={register ? 10 : 1}
                  maxLength={72}
                  autoComplete={register ? 'new-password' : 'current-password'}
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={field('password')}
                  className="h-10 pl-9 pr-10 rounded-xl border border-border/90 bg-slate-100/60 text-sm font-semibold text-foreground transition-all shadow-xs hover:border-action/60 hover:bg-card focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20 dark:border-border dark:bg-slate-900/50 dark:hover:bg-card dark:focus-visible:bg-card"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={t(visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')}
                  onClick={() => setVisible((value) => !value)}
                >
                  {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-xl bg-action text-sm font-bold text-white shadow-xs hover:bg-action-hover active:bg-action-active transition-all cursor-pointer flex items-center justify-center gap-2"
              aria-busy={busy}
              disabled={busy || !connected}
            >
              {busy ? (
                <LoaderCircle className="size-4.5 animate-spin" />
              ) : (
                <ArrowRight className="size-4.5" />
              )}
              <span>{t(busy ? 'Đang xử lý…' : register ? 'Hoàn tất đăng ký →' : 'Đăng nhập vào hệ thống →')}</span>
            </Button>
          </form>

          {/* Bottom Switcher Link */}
          <div className="mt-5 border-t border-border/70 pt-4 text-center text-xs text-muted-foreground">
            <span>{t(register ? 'Đã có tài khoản CodeGrade?' : 'Chưa có tài khoản?')}</span>{' '}
            <button
              type="button"
              className="font-bold text-action hover:underline cursor-pointer ml-1"
              onClick={() => {
                setRegister((value) => !value);
                setError(null);
                setForm((previous) => ({ ...previous, password: '' }));
              }}
            >
              {t(register ? 'Đăng nhập ngay' : 'Đăng ký tài khoản mới')}
            </button>
          </div>
        </main>
      </Card>
    </div>
  );
}
