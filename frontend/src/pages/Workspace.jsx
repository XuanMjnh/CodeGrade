import {submissionInsights} from '../lib/insights';
import {t as trUI} from "../lib/locale";
import CodeEditor from '../components/CodeEditor';
import SubmissionHistory from '../components/SubmissionHistory';
import ProblemRanking from '../components/ProblemRanking';
import {Discussion} from './Community';
import React,{useEffect,useState,useRef} from 'react';
import {live} from '../lib/live';
import {competitionScope} from '../lib/competition';
import {languageNames} from '../lib/coderunner';
import {Heading,Badge,ErrorBox,Loading,useResource,go} from '../components/ui';
const cpp='#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    return 0;\n}\n';

export default function Workspace({id,user,revision,problem:provided,room,contestId,onNotice,onSubmissionSelected,readOnly=false}){
 const [q,setQ]=useState(provided||null),[source,setSource]=useState(''),[language,setLanguage]=useState('PY311'),[error,setError]=useState(null),[busy,setBusy]=useState(false),[hydrated,setHydrated]=useState(false);
 const scope=competitionScope(room,contestId,id);
 const operation=useRef(null);
 const practiceKey='cg-code-'+user.id+'-'+id;
 const contestKey=contestId?('cg-code-contest-'+contestId+'-'+user.id+'-'+id):null;
 const draftKey=contestKey||(room?'cg-code-'+scope+'-'+user.id:practiceKey);
 const hydratedKey=useRef(draftKey);
 const [mine,mineError]=useResource('SUBMISSIONS',{},revision);
 useEffect(()=>{
  let active=true;setHydrated(false);setBusy(false);hydratedKey.current=null;operation.current=null;if(scope)setSource('');
  (async()=>{
   try{
    const p=provided||await live.call('QUESTION_GET',{id});
    const drafts=scope?[]:await live.call('DRAFT_GET',{problemId:id});
    const local=draftKey?JSON.parse(localStorage.getItem(draftKey)||'null'):null,server=drafts[0];
    const savedLanguage=local?.language||server?.language;
    const lang=p.languages.includes(savedLanguage)?savedLanguage:p.languages[0]||'PY311';
    const text=local?.source??server?.source_code??p.preloadAnswer??'';
    if(active){setQ(p);setLanguage(lang);setSource(text||(lang.startsWith('CPP')?cpp:trUI("# Viết lời giải ở đây\n")));hydratedKey.current=draftKey;setHydrated(true);}
   }catch(e){if(active)setError(e);}
  })();
  return()=>{active=false;operation.current=null;};
 },[id,scope,draftKey,practiceKey]);
 useEffect(()=>{
  if(!hydrated||!draftKey||hydratedKey.current!==draftKey)return;localStorage.setItem(draftKey,JSON.stringify({source,language}));
  if(!scope){
   const timer=setTimeout(()=>{live.call('DRAFT_SAVE',{problemId:id,source,language}).catch(()=>{});},1200);
   return()=>clearTimeout(timer);
  }
 },[source,language,hydrated,id,draftKey,scope]);
 async function submit(type,retry=false){
  if(readOnly||busy||!hydrated)return;
  setBusy(true);setError(null);
  if(!retry||!operation.current)operation.current={type,id:crypto.randomUUID(),scope,payload:{problemId:id,source,language,...(room?{roomId:room.id,roundId:room.current.id}:{}),...(contestId?{contestId}:{})}};
  const op=operation.current;
  try{const result=await live.call(op.type,op.payload,op.id);if(operation.current!==op)return;onSubmissionSelected?.(result.id);operation.current=null;setBusy(false);onNotice?.(trUI("Server đã nhận bài lúc ")+new Date(result.receivedAt).toLocaleTimeString((localStorage.getItem('cg-locale')==='en'?'en-US':'vi-VN'))+'.');}
  catch(e){if(operation.current!==op)return;setError(e);if(e.code)operation.current=null;setBusy(false);}
 }
 const attempts=room?(mine||[]).filter(s=>s.round_id===room.current.id&&s.mode==='OFFICIAL'&&s.status!=='SE').length:0;
 const personal=submissionInsights((mine||[]).filter(s=>s.problem_id===id));
 if(!q)return <><ErrorBox error={error}/><Loading/></>;
 return <div className={"workspace-page "+(room?"battle-workspace":"practice-workspace")}>
  {!room&&<Heading eyebrow="PRACTICE / WORKSPACE" kind="workspace" highlight={{label:'Mã bài',value:q.publicId||'—',detail:trUI('Mức')+' '+q.difficulty}} title={q.general.questionName} action={<button className="secondary" onClick={()=>go(contestId?'/contests/'+contestId:'/practice')}>← Quay lại</button>}/>}
  {!room&&<div className="problem-overview"><span className="problem-id">{q.publicId}</span><Badge tone={'level-'+q.difficulty}>{trUI('Mức')} {q.difficulty}</Badge><span>{q.examples?.length||0} {trUI('ví dụ công khai')}</span><span>{q.languages.map(l=>languageNames[l]).join(' · ')}</span><span>{trUI('Điểm cao nhất gần đây')}: {personal.best??'—'}</span></div>}
  <ErrorBox error={error||mineError}/>
  {room&&readOnly&&<p className="alert">{trUI('Mã nguồn được giữ lại để xem và sao chép. Hiện không thể nộp bài ở vòng này.')}</p>}
  <div className="workspace">
   <section className="statement paper"><div className="panel-title"><h2>{q.general.questionName}</h2><Badge tone={'level-'+q.difficulty}>Mức {q.difficulty}</Badge></div><pre className="statement-text">{q.general.questionText}</pre><h3>Ví dụ công khai</h3>{q.examples?.map((t,i)=><div className="example" key={i}>{t.testcode&&<><small>TEST CODE</small><pre>{t.testcode}</pre></>}<small>INPUT</small><pre>{t.stdin||trUI("(rỗng)")}</pre><small>EXPECTED OUTPUT</small><pre>{t.expected||trUI("(rỗng)")}</pre></div>)}{!q.examples?.length&&<p className="muted">Đề chưa có ví dụ công khai.</p>}</section>
   <section className="editor-panel paper"><div className="panel-title"><div className="inline"><b>Lời giải của bạn</b>{room&&<Badge>{attempts}/2 lượt</Badge>}</div><select aria-label={trUI("Ngôn ngữ nộp bài")} value={language} disabled={readOnly} onChange={e=>setLanguage(e.target.value)}>{q.languages.map(l=><option key={l} value={l}>{languageNames[l]}</option>)}</select></div><p id="editor-keyboard-hint" className="sr-only">Code editor. Tab moves to the next control. Ctrl+] inserts indentation.</p><div className="editor-meta"><label className="import-code">{trUI("Nhập file mã nguồn")}<input aria-label={trUI("Nhập file mã nguồn")} type="file" disabled={readOnly} accept=".cpp,.cc,.cxx,.py,.txt" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>65536)throw Error(trUI("File tối đa 64 KB."));const text=await f.text();if(text.includes("\0")||text.length>65536)throw Error(trUI("File mã nguồn không hợp lệ."));if(source.trim()&&!confirm(trUI("Thay thế mã đang soạn bằng nội dung file?")))return;const lang=f.name.endsWith(".py")?"PY311":/\.(cpp|cc|cxx)$/i.test(f.name)?q.languages.find(x=>x.startsWith("CPP")):language;if(!q.languages.includes(lang))throw Error(trUI("Ngôn ngữ không được hỗ trợ cho bài này."));setLanguage(lang);setSource(text);}catch(e){setError(e);}finally{e.target.value="";}}}/></label><span>{language==='PY311'?'main.py':'main.cpp'}</span><span>{scope?(contestId?trUI('Tự lưu nháp thi đấu'):'Trận đấu trực tiếp'):trUI('Tự lưu bản nháp')} · {source.length}/65536</span></div><CodeEditor value={source} onChange={setSource} language={language} readOnly={readOnly}/><div className="editor-actions"><span className="muted">{room?trUI("Tối đa 2 bài chính thức; chạy ví dụ không trừ lượt."):user.role==='ADMIN'?trUI("Admin · kết quả không tính bảng xếp hạng"):trUI("Tự động lưu bản nháp")}</span><div className="inline">{(room||q.precheck>0)&&!q.hidecheck&&<button className="secondary" aria-busy={busy} disabled={readOnly||busy||!hydrated} onClick={()=>submit(room?'RUN_EXAMPLES':'PRECHECK')}>{room?trUI("Chạy ví dụ"):'Precheck'}</button>}<button aria-busy={busy} disabled={readOnly||busy||!hydrated||(room&&attempts>=2)} onClick={()=>submit('SUBMIT')}>{busy?trUI("Đang gửi…"):trUI("Nộp bài →")}</button></div></div>{operation.current&&error&&<button className="secondary retry" disabled={readOnly||busy} onClick={()=>submit(operation.current.type,true)}>Gửi lại cùng request ID</button>}</section>
  </div>
 {!room&&<><SubmissionHistory items={mine} problemId={id} revision={revision}/><ProblemRanking problemId={id} userId={user.id} revision={revision}/><Discussion id={id} revision={revision}/></>}
 </div>;
}
