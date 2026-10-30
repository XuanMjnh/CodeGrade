import React,{useState} from 'react';
import {t as trUI} from '../lib/locale';
import {Heading,ErrorBox,Loading,useResource} from '../components/ui';
import {StatGrid} from '../components/Insights';
import RankEmblem from '../components/RankEmblem';

const METRICS=[
 {id:'elo',field:'elo',label:'Elo Contest',icon:'fa-flag-checkered',columns:['elo','ac'],note:'Elo chỉ thay đổi từ kết quả Contest có tính điểm.'},
 {id:'ac',field:'ac',label:'Số bài AC',icon:'fa-code',columns:['ac','exp','rank'],note:'Xếp hạng theo tổng số bài đã giải AC.'},
 {id:'exp',field:'exp',label:'EXP',icon:'fa-star',columns:['exp','rank','normal_games','ranked_games'],note:'EXP tích lũy từ các hoạt động được hệ thống ghi nhận.'},
 {id:'rank',field:'rank',label:'Mức Rank',icon:'fa-shield-halved',columns:['rank','rating','exp','ranked_games'],note:'Xếp theo điểm Rank Survival, từ cao xuống thấp. Điểm Rank độc lập với Elo Contest.'},
 {id:'normal_games',field:'normal_games',label:'Số trận thường',icon:'fa-bolt',columns:['normal_games','exp','rank'],note:'Chỉ đếm trận đấu thường đã kết thúc có kết quả chính thức; không tính phòng giao lưu hoặc trận bị hủy.'},
 {id:'ranked_games',field:'ranked_games',label:'Số trận Rank',icon:'fa-trophy',columns:['ranked_games','rank','rating','exp'],note:'Chỉ đếm trận Rank đã kết thúc có kết quả chính thức; không tính trận bị hủy.'}
];
const LABELS={elo:'Elo Contest',ac:'Bài AC',exp:'EXP',rank:'Mức Rank',rating:'Điểm Rank',normal_games:'Trận thường',ranked_games:'Trận Rank'};
function BoardValue({coder,field}){
 if(field==='rank')return <span className="rank-inline"><RankEmblem rank={coder.rank} className="rank-emblem-small" decorative/><span>{trUI(coder.rank)}</span></span>;
 return Number(coder[field]??0).toLocaleString(document.documentElement.lang==='en'?'en-US':'vi-VN');
}

export default function Leaderboard({revision,user}){
 const [metric,setMetric]=useState(()=>{
  const requested=new URLSearchParams(location.hash.split('?')[1]||'').get('metric');
  return METRICS.some(item=>item.id===requested)?requested:'elo';
 });
 // A new view clears the previous metric's rows while the new ranking loads.
 return <LeaderboardView key={metric} metric={metric} setMetric={setMetric} revision={revision} user={user}/>;
}

function LeaderboardView({metric,setMetric,revision,user}){
 const config=METRICS.find(item=>item.id===metric);
 const [data,error]=useResource('LEADERBOARD',{metric},revision);
 const mine=data?.findIndex(coder=>coder.id===user?.id)??-1;
 const own=mine>=0?data[mine]:null;
 return <>
  <Heading kind="leaderboard" title={trUI('Những người dẫn đầu')} highlight={{label:'Dẫn đầu hiện tại',value:data?.[0]?.display_name||'—',userContent:true,detail:config.label}}>Elo Contest, bài AC và thành tích Survival được xếp hạng theo từng tiêu chí riêng.</Heading>
  <StatGrid label="Tổng quan xếp hạng" items={[
   {label:'Coder trong top 200',value:data?.length},
   {label:'Vị trí của bạn',value:user?.role!=='CODER'?trUI('Không xếp hạng'):data?mine>=0?'#'+(mine+1):trUI('Ngoài top 200'):null},
   {label:'Thành tích của bạn',value:own?<BoardValue coder={own} field={config.field}/>:null,note:config.label}
  ]}/>
  <div className="tabs leaderboard-tabs" aria-label={trUI('Tiêu chí xếp hạng')}>{METRICS.map(item=><button key={item.id} className={metric===item.id?'active':''} aria-pressed={metric===item.id} onClick={()=>setMetric(item.id)}><i className={'fa-solid '+item.icon} aria-hidden="true"/>{trUI(item.label)}</button>)}</div>
  <p className="scope-note leaderboard-scope">{trUI(config.note)}</p><ErrorBox error={error}/>
  {data?.length>0&&<section className="podium" aria-label={trUI('Ba vị trí dẫn đầu')}>{data.slice(0,3).map((coder,index)=><article key={coder.id} className={'podium-card place-'+(index+1)}><span className="podium-place">{index===0?<><i className="fa-solid fa-trophy" aria-hidden="true"/><span className="sr-only">1</span></>:'#'+(index+1)}</span><span className="avatar" aria-hidden="true">{coder.display_name.slice(0,1)}</span><h2 data-user-content>{coder.display_name}</h2><small data-user-content>@{coder.username}</small><strong><BoardValue coder={coder} field={config.field}/><small>{trUI(config.label)}</small></strong></article>)}</section>}
  <div className="subheading"><h2>{trUI('Bảng xếp hạng')} · {trUI(config.label)}</h2><small>Chỉ tài khoản Coder đang hoạt động được tính hạng.</small></div>
  {!data?!error&&<Loading/>:<div className="paper table-wrap" role="region" aria-label={trUI('Bảng dữ liệu')} tabIndex={0}><table><thead><tr><th>Hạng</th><th>Coder</th>{config.columns.map(field=><th key={field}>{trUI(LABELS[field])}</th>)}</tr></thead><tbody>{data.map((coder,index)=><tr key={coder.id} className={(index<3?'top-rank ':'')+(coder.id===user?.id?'my-rank':'')}><td><span className="rank-number">{index===0?<><i className="fa-solid fa-trophy" aria-hidden="true"/><span className="sr-only">1</span></>:index+1}</span></td><td><b data-user-content>{coder.display_name}</b><small data-user-content>@{coder.username}</small></td>{config.columns.map(field=><td key={field}><BoardValue coder={coder} field={field}/></td>)}</tr>)}</tbody></table>{!data.length&&<div className="empty">Chưa có Coder.</div>}</div>}
 </>;
}
