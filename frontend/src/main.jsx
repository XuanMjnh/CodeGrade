import Auth from './components/Auth';
import {t as trUI} from "./lib/locale";
import '@fontsource-variable/inter';
import '@fortawesome/fontawesome-free/css/all.min.css';
import {installPagination} from './lib/pagination';
import './lib/locale';
import {LanguageButton} from './lib/locale';
import {Profile,Announcements} from './pages/Community';
import Utilities from './components/Utilities';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/manrope';
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {live} from './lib/live';
import {ErrorBox,Loading,go} from './components/ui';
import Practice from './pages/Practice';
import Workspace from './pages/Workspace';
import QuestionEditor from './pages/QuestionEditor';
import {Rooms,Room} from './pages/Survival';
import {SubmissionsPage,Leaderboard,Categories,Admin} from './pages/Records';
import Contests from './pages/Contests';
import './style.css';
const roles={ADMIN:'Admin',AUTHOR:trUI("Người tạo đề"),CODER:'Coder'};
function HeaderSearch(){const [query,Q]=useState('');return <form className="header-search" role="search" onSubmit={e=>{e.preventDefault();go('/practice?search='+encodeURIComponent(query.trim()));}}><input type="search" aria-label={trUI('Tìm bài tập')} placeholder={trUI('Tìm bài tập…')} value={query} maxLength={100} onChange={e=>Q(e.target.value)}/><button type="submit" aria-label={trUI('Tìm kiếm')}><i className="fa-solid fa-magnifying-glass" aria-hidden="true"/></button></form>;}
class Boundary extends React.Component{constructor(p){super(p);this.state={error:null};}static getDerivedStateFromError(error){return{error};}render(){return this.state.error?<div className="pad"><ErrorBox error={this.state.error}/><button onClick={()=>location.reload()}>Tải lại ứng dụng</button></div>:this.props.children;}}
function App(){
 const [navOpen,setNavOpen]=useState(false);
 useEffect(()=>{const close=()=>setNavOpen(false);const escape=e=>{if(e.key==='Escape'&&navOpen){close();document.querySelector('.nav-toggle')?.focus();}};window.addEventListener('hashchange',close);window.addEventListener('keydown',escape);return()=>{window.removeEventListener('hashchange',close);window.removeEventListener('keydown',escape);};},[navOpen]);
 const [user,setUser]=useState(null),[status,setStatus]=useState('connecting'),[path,setPath]=useState(location.hash.slice(1)||'/practice'),[revision,setRevision]=useState(0),[notice,setNotice]=useState('');
 useEffect(()=>{
  let t;const offState=live.onState(setStatus),off=live.subscribe(m=>{
   if(m.event==='announcement_published')setNotice(m.data.title);
   if(m.event==='logged_out'){setUser(null);return;}
   if(m.event==='connected'&&live.token)live.call('SYNC').then(d=>{setUser(d.user);setRevision(v=>v+1);}).catch(()=>{live.clearAuth();});
   if(!t)t=setTimeout(()=>{t=null;setRevision(v=>v+1);},200);
  });live.connect();
  let previousHash=location.hash;const h=()=>{const guard=new CustomEvent('codegrade:before-navigate',{cancelable:true});window.dispatchEvent(guard);if(guard.defaultPrevented){history.replaceState(null,'',location.pathname+location.search+previousHash);return;}previousHash=location.hash;setPath(location.hash.slice(1)||'/practice');};addEventListener('hashchange',h);
  return()=>{off();offState();clearTimeout(t);removeEventListener('hashchange',h);};
 },[]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),7000);return()=>clearTimeout(t);},[notice]);
 const onNotice=(s)=>{setNotice(s);setRevision(v=>v+1);};
 if(!user){if(live.token&&status!=='anonymous')return <div className="boot"><div className="brand">CodeGrade</div><Loading/></div>;return <Auth onUser={setUser} status={status} notice={notice}/>;}
 const [route,query]=path.split('?'),parts=route.split('/').filter(Boolean),name=parts[0]||'practice',id=parts[1],author=user.role!=='CODER';
 let content;
 switch(name){
  case 'profile':content=<Profile user={user} revision={revision} onUserChange={setUser} onNotice={onNotice}/>;break;
  case 'announcements':content=<Announcements user={user} revision={revision} onNotice={onNotice}/>;break;
  case 'practice':content=<Practice user={user} revision={revision}/>;break;
  case 'solve': {
   const cId = new URLSearchParams(query).get('contest');
   content = <Workspace key={(cId ? 'contest-' + cId : 'practice') + '-' + id} id={id} user={user} revision={revision} contestId={cId} onNotice={onNotice}/>;
   break;
  }
  case 'edit':content=author?<QuestionEditor key={id||'new'} id={id} revision={revision} onNotice={onNotice}/>:<ErrorBox error={trUI("Bạn không có quyền tạo/sửa đề.")}/>;break;
  case 'survival':content=<Rooms user={user} revision={revision}/>;break;
  case 'room':content=<Room key={id} id={id} user={user} revision={revision} onNotice={onNotice}/>;break;
  case 'submissions':content=<SubmissionsPage revision={revision}/>;break;
  case 'leaderboard':content=<Leaderboard revision={revision} user={user}/>;break;
  case 'categories':content=author?<Categories revision={revision} onNotice={onNotice}/>:<ErrorBox error={trUI("Bạn không có quyền quản lý category.")}/>;break;
  case 'admin':content=user.role==='ADMIN'?<Admin revision={revision} onNotice={onNotice}/>:<ErrorBox error={trUI("Bạn không có quyền Admin.")}/>;break;
  case 'contests':content=<Contests user={user} revision={revision} onNotice={onNotice} contestId={id}/>;break;
  default:content=<div className="empty">Trang không tồn tại. <a href="#/practice">Về Practice</a></div>;
 }
 const arena=['survival','room'].includes(name),focused=arena||['edit','solve'].includes(name);
 return <div className={'app-shell '+(arena?'shell-arena':name==='edit'?'shell-studio':'shell-platform')}><a className="skip-link" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById("main-content").focus();}}>Đến nội dung chính</a><header className="header"><a className="brand" href="#/practice"><span className="brand-icon" aria-hidden="true"><i className="fa-solid fa-terminal"/></span>CodeGrade</a><button className="nav-toggle secondary" aria-controls="primary-nav" aria-expanded={navOpen} onClick={()=>setNavOpen(!navOpen)} aria-label={trUI("Mở điều hướng")}><i className={"fa-solid "+(navOpen?"fa-xmark":"fa-bars")} aria-hidden="true"/></button><nav id="primary-nav" className={navOpen?"is-open":""} aria-label={trUI("Điều hướng chính")}>{[['practice',trUI("Luyện tập")],['survival','Code Survival'],['contests','Contest'],['leaderboard',trUI("Xếp hạng")],['submissions',trUI("Bài nộp")]].map(([k,label])=>{const selected=name===k||(k==='practice'&&['solve','edit'].includes(name))||(k==='survival'&&name==='room');return <a key={k} className={selected?'selected':''} aria-current={selected?'page':undefined} href={'#/'+k}>{label}</a>;})}</nav><HeaderSearch/><div className="user-menu"><a className={'notification-link '+(name==='announcements'?'selected':'')} href="#/announcements" aria-label={trUI("Thông báo")} title={trUI("Thông báo")}><i className="fa-regular fa-bell" aria-hidden="true"/></a><LanguageButton/><details onKeyDown={e=>{if(e.key==='Escape'){e.currentTarget.open=false;e.currentTarget.querySelector('summary').focus();}}}><summary aria-label={trUI("Mở menu tài khoản")}><span className="avatar" aria-hidden="true">{user.displayName.slice(0,1)}</span><span className="header-user-name" title={user.displayName} data-user-content>{user.displayName}</span></summary><div className="dropdown"><b data-user-content>{user.displayName}</b><small>{roles[user.role]} · @{user.username}</small><a href="#/profile" onClick={e=>e.currentTarget.closest('details').open=false}>Thông tin cá nhân</a><a href="#/announcements" onClick={e=>e.currentTarget.closest('details').open=false}>Thông báo</a>{author&&<a href="#/categories" onClick={e=>e.currentTarget.closest('details').open=false}>Danh mục</a>}{user.role==='ADMIN'&&<a href="#/admin" onClick={e=>e.currentTarget.closest('details').open=false}>Quản trị</a>}<button className="ghost danger-text" onClick={()=>live.logout().catch(()=>{})}>Đăng xuất</button></div></details></div></header>{status==='offline'&&<div className="offline-banner" role="status">Mất kết nối. Đang kết nối lại và khôi phục sự kiện; đồng hồ trận vẫn chạy.</div>}<div className={"app-layout "+(focused?"layout-focused":"")} >{!focused&&<Utilities side="left" revision={revision}/>}<main id="main-content" className="main" tabIndex={-1}>{notice&&<div role="status" className="toast">{notice}<button className="ghost" aria-label={trUI("Đóng thông báo")} onClick={()=>setNotice('')}>×</button></div>}{content}</main>{!focused&&<Utilities side="right" revision={revision}/>}</div><footer className="footer"><b>CodeGrade Network</b><span>Giải nhanh. Trụ vững. Chiến thắng.</span><span>© 2026 CodeGrade</span></footer></div>;
}
createRoot(document.getElementById('root')).render(<Boundary><App/></Boundary>);

installPagination();
