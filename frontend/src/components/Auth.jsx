import React,{useState} from 'react';
import {t,LanguageButton} from '../lib/locale';
import {live} from '../lib/live';
import {ErrorBox} from './ui';
const features=[['Luyện tập','Bài tập theo chủ đề, chấm kết quả tự động.'],['Code Survival','Thi đấu theo vòng, giải đúng để đi tiếp.'],['Contest','Cuộc thi theo lịch, bảng điểm và Elo.']];
export default function Auth({onUser,status,notice}){
 const [register,R]=useState(false),[form,F]=useState({username:'',password:'',displayName:'',email:''}),[error,E]=useState(null),[busy,B]=useState(false);
 async function send(e){e.preventDefault();B(true);E(null);try{onUser(await live.signIn(register?'REGISTER':'LOGIN',form));}catch(e){E(e);}finally{B(false);}}
 const field=key=>e=>F({...form,[key]:e.target.value});
 return <div className="auth-layout">
 <div className="auth-shell">
  <header className="auth-header"><a className="brand auth-identity" href="#/practice"><span className="brand-icon" aria-hidden="true"><i className="fa-solid fa-terminal"/></span>CodeGrade <span>Network</span></a><LanguageButton/></header>
  <section className="auth-story" aria-label={t('Khám phá CodeGrade Network')}>
   <h1>{t('Luyện tập lập trình')}</h1>
   <p className="auth-intro">{t('Nộp lời giải, theo dõi kết quả chấm và tham gia các cuộc thi.')}</p>
   <dl className="auth-feature-list">{features.map(([title,detail])=><div key={title}><dt>{t(title)}</dt><dd>{t(detail)}</dd></div>)}</dl>
   <p className="auth-story-footer">C++11 · C++17 · C++20 · Python 3.11</p>
  </section>
  <main className="auth-card">
   <h2>{t(register?'Tạo tài khoản':'Đăng nhập')}</h2><p className="auth-description">{t(register?'Đăng ký tài khoản để luyện tập và tham gia thi đấu.':'Sử dụng tài khoản CodeGrade của bạn.')}</p>
   {notice&&<p role="status" className="auth-success">{notice}</p>}<ErrorBox error={error}/>
   {['connecting','offline'].includes(status)&&<p className="muted" role="status">{t(status==='offline'?'Mất kết nối máy chủ. Đang kết nối lại…':'Đang kết nối máy chủ…')}</p>}
   <form onSubmit={send} aria-busy={busy}>
    {register&&<><label>{t('Email')}<input required type="email" autoComplete="email" value={form.email} onChange={field('email')}/></label><label>{t('Họ tên')}<input required maxLength={100} autoComplete="name" value={form.displayName} onChange={field('displayName')}/></label></>}
    <label>{t('Tên tài khoản')}<input required pattern="[A-Za-z0-9_]{3,40}" autoComplete="username" autoCapitalize="none" spellCheck={false} value={form.username} onChange={field('username')}/></label>
    <label>{t('Mật khẩu')}<input required type="password" minLength={register?10:1} maxLength={72} autoComplete={register?'new-password':'current-password'} value={form.password} onChange={field('password')}/></label>
    <button type="submit" aria-busy={busy} disabled={busy||status==='offline'||status==='connecting'}>{t(busy?'Đang xử lý…':register?'Tạo tài khoản':'Đăng nhập')}</button>
   </form><p className="auth-switch">{t(register?'Đã có tài khoản?':'Chưa có tài khoản?')} <button type="button" className="link" onClick={()=>{R(!register);E(null);F({...form,password:''});}}>{t(register?'Đăng nhập':'Đăng ký')}</button></p>
  </main>
 </div>
 </div>;
}
