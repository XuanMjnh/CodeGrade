import React,{useState} from 'react';
import {t} from '../lib/locale';
import {live} from '../lib/live';
import {ErrorBox} from './ui';
export default function PasswordChange({onNotice}){
 const [currentPassword,C]=useState(''),[newPassword,N]=useState(''),[confirmation,F]=useState(''),[busy,B]=useState(false),[error,E]=useState(null);
 async function save(e){e.preventDefault();E(null);if(newPassword!==confirmation){E(Error(t('Mật khẩu xác nhận không khớp.')));return;}if(new TextEncoder().encode(newPassword).length>72){E(Error(t('Mật khẩu mới cần ít nhất 10 ký tự và tối đa 72 byte')));return;}B(true);try{await live.call('PASSWORD_CHANGE',{currentPassword,newPassword});C('');N('');F('');onNotice(t('Đã đổi mật khẩu. Vui lòng đăng nhập lại.'));live.clearAuth();}catch(e){E(e);}finally{B(false);}}
 return <form className="paper pad password-change" onSubmit={save} aria-busy={busy}><h2>{t('Đổi mật khẩu')}</h2><p className="muted">{t('Dùng mật khẩu có ít nhất 10 ký tự. Sau khi đổi, tất cả phiên đăng nhập sẽ kết thúc.')}</p><ErrorBox error={error}/><label>{t('Mật khẩu hiện tại')}<input type="password" autoComplete="current-password" required maxLength={72} value={currentPassword} onChange={e=>C(e.target.value)}/></label><label>{t('Mật khẩu mới')}<input type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={newPassword} onChange={e=>N(e.target.value)}/></label><label>{t('Nhập lại mật khẩu mới')}<input type="password" autoComplete="new-password" required minLength={10} maxLength={72} value={confirmation} onChange={e=>F(e.target.value)}/></label><button disabled={busy} aria-busy={busy}>{t(busy?'Đang lưu…':'Đổi mật khẩu')}</button></form>;
}
