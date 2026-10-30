import React,{useState,useEffect} from 'react';
import ProgressionStrip from '../components/ProgressionStrip';
import RankEmblem from '../components/RankEmblem';
import {live} from '../lib/live';
import {Badge,ErrorBox,Loading,useResource,go,TimeLeft} from '../components/ui';

const MODES=[
 {id:'PRACTICE',name:'Giao lưu',tag:'CUSTOM ROOM',icon:'fa-terminal',detail:'Lập đội cùng bạn bè, luyện kỹ năng qua từng vòng.',facts:['2–10 người · Phòng riêng','Tùy chọn độ khó & thời gian','Không cộng EXP · Không tính Rank']},
 {id:'NORMAL',name:'Đấu thường',tag:'QUICK MATCH',icon:'fa-bolt',detail:'Vào trận, giải đề và trở thành người trụ lại.',facts:['5 người · Ghép trận tự động','Nhận EXP theo thứ hạng','Không thay đổi điểm Rank']},
 {id:'RANKED',name:'Đấu Rank',tag:'RANKED ARENA',icon:'fa-trophy',detail:'Đối đầu xứng tầm. Chinh phục thứ hạng mới.',facts:['5 người · Ghép theo rating','Tích lũy EXP & điểm Rank','Tiến lên bảng xếp hạng']}
];

function ModeCard({item,selected,disabled,onSelect}){
 return <button type="button" className={'mode-card mode-'+item.id.toLowerCase()+(selected?' selected':'')} aria-pressed={selected} disabled={disabled} onClick={onSelect}>
  <span className="mode-icon" aria-hidden="true"><i className={'fa-solid '+item.icon}/></span>
  <span className="mode-copy"><small>{item.tag}</small><strong>{item.name}</strong><span>{item.detail}</span></span>
  <span className="mode-status">{selected?'Đang chọn':'Chọn chế độ'}<i className={'fa-solid '+(selected?'fa-circle-check':'fa-arrow-right')} aria-hidden="true"/></span>
 </button>;
}

function MatchmakingPanel({mode,queue,waiting,found,waited,busy,user,action}){
 return <section className={'arena-box matchmaking-panel '+(waiting?'is-searching':found?'match-found':'')} aria-label="Tìm trận">
  <div className="queue-heading"><span className="eyebrow">{mode==='RANKED'?'RANKED MATCH':'QUICK MATCH'}</span><Badge>MỤC TIÊU 5/5 CODER</Badge></div>
  <div className="queue-visual" aria-hidden="true"><span/><i className={'fa-solid '+(found?'fa-check':waiting?'fa-satellite-dish':mode==='RANKED'?'fa-trophy':'fa-bolt')}/></div>
  <h3>{found?'Đã tìm thấy trận!':waiting?'Đang tìm đối thủ':mode==='RANKED'?'Sẵn sàng leo hạng?':'Sẵn sàng vào đấu trường?'}</h3>
  {!found&&<div className="queue-squad" aria-hidden="true">{Array.from({length:5},(_,i)=><span key={i}><i className="fa-solid fa-user"/></span>)}</div>}
  {waiting?<div role="status" aria-live="polite"><div className="queue-elapsed">{String(Math.floor(waited/60)).padStart(2,'0')}<span>:</span>{String(waited%60).padStart(2,'0')}</div><p>{queue.waiting} người đang chờ trong hàng đợi {queue.mode}.</p>{mode==='RANKED'&&<p>Chênh lệch rating tối đa: {queue.ratingRange}. Phạm vi được nới theo thời gian chờ.</p>}<button className="secondary" disabled={busy} onClick={()=>action('MATCH_QUEUE_CANCEL')}>Hủy tìm trận</button></div>
  :found?<div role="status"><p>{queue.accepted}/5 người đã xác nhận · Nhận trận trước khi hết thời gian</p><div className="accept-slots" aria-label={queue.accepted+' trên 5 người đã xác nhận'}>{Array.from({length:5},(_,i)=><span key={i} className={i<queue.accepted?'confirmed':''} aria-hidden="true"><i className={'fa-solid '+(i<queue.accepted?'fa-check':'fa-user')}/></span>)}</div><TimeLeft deadline={queue.acceptDeadline}/><div className="inline queue-actions"><button className="arena-game-button" disabled={busy||queue.state==='ACCEPTED'} onClick={()=>action('MATCH_ACCEPT',{roomId:queue.roomId})}>{queue.state==='ACCEPTED'?'Đã xác nhận · Chờ đủ 5 người':'Nhận trận'}<i className="fa-solid fa-check" aria-hidden="true"/></button><button className="secondary" disabled={busy} onClick={()=>action('MATCH_DECLINE')}>Từ chối</button></div></div>
  :<><p>{mode==='RANKED'?'Ghép với đối thủ theo rating. Kết quả trận quyết định EXP và điểm Rank của bạn.':'Đủ 5 Coder, trận đấu bắt đầu sau khi tất cả xác nhận. Sẵn sàng thử sức?'}</p><button className="arena-game-button queue-play" disabled={busy||user.role!=='CODER'} onClick={()=>action('MATCH_QUEUE_JOIN',{mode})}><i className="fa-solid fa-play" aria-hidden="true"/>{busy?'Đang xử lý…':mode==='RANKED'?'Tìm trận Ranked':'Tìm trận'}<i className="fa-solid fa-arrow-right" aria-hidden="true"/></button><small className="queue-reward"><i className="fa-solid fa-star" aria-hidden="true"/> EXP theo thứ hạng{mode==='RANKED'?' · Có tính điểm Rank':' · Không tính điểm Rank'}</small></>}
  <details className="queue-policy"><summary>Quy tắc ghép trận & phần thưởng</summary><p>Trận chỉ đếm ngược sau khi cả 5 người xác nhận. EXP theo hạng: 100 / 80 / 60 / 40 / 20; người đồng hạng nhận EXP theo vị trí thấp nhất của nhóm hòa. Ví dụ: một người nhất nhận 100 EXP, bốn người còn lại hòa nhau nhận 20 EXP mỗi người. Chỉ Ranked thay đổi điểm Rank. Elo Contest được tính riêng. Phạm vi ghép Ranked tăng từ 150 → 250 → 350 → 400 điểm ở các mốc 10s, 20s, 30s.</p></details>
 </section>;
}

