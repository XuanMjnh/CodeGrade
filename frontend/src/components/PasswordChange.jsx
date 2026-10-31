import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ErrorBox } from './ui';
import { Lock, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { t } from '../lib/locale';
import { live } from '../lib/live';

export default function PasswordChange({ onNotice }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function save(e) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmation) {
      setError(new Error(t('Mật khẩu xác nhận không khớp.')));
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      setError(new Error(t('Mật khẩu mới cần ít nhất 10 ký tự và tối đa 72 byte.')));
      return;
    }
    setBusy(true);
    try {
      await live.call('PASSWORD_CHANGE', {
        currentPassword,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      onNotice(t('Đã đổi mật khẩu. Vui lòng đăng nhập lại.'));
      live.clearAuth();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="password-change min-w-0 rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs space-y-4"
      onSubmit={save}
      aria-busy={busy}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/50 pb-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-action border border-orange-500/20">
          <KeyRound className="size-4" />
        </span>
        <div>
          <h3 className="font-heading text-base font-extrabold text-foreground">
            {t('Đổi mật khẩu')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('Dùng mật khẩu tối thiểu 10 ký tự để bảo vệ tài khoản')}
          </p>
        </div>
      </div>

      <ErrorBox error={error} />

      {/* Current Password */}
      <div className="space-y-1.5">
        <Label htmlFor="pwd-current" className="text-xs font-bold text-foreground">
          {t('Mật khẩu hiện tại')}
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="pwd-current"
            type={showCurrent ? 'text' : 'password'}
            autoComplete="current-password"
            required
            maxLength={72}
            placeholder="••••••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-10 pl-9 pr-10 rounded-xl border border-border/90 bg-slate-100/60 dark:bg-slate-900/50 text-sm font-semibold text-foreground transition-all shadow-xs focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={t(showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')}
            onClick={() => setShowCurrent((v) => !v)}
          >
            {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="pwd-new" className="text-xs font-bold text-foreground">
            {t('Mật khẩu mới')}
          </Label>
          <span className="text-[11px] text-muted-foreground">Tối thiểu 10 ký tự</span>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="pwd-new"
            type={showNew ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={72}
            placeholder="••••••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-10 pl-9 pr-10 rounded-xl border border-border/90 bg-slate-100/60 dark:bg-slate-900/50 text-sm font-semibold text-foreground transition-all shadow-xs focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={t(showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')}
            onClick={() => setShowNew((v) => !v)}
          >
            {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Confirm New Password */}
      <div className="space-y-1.5">
        <Label htmlFor="pwd-confirm" className="text-xs font-bold text-foreground">
          {t('Nhập lại mật khẩu mới')}
        </Label>
        <div className="relative">
          <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            id="pwd-confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={10}
            maxLength={72}
            placeholder="••••••••••••"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            className="h-10 pl-9 pr-10 rounded-xl border border-border/90 bg-slate-100/60 dark:bg-slate-900/50 text-sm font-semibold text-foreground transition-all shadow-xs focus-visible:border-action focus-visible:bg-card focus-visible:ring-3 focus-visible:ring-action/20"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label={t(showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu')}
            onClick={() => setShowConfirm((v) => !v)}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="h-10 px-5 rounded-xl bg-action hover:bg-action-hover active:bg-action-active text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <Lock className="size-4" />
          <span>{t(busy ? 'Đang lưu…' : 'Cập nhật mật khẩu')}</span>
        </Button>
      </div>
    </form>
  );
}
