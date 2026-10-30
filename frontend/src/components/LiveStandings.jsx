import React from 'react';
import {t} from '../lib/locale';
import {Badge} from './ui';

const verdicts={NOT_SUBMITTED:'Chưa nộp',QUEUED:'Chờ chấm',RUNNING:'Đang chấm…',SE:'Lỗi hệ thống'};
const playerStates={ALIVE:'Đang thi đấu',SPECTATOR:'Đã bị loại',ELIMINATED:'Đã bị loại',FORFEIT:'Đã bỏ cuộc',LEFT:'Đã rời phòng'};

export default function LiveStandings({room,userId}){
 const current=room.current;
 if(!current)return null;
 const players=new Map(room.players.map(p=>[p.id,p]));
 const rows=room.liveStandings||((current.players||[]).map(userId=>({userId})));
 const competing=new Set(rows.map(p=>p.userId));
 const others=(room.participants||[]).filter(id=>!competing.has(id)).map(userId=>({userId,outsideRound:true}));
 const live=['ROUND_ACTIVE','ROUND_GRADING'].includes(room.state);
 const voided=room.history?.some(h=>h.round?.id===current.id&&h.type);
 const settled=room.history?.some(h=>h.round?.id===current.id&&!h.type);
 return <section className="paper arena-live-standings" aria-labelledby="live-standings-title">
  <div className="arena-section-heading"><h2 id="live-standings-title">{t('Bảng kết quả trực tiếp')}</h2><span className="inline"><span>{t('Vòng')} {current.number}</span><Badge tone={live?'success':''}>{t(voided?'Đã hủy':live?'Trực tiếp':settled?'Đã chốt':'Đã dừng')}</Badge></span></div>
  <p className="muted standings-note">{t(voided?'Vòng đã bị hủy. Kết quả không dùng để loại người chơi.':live?'Kết quả tạm thời, cập nhật khi server nhận và chấm bài.':settled?'Kết quả vòng đấu đã được server xác nhận.':'Vòng đấu đã dừng. Xem trạng thái trận đấu để biết kết quả cuối cùng.')}</p>
  <div className="table-wrap" role="region" aria-label={t('Bảng kết quả trực tiếp')} tabIndex={0}><table>
   <thead><tr><th>{t('Hạng')}</th><th>Coder</th><th>{t('Trạng thái')}</th><th>{t('Kết quả')}</th><th>{t('Lượt nộp')}</th><th>{t('Điểm')}</th><th>{t('Thời gian hiệu lực')}</th></tr></thead>
   <tbody>{[...rows,...others].map(row=>{
    const player=players.get(row.userId);
    const verdict=row.status?(verdicts[row.status]||row.status):'Chờ cập nhật';
    return <tr key={row.userId} className={row.userId===userId?'my-rank':''} aria-current={row.userId===userId?'true':undefined}>
     <td>{!voided&&row.rank!=null?'#'+row.rank:'—'}</td>
     <td><strong data-user-content>{player?.name||row.userId}</strong>{row.userId===userId&&<small className="standings-self">{t('Bạn')}</small>}</td>
     <td>{t(row.outsideRound&&player?.status==='ALIVE'?'Đã chắc suất':playerStates[player?.status]||player?.status||'—')}</td>
     <td>{row.outsideRound?'—':<Badge tone={row.ac?'success':['QUEUED','RUNNING','NOT_SUBMITTED'].includes(row.status)?'':row.status?'danger':''}>{t(verdict)}</Badge>}{row.ac&&row.pending>0&&<small className="standings-pending">{t('Đang chấm…')}</small>}</td>
     <td>{row.attempts!=null?row.attempts+' / 2':'—'}</td>
     <td>{row.rank!=null?row.score:'—'}</td>
     <td>{row.ac&&row.effectiveMs!=null?(row.effectiveMs/1000).toFixed(3)+'s':'—'}</td>
    </tr>;
   })}</tbody>
  </table></div>
 </section>;
}