export default function SurvivalLobby({user,revision}){
 const [rooms,roomError]=useResource('ROOM_LIST',{},revision),[stats,statsError]=useResource('PROGRESSION_GET',{},revision);
 const [leaders,leaderError]=useResource('RANKED_LEADERBOARD',{},revision),[history,historyError]=useResource('MATCH_HISTORY',{},revision);
 const [mode,M]=useState('PRACTICE'),[queue,Q]=useState(null),[error,E]=useState(null),[busy,B]=useState(false);
 const [name,N]=useState(''),[capacity,C]=useState(5),[levels,L]=useState([1,2,3]),[code,S]=useState(''),[clock,T]=useState(Date.now());
 useEffect(()=>{if(user.role!=='CODER')return;let active=true;
  const refresh=()=>live.call('MATCH_QUEUE_STATUS').then(q=>{if(active){Q(q);if(q.mode&&['WAITING','MATCH_FOUND','ACCEPTED','STARTED'].includes(q.state))M(q.mode);if(q.state==='STARTED')go('/room/'+q.roomId);}}).catch(e=>{if(active)E(e);});
  refresh();const timer=setInterval(refresh,3000);return()=>{active=false;clearInterval(timer);};
 },[user.id,revision]);
 useEffect(()=>{const timer=setInterval(()=>T(Date.now()),1000);return()=>clearInterval(timer);},[]);
 async function action(type,p={}){B(true);E(null);try{const q=await live.call(type,p);if(type==='ROOM_CREATE'||type==='ROOM_JOIN'){go('/room/'+q.id);return;}Q(q);if(q.state==='STARTED')go('/room/'+q.roomId);}catch(e){E(e);}finally{B(false);}}
 const waiting=queue?.state==='WAITING',found=['MATCH_FOUND','ACCEPTED'].includes(queue?.state),occupied=waiting||found;
 const waited=waiting?Math.max(0,Math.floor((clock+(live.offset||0)-queue.joinedAt)/1000)):0;
 const selectedMode=MODES.find(item=>item.id===mode);
 function focusModes(e){e.preventDefault();document.getElementById('survival-modes')?.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});document.querySelector('.mode-card[aria-pressed="true"]')?.focus({preventScroll:true});}
 return <div className="arena-page arena-lobby">
  <section className="arena-hero">
   <div className="arena-hero-copy"><span className="arena-lobby-label"><i className="fa-solid fa-gamepad" aria-hidden="true"/> MULTIPLAYER CODING ARENA</span><h1>CODE <span>SURVIVAL</span><span className="arena-title-dot" aria-hidden="true">.</span></h1><p>Giải đề. Vượt vòng. Trở thành Coder trụ lại cuối cùng.</p><div className="arena-hero-actions"><a className="button arena-game-button" href="#survival-modes" onClick={focusModes}><i className="fa-solid fa-play" aria-hidden="true"/> Chọn đấu trường <i className="fa-solid fa-arrow-down" aria-hidden="true"/></a><span className="arena-room-count"><i className="fa-solid fa-door-open" aria-hidden="true"/>{rooms?rooms.length+' phòng giao lưu':'Đang tải phòng…'}</span></div></div>
   <div className="arena-hero-art" aria-hidden="true"><span className="arena-art-code code-left">&lt;/&gt;</span><div className="arena-emblem"><i className="fa-solid fa-trophy"/><span>LAST CODER<br/>STANDING</span></div><span className="arena-art-code code-right">{ }</span><div className="arena-art-caption"><span/> CODE · COMPETE · SURVIVE <span/></div></div>
  </section>
  <ErrorBox error={error||roomError||statsError||leaderError||historyError}/>
  <div className="arena-player-banner">{stats?<ProgressionStrip stats={stats} user={user} showRankGuide/>:<Loading/>}</div>
  <div className="arena-command-layout">
   <section className="arena-mode-picker" aria-label="Chọn chế độ Survival">
    <div className="arena-section-heading"><div><span className="arena-step">01</span><h2>Chọn chế độ</h2></div><span>Ba đấu trường. Một mục tiêu.</span></div>
    <div id="survival-modes" className="survival-modes" aria-label="Chế độ Code Survival">{MODES.map(item=><ModeCard key={item.id} item={item} selected={mode===item.id} disabled={busy||(occupied&&mode!==item.id)} onSelect={()=>M(item.id)}/>)}</div>

   </section>
   <section className="arena-box arena-stage" aria-label="Thiết lập trận đấu">
    <div className="arena-section-heading"><div><span className="arena-step">02</span><h2>{mode==='PRACTICE'?'Thiết lập phòng':'Chuẩn bị vào trận'}</h2></div><span className={'arena-selected-mode selected-'+mode.toLowerCase()}><i className={'fa-solid '+selectedMode.icon} aria-hidden="true"/>{selectedMode.name}</span></div>
    <ul className="arena-mode-facts" aria-label={'Thông tin chế độ '+selectedMode.name}>{selectedMode.facts.map(f=><li key={f}><i className="fa-solid fa-check" aria-hidden="true"/>{f}</li>)}</ul>
    {mode==='PRACTICE'?<>
     <div className="arena-practice">
      <section className="arena-create">
       <form onSubmit={e=>{e.preventDefault();action('ROOM_CREATE',{mode:'PRACTICE',...(name.trim()?{name:name.trim()}:{}),capacity,selectedDifficulties:levels});}}>
        <div className="arena-form-row"><label className="arena-form-field">Tên phòng<input maxLength={100} value={name} onChange={e=>N(e.target.value)} placeholder="Đặt tên cho đấu trường"/></label><label className="arena-form-field">Số người<select value={capacity} onChange={e=>C(+e.target.value)}>{[2,3,4,5,6,7,8,9,10].map(n=><option key={n}>{n}</option>)}</select></label></div>
        <fieldset disabled={busy||occupied}><legend>Độ khó đề bài</legend><div className="arena-levels">{[1,2,3,4,5,6].map(d=><label className="arena-level" key={d}><input type="checkbox" aria-label={'Mức '+d} checked={levels.includes(d)} onChange={e=>L(e.target.checked?[...levels,d]:levels.filter(x=>x!==d))}/><span>{d}</span></label>)}</div></fieldset>
        <div className="arena-launch-footer"><small><i className="fa-solid fa-shield-halved" aria-hidden="true"/> Luyện tập tự do · Không tính EXP / điểm Rank</small><button className="arena-game-button" disabled={busy||occupied||user.role!=='CODER'||!levels.length}><i className="fa-solid fa-plus" aria-hidden="true"/>Tạo phòng<i className="fa-solid fa-arrow-right" aria-hidden="true"/></button></div>
       </form>
      </section>
      <section className="arena-join"><span className="arena-small-icon"><i className="fa-solid fa-ticket" aria-hidden="true"/></span><span className="eyebrow">PARTY INVITE</span><h3>Đã có đồng đội?</h3><p>Nhập mã mời và bước vào phòng cùng bạn bè.</p><form onSubmit={e=>{e.preventDefault();action('ROOM_JOIN',{roomId:code.trim()});}}><label>Mã phòng<input value={code} maxLength={36} required placeholder="Nhập mã mời" autoComplete="off" onChange={e=>S(e.target.value.toUpperCase())}/></label><button className="secondary" disabled={busy||occupied}>Tham gia phòng<i className="fa-solid fa-arrow-right" aria-hidden="true"/></button></form></section>
     </div>

    </>:<MatchmakingPanel mode={mode} queue={queue} waiting={waiting} found={found} waited={waited} busy={busy} user={user} action={action}/>}
   </section>
  </div>
  {mode==='PRACTICE'&&<section className="arena-room-browser" aria-label="Phòng giao lưu"><div className="arena-section-heading"><div><i className="fa-solid fa-door-open" aria-hidden="true"/><h2>Phòng đang mở</h2></div><Badge>{rooms?.length??'—'} phòng</Badge></div>
      {!rooms?<Loading/>:<div className="room-grid">{rooms.map(r=><button key={r.id} className="room-card" disabled={busy||occupied} onClick={()=>action('ROOM_JOIN',{roomId:r.id})}><div className="inline between"><Badge>{r.state}</Badge><span className="arena-room-capacity"><i className="fa-solid fa-users" aria-hidden="true"/> {r.count}/{r.capacity}</span></div><h3 data-user-content>{r.name}</h3><p data-user-content>{r.hostName} · Mã {r.code}</p><span className="room-enter">Tham gia / xem <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"/></span></button>)}{!rooms.length&&<div className="arena-box arena-empty"><span className="arena-small-icon"><i className="fa-solid fa-door-open" aria-hidden="true"/></span><div><h3>Phòng đầu tiên đang chờ bạn</h3><p>Tạo phòng ở trên và gửi mã mời cho đồng đội.</p></div></div>}</div>}
     </section>}
  <details className="arena-howto"><summary><span className="arena-small-icon"><i className="fa-solid fa-book-open" aria-hidden="true"/></span><span>Luật chơi nhanh</span><i className="fa-solid fa-chevron-down" aria-hidden="true"/></summary><div className="arena-howto-content"><h3>Luật đơn giản. Thử thách thật.</h3><ol><li><span>01</span><div><b>Giải đúng</b><small>Chinh phục đề trong thời gian vòng đấu.</small></div></li><li><span>02</span><div><b>Vượt vòng</b><small>AC nhanh để tranh suất đi tiếp.</small></div></li><li><span>03</span><div><b>Trụ lại</b><small>Hướng tới vị trí Coder cuối cùng.</small></div></li></ol></div></details>
  <div className="arena-results-grid">
  <section className="arena-box arena-match-history"><div className="arena-section-heading"><div><span className="arena-small-icon"><i className="fa-solid fa-clock-rotate-left" aria-hidden="true"/></span><h2>Lịch sử chiến đấu</h2></div><span>Thành tích qua từng trận</span></div>{!history?<Loading/>:history.length?<div className="table-wrap"><table><thead><tr><th>Chế độ</th><th>Thứ hạng</th><th>EXP nhận được</th><th>Điểm Rank</th><th>Trận đấu</th></tr></thead><tbody>{history.map(h=><tr key={h.room_id}><td><Badge>{MODES.find(item=>item.id===h.mode)?.name||h.mode}</Badge></td><td><span className={'arena-history-rank '+(h.placement===1?'winner':'')}>{h.placement===1&&<i className="fa-solid fa-trophy" aria-hidden="true"/>} #{h.placement}</span></td><td><span className="arena-history-exp">+{h.exp} EXP</span></td><td>{h.mode==='RANKED'?`${h.rating_before} → ${h.rating_after}`:'—'}</td><td><a href={'#/room/'+h.room_id}>Xem trận <i className="fa-solid fa-arrow-right" aria-hidden="true"/></a></td></tr>)}</tbody></table></div>:<div className="arena-history-empty"><i className="fa-solid fa-flag-checkered" aria-hidden="true"/><div><h3>Mỗi trận đấu là một bước tiến</h3><p>Kết quả, EXP và thay đổi điểm Rank sẽ xuất hiện tại đây sau khi trận kết thúc.</p></div></div>}</section>
    <section className="arena-box arena-leaderboard"><div className="arena-sidebar-heading"><span><i className="fa-solid fa-trophy" aria-hidden="true"/> TOP RANKED</span><a href="#/leaderboard?metric=rank" aria-label="Xem bảng xếp hạng"><i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"/></a></div>{!leaders?<Loading/>:leaders.length?<ol className="arena-leaders">{leaders.slice(0,5).map((p,i)=><li key={p.user_id}><span className={'arena-place place-'+(i+1)}>{String(i+1).padStart(2,'0')}</span><RankEmblem rank={p.rank} className="rank-emblem-small" decorative/><div><b data-user-content>{p.display_name}</b><small>{p.rank} · Level {p.level}</small></div><strong>{p.rating}<small>RANK</small></strong></li>)}</ol>:<p className="arena-sidebar-empty">Chưa có trận Ranked được chốt. Đấu trường đang chờ những cái tên đầu tiên.</p>}</section>
  </div>
 </div>;
}
