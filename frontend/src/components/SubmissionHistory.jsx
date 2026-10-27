import React,{useState} from 'react';
import {t} from '../lib/locale';
import {languageNames} from '../lib/coderunner';
import Result from './SubmissionResult';
import SubmissionStatus from './SubmissionStatus';
export default function SubmissionHistory({items,problemId,roomId,rounds=[],revision,selectedId,onSelect}){
 const [selected,S]=useState(null),[page,P]=useState(1);
 const choose=onSelect||S,current=selectedId===undefined?selected:selectedId;
 const rows=(items||[]).filter(s=>roomId?s.room_id===roomId:s.problem_id===problemId).sort((a,b)=>b.received_at-a.received_at);
 const pages=Math.max(1,Math.ceil(rows.length/10)),visiblePage=Math.min(page,pages);
 return <section className="paper pad submission-history" data-pagination="manual"><h2>{t('Lịch sử chấm bài')}</h2>
  {!rows.length?<p className="muted">{t('Chưa có bài nộp.')}</p>:<>
   <div className="table-wrap" tabIndex={0} role="region" aria-label={t('Lịch sử chấm bài')}><table><thead><tr>
    <th>{t('Thời gian')}</th>{roomId&&<th>{t('Vòng')}</th>}<th>{t('Ngôn ngữ')}</th><th>{t('Chế độ')}</th><th>{t('Kết quả')}</th><th>{t('Điểm')}</th>
   </tr></thead><tbody>{rows.slice((visiblePage-1)*10,visiblePage*10).map(s=><tr key={s.id}>
    <td><button className="link" onClick={()=>choose(s.id)}>{new Date(s.received_at).toLocaleString(document.documentElement.lang==='en'?'en-US':'vi-VN')}</button></td>
    {roomId&&<td>{rounds.find(r=>r?.id===s.round_id)?.number||'—'}</td>}<td>{languageNames[s.language]}</td><td>{t(s.mode==='EXAMPLES'?'RUN_EXAMPLES':s.mode)}</td><td><SubmissionStatus submission={s}/></td><td>{s.score}</td>
   </tr>)}</tbody></table></div>
   <div className="inline"><button className="ghost" disabled={visiblePage<=1} onClick={()=>P(visiblePage-1)}>{t('Trang trước')}</button><span>{visiblePage} / {pages}</span><button className="ghost" disabled={visiblePage>=pages} onClick={()=>P(visiblePage+1)}>{t('Trang sau')}</button></div>
  </>}
  {current&&<><button className="ghost" onClick={()=>choose(null)}>{t('Đóng')}</button><Result id={current} revision={revision}/></>}
 </section>;
}
