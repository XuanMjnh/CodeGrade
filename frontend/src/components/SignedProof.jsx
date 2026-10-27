import React,{useEffect,useState} from 'react';
import {t,locale} from '../lib/locale';
import {languageNames} from '../lib/coderunner';
import {parseProof,certificateStats,verifyProofSignature} from '../lib/proofs';
import {Badge,ErrorBox,Loading,useResource} from './ui';

const verdicts={AC:'Đúng tất cả test',WA:'Sai kết quả',CE:'Lỗi biên dịch',RE:'Lỗi khi chạy',TLE:'Quá thời gian',MLE:'Vượt bộ nhớ',OLE:'Vượt giới hạn đầu ra',SE:'Lỗi hệ thống',QUEUED:'Đang chờ chấm',RUNNING:'Đang chấm'};
const states={ROUND_RESULT:'Đã chốt kết quả vòng',ROUND_GRADING:'Đang chấm bài của vòng',ROUND_ACTIVE:'Vòng đang diễn ra',FINISHED:'Trận đấu đã kết thúc',UNRESOLVED:'Trận kết thúc chưa xác định người thắng',CLOSED:'Phòng đã đóng'};
function Timestamp({value}){return <time dateTime={new Date(value).toISOString()}>{new Date(value).toLocaleString(locale==='en'?'en-US':'vi-VN',{dateStyle:'medium',timeStyle:'medium'})}</time>;}
function download(envelope,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(envelope,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function ReceiptPanel({id}){
 const [attempt,retry]=useState(0),[proof,error]=useResource('RECEIPT_GET',{id},attempt);
 return <div className="receipt-panel">{error?<><ErrorBox error={error}/><button className="ghost" onClick={()=>retry(n=>n+1)}>Tải lại biên nhận</button></>:!proof?<Loading/>:<SignedProof envelope={proof} kind="receipt" expectedId={id}/>}</div>;
}

export default function SignedProof({envelope,kind,expectedId,players=[],rounds=[]}){
 const [verification,setVerification]=useState(null);
 const signature=verification?.payload===envelope.payload&&verification?.signature===envelope.signature&&verification?.publicKey===envelope.publicKey?verification.state:'checking';
 useEffect(()=>{let active=true;verifyProofSignature(envelope).then(state=>{if(active)setVerification({payload:envelope.payload,signature:envelope.signature,publicKey:envelope.publicKey,state});});return()=>{active=false;};},[envelope.payload,envelope.signature,envelope.publicKey]);
 let payload;
 try{payload=parseProof(envelope,kind);if(kind==='receipt'&&expectedId&&payload.submissionId!==expectedId)throw Error('Biên nhận không thuộc bài nộp đang xem.');}catch(error){return <ErrorBox error={error}/>;}
 const certificate=kind==='certificate',stats=certificate?certificateStats(payload):null;
 const round=rounds.find(item=>item?.id===payload.roundId),title=certificate?'Chứng thư vòng đấu':'Biên nhận nộp bài';
 const signatureLabel={checking:'Đang kiểm tra chữ ký…',valid:'Chữ ký khớp',invalid:'Chữ ký không khớp',unavailable:'Chưa kiểm tra chữ ký'}[signature];
 const tone=signature==='valid'?'success':signature==='invalid'?'danger':'';
 return <section className={'signed-proof '+(certificate?'round-certificate':'submission-receipt')} aria-label={t(title)}>
  <header className="proof-heading"><div><span className="proof-eyebrow">{certificate?'BẢN TỔNG KẾT VÒNG ĐẤU':'XÁC NHẬN TIẾP NHẬN'}</span><h3>{t(title)}{certificate&&round?.number?' · '+t('Vòng ')+round.number:''}</h3></div><span role="status" aria-live="polite"><Badge tone={tone}>{t(signatureLabel)}</Badge></span></header>
  <p className="proof-intro">{certificate?'Danh sách bài nộp chính thức được ghi lại khi chốt vòng, để mọi người đối chiếu thời điểm nhận và kết quả.':'Hệ thống đã ghi nhận bài nộp của bạn. Biên nhận lưu thời điểm tiếp nhận; kết quả đúng hay sai được hiển thị riêng ở phần chấm bài.'}</p>
  {signature==='invalid'&&<p className="alert danger" role="alert">Không xác nhận được chữ ký. Không dùng bằng chứng này để kết luận dữ liệu là chính xác.</p>}
  {certificate?<>
   <dl className="proof-stats"><div><dt>Bài nộp chính thức</dt><dd>{stats.submissions}</dd></div><div><dt>Người đã nộp</dt><dd>{stats.players}</dd></div><div><dt>Bài được AC</dt><dd>{stats.accepted}</dd></div><div><dt>Nhận trong hạn</dt><dd>{stats.onTime}/{stats.submissions}</dd></div></dl>
   <dl className="proof-facts"><div><dt>Hạn nhận bài</dt><dd><Timestamp value={payload.deadline}/></dd></div><div><dt>Trạng thái khi lập chứng thư</dt><dd>{t(states[payload.state]||payload.state||'Chưa có dữ liệu.')}</dd></div></dl>
   <p className="proof-scroll-hint muted">Cuộn ngang để xem đầy đủ bảng.</p>
   <div className="table-wrap" role="region" aria-label={t('Bài nộp trong chứng thư')} tabIndex={0}><table><thead><tr><th>Thứ tự nhận</th><th>Người nộp</th><th>Thời điểm nhận</th><th>Đối chiếu hạn nộp</th><th>Kết quả</th><th>Điểm</th></tr></thead><tbody>{payload.admitted.map((row,index)=><tr key={row.id}><td>{row.admission_order??index+1}</td><td><span data-user-content>{players.find(player=>player.id===row.user_id)?.name||row.user_id}</span></td><td><Timestamp value={row.received_at}/></td><td><Badge tone={row.received_at<=payload.deadline?'success':'danger'}>{t(row.received_at<=payload.deadline?'Trong hạn':'Sau hạn')}</Badge></td><td><span className="proof-verdict"><Badge tone={row.status==='AC'?'success':row.status==='QUEUED'||row.status==='RUNNING'?'':'danger'}>{row.status}</Badge><span>{t(verdicts[row.status]||row.status)}</span></span></td><td>{row.score}/100</td></tr>)}</tbody></table>{!payload.admitted.length&&<p className="muted">Vòng này không có bài nộp chính thức được ghi nhận.</p>}</div>
  </>:<dl className="proof-facts"><div><dt>Đã nhận bài lúc</dt><dd><Timestamp value={payload.receivedAt}/></dd></div><div><dt>Thứ tự tiếp nhận</dt><dd>#{payload.admissionOrder}</dd></div><div><dt>Ngôn ngữ</dt><dd>{languageNames[payload.language]||payload.language||'—'}</dd></div><div><dt>Phạm vi</dt><dd>{t(payload.roundId?'Bài nộp trong vòng Survival':'Bài nộp ngoài vòng Survival')}</dd></div><div className="proof-wide"><dt>Mã bài nộp</dt><dd className="proof-id">{payload.submissionId}</dd></div></dl>}
  <footer className="proof-footer"><p className="muted">{signature==='valid'?'Chữ ký khớp với khóa đi kèm. Để xác nhận bên phát hành, cần đối chiếu khóa với ban tổ chức.':signature==='unavailable'?'Trình duyệt chưa hỗ trợ kiểm tra chữ ký tại đây. Bạn có thể tải dữ liệu để đối chiếu.':'Bản tải xuống giữ nguyên dữ liệu và chữ ký để đối chiếu.'}</p><button className="secondary" onClick={()=>download(envelope,(certificate?'certificate-':'receipt-')+(certificate?payload.roundId:payload.submissionId)+'.json')}>Tải bản có chữ ký</button></footer>
  <details className="proof-technical"><summary>Thông tin kỹ thuật để đối chiếu</summary><dl><div><dt>Mã vòng</dt><dd className="proof-id">{payload.roundId||'—'}</dd></div>{!certificate&&<div><dt>Dấu vân tay mã nguồn (SHA-256)</dt><dd className="proof-id">{payload.sourceHash||'—'}</dd></div>}<div><dt>Khóa công khai</dt><dd className="proof-id">{envelope.publicKey}</dd></div><div><dt>Chữ ký Ed25519</dt><dd className="proof-id">{envelope.signature}</dd></div></dl><pre>{JSON.stringify(payload,null,2)}</pre></details>
 </section>;
}
