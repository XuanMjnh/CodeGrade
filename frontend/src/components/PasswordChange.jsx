import { Button as UiButton } from './ui/button';
import { Input as UiInput } from './ui/input';
import { Label as UiLabel } from './ui/label';
import React, { useState } from 'react';
import { t } from '../lib/locale';
import { live } from '../lib/live';
import { ErrorBox } from './ui';
export default function PasswordChange({ onNotice }) {
  const [currentPassword, C] = useState(''),
    [newPassword, N] = useState(''),
    [confirmation, F] = useState(''),
    [busy, B] = useState(false),
    [error, E] = useState(null);
  async function save(e) {
    e.preventDefault();
    E(null);
    if (newPassword !== confirmation) {
      E(Error(t('Mật khẩu xác nhận không khớp.')));
      return;
    }
    if (new TextEncoder().encode(newPassword).length > 72) {
      E(Error(t('Mật khẩu mới cần ít nhất 10 ký tự và tối đa 72 byte')));
      return;
    }
    B(true);
    try {
      await live.call('PASSWORD_CHANGE', {
        currentPassword,
        newPassword,
      });
      C('');
      N('');
      F('');
      onNotice(t('Đã đổi mật khẩu. Vui lòng đăng nhập lại.'));
      live.clearAuth();
    } catch (e) {
      E(e);
    } finally {
      B(false);
    }
  }
  return (
    <form
      className="paper text-card-foreground shadow-xs pad sm:p-6 password-change space-y-4 rounded-[14px] border bg-card p-5"
      onSubmit={save}
      aria-busy={busy}
    >
      <h2>{t('Đổi mật khẩu')}</h2>
      <p className="muted text-sm leading-relaxed text-muted-foreground">
        {t('Dùng mật khẩu có ít nhất 10 ký tự. Sau khi đổi, tất cả phiên đăng nhập sẽ kết thúc.')}
      </p>
      <ErrorBox error={error} />
      <UiLabel className="grid gap-2 text-sm font-medium">
        {t('Mật khẩu hiện tại')}
        <UiInput
          type="password"
          autoComplete="current-password"
          required
          maxLength={72}
          value={currentPassword}
          onChange={(e) => C(e.target.value)}
        />
      </UiLabel>
      <UiLabel className="grid gap-2 text-sm font-medium">
        {t('Mật khẩu mới')}
        <UiInput
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={72}
          value={newPassword}
          onChange={(e) => N(e.target.value)}
        />
      </UiLabel>
      <UiLabel className="grid gap-2 text-sm font-medium">
        {t('Nhập lại mật khẩu mới')}
        <UiInput
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={72}
          value={confirmation}
          onChange={(e) => F(e.target.value)}
        />
      </UiLabel>
      <UiButton disabled={busy} aria-busy={busy} variant="default">
        {t(busy ? 'Đang lưu…' : 'Đổi mật khẩu')}
      </UiButton>
    </form>
  );
}
