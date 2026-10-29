import CodeEditor from '../components/CodeEditor';
import {t as trUI} from "../lib/locale";
import React,{useEffect,useState,useRef} from 'react';
import {live} from '../lib/live';
import {defaults,normalize,validate,serialized,displayNames,languageNames} from '../lib/coderunner';
import {Field,Section,Check,ErrorBox,Loading,go} from '../components/ui';

function at(obj,path){return path.split('.').reduce((v,k)=>v?.[k],obj);}
export default function QuestionEditor({id,revision,onNotice}){
 const [q,setQ]=useState(()=>defaults()),[categories,setCategories]=useState([]),[types,setTypes]=useState([]),[errors,setErrors]=useState([]),[error,setError]=useState(null),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
 const [step,setStep]=useState(0),[preview,setPreview]=useState(false),[loading,setLoading]=useState(!!id),[loadFailed,setLoadFailed]=useState(false),[draftError,setDraftError]=useState(null);
 const leaveAllowed=useRef(false),metadataRevision=useRef(revision);
 const draftKey='cg-question-draft-'+(id||'new');
 useEffect(()=>{
  live.call('CATEGORIES').then(setCategories).catch(setError);
  fetch('/api/meta').then(r=>r.json()).then(m=>setTypes(m.questionTypes||[])).catch(setError);
  if(id){setLoading(true);setLoadFailed(false);live.call('QUESTION_EDIT',{id}).then(d=>{setQ(normalize(d));setDirty(false);}).catch(e=>{setError(e);setLoadFailed(true);}).finally(()=>setLoading(false));}
  else{setQ(defaults());setDirty(false);}
 },[id]);
 // A validation event may update metadata, but must never replace in-progress edits.
 useEffect(()=>{if(metadataRevision.current===revision)return;metadataRevision.current=revision;if(!id)return;let active=true;live.call('QUESTION_EDIT',{id}).then(server=>{if(active)setQ(current=>current.id===server.id&&current.version===server.version?{...current,validatedVersion:server.validatedVersion}:current);}).catch(e=>{if(active)setError(e);});return()=>{active=false;};},[id,revision]);
 useEffect(()=>{if(dirty)try{localStorage.setItem(draftKey,JSON.stringify(q));setDraftError(null);}catch{setDraftError(Error(trUI('Không thể lưu nháp trên thiết bị. Hãy lưu lên server hoặc Export JSON để giữ thay đổi.')));}},[q,dirty,draftKey]);
 useEffect(()=>{const f=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',f);return()=>window.removeEventListener('beforeunload',f);},[dirty]);
 useEffect(()=>{const guard=e=>{if(!leaveAllowed.current&&(busy||dirty&&!window.confirm(trUI('Rời trình soạn đề khi còn thay đổi chưa lưu?'))))e.preventDefault();leaveAllowed.current=false;};window.addEventListener('codegrade:before-navigate',guard);return()=>window.removeEventListener('codegrade:before-navigate',guard);},[dirty,busy]);
 function cancel(){if(!dirty||window.confirm(trUI('Bỏ các thay đổi chưa lưu?'))){leaveAllowed.current=true;go('/practice');}}
 function readDraft(){try{return localStorage.getItem(draftKey);}catch{return null;}}
 function changeStep(next){setStep(next);requestAnimationFrame(()=>{document.querySelector('.studio-panel-heading')?.scrollIntoView({block:'start'});document.getElementById('studio-tab-'+next)?.focus({preventScroll:true});});}
 function update(path,value){setQ(prev=>{const next=structuredClone(prev),parts=path.split('.'),last=parts.pop();let obj=next;for(const k of parts)obj=obj[k];obj[last]=value;return next;});setDirty(true);}
 const input=(path,type='text',props={})=><input aria-label={path} type={type} value={at(q,path)??''} onChange={e=>update(path,type==='number'?(e.target.value===''?null:Number(e.target.value)):e.target.value)} {...props}/>;
 const area=(path,rows=4)=><textarea className={/answer|testcases|template|globalextra/i.test(path)?"code-input":undefined} aria-label={path} spellCheck={false} rows={rows} value={at(q,path)??''} onChange={e=>update(path,e.target.value)}/>;
 const check=(path,label,disabled=false)=><Check label={label} checked={at(q,path)} onChange={v=>update(path,v)} disabled={disabled}/>;
 const select=(path,options,disabled=false)=><select aria-label={path} value={at(q,path)??''} disabled={disabled} onChange={e=>update(path,typeof at(q,path)==='number'?Number(e.target.value):e.target.value)}>{options.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select>;
 const field=(label,path,type='text',help=label,props={})=><Field label={label} help={help}>{input(path,type,props)}</Field>;
 async function save(stay){
  setError(null);const errs=validate(q);setErrors(errs);if(errs.length){requestAnimationFrame(()=>{const alert=document.querySelector('.editor-errors');alert?.focus();alert?.scrollIntoView({block:'start'});});return;}
  setBusy(true);
  try{const result=await live.call('QUESTION_SAVE',serialized(q));setQ(normalize(result));setDirty(false);try{localStorage.removeItem(draftKey);}catch{/* The server save succeeded even if device storage is unavailable. */}
   onNotice(result.sampleValidation?trUI("Đã lưu. Đáp án mẫu được đưa vào queue; xem kết quả ở Bài nộp."):result.validationNotice||trUI("Đã lưu câu hỏi."));
   setDraftError(null);const destination=stay?'/edit/'+result.id:'/practice';leaveAllowed.current=location.hash!=='#'+destination;go(destination);
  }catch(e){setError(e);}finally{setBusy(false);}
 }
 function exportJson(){const blob=new Blob([JSON.stringify(serialized(q),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='coderunner-question.json';a.click();URL.revokeObjectURL(a.href);}
 async function importJson(e){
  try{const f=e.target.files?.[0];if(!f)return;if(f.size>900000)throw Error(trUI("JSON tối đa 900 KiB."));const incoming=normalize(JSON.parse(await f.text()));const errs=validate(incoming);if(errs.length)throw Error(errs.join('\n'));
   if(dirty&&!window.confirm(trUI("Thay dữ liệu đang sửa bằng JSON này?")))return;
   // Import creates a copy unless editing the same server identity.
   if(incoming.id!==id){delete incoming.id;delete incoming.publicId;delete incoming.version;delete incoming.validatedVersion;}
   setQ(incoming);setDirty(true);setErrors([]);setError(null);
  }catch(err){setError(err);}finally{e.target.value='';}
 }
 const selectedHelp=types.find(t=>t.id===q.coderunnertype)?.description||trUI("Chưa chọn loại câu hỏi.");
 const issues=validate(q),exampleCount=q.testcases.filter(t=>t.useasexample).length;
 const verified=Boolean(q.version&&q.validatedVersion===q.version&&!dirty);
 const steps=[['Thông tin','Tên, nội dung & ngôn ngữ','fa-file-lines'],['Cấu hình chấm','Loại câu hỏi & cách tính điểm','fa-sliders'],['Đáp án mẫu','Lời giải tham chiếu & preload','fa-code'],['Bộ kiểm thử','Input, output & thuộc tính','fa-vials'],['Nâng cao & xuất bản','Sandbox, tệp đính kèm & tags','fa-rocket']];
 if(loading)return <Loading/>;
 return <div className="question-editor studio">
  <header className="studio-header"><div><span className="eyebrow">QUESTION STUDIO <span aria-hidden="true">/</span> {id?'EDIT':'NEW'}</span><h1>{q.general.questionName||'Tạo câu hỏi mới'}</h1><div className="inline"><span className="badge">{q.publicId||'Chưa cấp mã'}</span><span className="badge">{q.general.status==='ready'?'Ready':'Draft'}</span><small>{q.id?'Version '+q.version:'Chưa lưu lên server'} · {dirty?'Có thay đổi chưa lưu':'Không có thay đổi'}</small></div></div><div className="studio-tools"><label className="button secondary">Import JSON<input type="file" accept=".json,application/json" hidden disabled={busy||loadFailed} onChange={importJson}/></label><button className="secondary" disabled={busy||loadFailed} onClick={exportJson}>Export JSON</button><button className="ghost" disabled={busy} onClick={cancel}>Đóng</button></div></header>
  <ErrorBox error={error||draftError}/>{errors.length>0&&<div role="alert" tabIndex={-1} className="alert danger editor-errors"><strong>Cần sửa trước khi lưu</strong><ul>{errors.map((e,i)=><li key={i}>{e}</li>)}</ul></div>}
  <div className="studio-layout">
   <nav className="studio-nav" aria-label="Các bước soạn đề"><span className="eyebrow">NỘI DUNG ĐỀ</span><div role="tablist" aria-label="Các bước soạn đề">{steps.map(([title,note,icon],i)=><button type="button" role="tab" id={'studio-tab-'+i} aria-controls={'studio-panel-'+i} aria-selected={step===i} tabIndex={step===i?0:-1} key={title} onClick={()=>changeStep(i)} onKeyDown={e=>{const n=['ArrowDown','ArrowRight'].includes(e.key)?(i+1)%5:['ArrowUp','ArrowLeft'].includes(e.key)?(i+4)%5:e.key==='Home'?0:e.key==='End'?4:null;if(n!==null){e.preventDefault();changeStep(n);}}}><span className="studio-step-number">{i+1}</span><span><b>{title}</b><small>{note}</small></span><i className={'fa-solid '+icon} aria-hidden="true"/></button>)}</div><p className="studio-nav-note">Đề công bố cần đúng 5 testcase hợp lệ. Mỗi cấu hình được giữ nguyên khi chuyển bước.</p></nav>
   <div className="studio-content"><div className="studio-panel-heading"><div><span className="eyebrow">BƯỚC {step+1} / 5</span><h2>{steps[step][0]}</h2><p>{steps[step][1]}</p></div><button className="secondary" aria-pressed={preview} onClick={()=>setPreview(!preview)}>Xem nội dung đề</button></div>{preview&&<section className="paper pad studio-preview"><h3 data-user-content>{q.general.questionName||'Chưa có tên đề'}</h3><pre data-user-content>{q.general.questionText||'Chưa có nội dung đề.'}</pre><small>Bản xem trước nội dung; bộ chấm sử dụng cấu hình đã lưu trên server.</small></section>}<fieldset disabled={busy||loadFailed} className="studio-fields">
    <section role="tabpanel" tabIndex={0} id="studio-panel-0" aria-labelledby="studio-tab-0" hidden={step!==0}>
   <Section title="General" open>
    <Field label="Category">{select('general.categoryId',categories.map(c=>[c.id,c.name]))}</Field>
    {field('Question name','general.questionName')}{<Field label="Question text">{area('general.questionText',8)}</Field>}
    <Field label="General feedback">{area('general.generalFeedback')}</Field>
    {field(trUI('Mã tham chiếu ngoài'),'general.idNumber')}
    <Field label="Difficulty">{select('difficulty',[1,2,3,4,5,6].map(d=>[d,trUI("Mức ")+d]))}</Field>
    <Field label="Languages"><div className="inline">{Object.entries(languageNames).map(([k,n])=><Check key={k} label={n} checked={q.languages.includes(k)} onChange={yes=>update('languages',yes?[...q.languages,k]:q.languages.filter(l=>l!==k))}/>)}</div></Field>
   </Section>
    </section>
    <section role="tabpanel" tabIndex={0} id="studio-panel-1" aria-labelledby="studio-tab-1" hidden={step!==1}>
   <Section title="CodeRunner question type" open>
    {field('Default mark','general.defaultMark','number',trUI("Tổng điểm câu hỏi, khác trọng số Mark của từng test."),{min:0.01,step:'any'})}
    <Field label="Question type">{select('coderunnertype',[['Undefined','Undefined'],...types.map(t=>[t.id,t.id])])}</Field>
    <Field label="Customisation"><div className="inline">{check('customise','Customise')}{check('showsource','Template debugging')}</div></Field>
    {field('Answer box — Rows','answerboxlines','number',trUI("Số dòng ô trả lời của coder, không phải số dòng testcase."),{min:1,max:200})}
    <Field label="Submit buttons"><div className="inline">{select('precheck',[[0,'Disabled'],[1,'Empty'],[2,'Examples'],[3,'Selected'],[4,'All']])}{check('hidecheck','Hide check')}</div></Field>
    <Field label="Stop button">{select('giveupallowed',[[0,'Never available'],[1,'After maximum marks'],[2,'Always available']])}<small className="muted">Chỉ khả dụng với bản nháp.</small></Field>
    <Field label="Feedback">{select('displayfeedback',[[0,'Use quiz settings'],[1,'Force show'],[2,'Force hide']])}</Field>
    <Field label="Marking">{check('allornothing','All-or-nothing grading')}</Field>
    {field('Penalty regime','penaltyregime','text',trUI("Lưu penalty Moodle; Code Survival dùng cố định 10 giây/lần sai."))}
   </Section>
   <Section title="Question type details"><p>{selectedHelp}</p><p>EqualityGrader so sánh chính xác, chỉ chuẩn hóa CRLF → LF. NearEqualityGrader dùng sai số tương đối 10⁻⁶. RegexGrader dùng RE2.</p></Section>
   {q.customise&&<>
    <Section title="Customisation" open>
     <div className="alert">Chỉ khả dụng với bản nháp.</div>
     <Field label="Template">{area('customisation.template',8)}</Field>
     <Field label="Combinator">{check('customisation.iscombinatortemplate','Is combinator template')}{check('customisation.allowmultiplestdins','Allow multiple stdins')}</Field>
     <Field label="Test splitter regex">{input('customisation.testsplitterre','text',{disabled:!q.customisation.iscombinatortemplate})}</Field>
     <Field label="Grader">{select('customisation.grader',['EqualityGrader','NearEqualityGrader','RegexGrader','TemplateGrader'].map(v=>[v,v]))}</Field>
     <Field label="Result columns">{area('customisation.resultcolumns')}</Field>
     <Field label="UI plugin">{select('customisation.uiplugin',[['textarea','Textarea'],['ace','Ace (metadata)']])}{check('customisation.useace','Use Ace (metadata)')}</Field>
     <Field label="Prototype extra">{area('customisation.prototypeextra')}</Field>
    </Section>
   </>}
    </section>
    <section role="tabpanel" tabIndex={0} id="studio-panel-2" aria-labelledby="studio-tab-2" hidden={step!==2}>
   <Section title="Answer" open>
    <Field label="Sample answer"><CodeEditor label="answer.sampleAnswer" readOnly={busy||loadFailed} value={q.answer.sampleAnswer} language={q.answer.language} height="380px" onChange={value=>update('answer.sampleAnswer',value)}/></Field>
    <Field label="Sample answer language">{select('answer.language',q.languages.map(l=>[l,languageNames[l]]))}</Field>
    <Field label="Validate on Save">{check('answer.validateOnSave','Validate sample answer on save')}</Field>
    
   </Section>
   <Section title="Answer box preload" open={!!q.answer.preloadAnswer}><Field label="Preload">{area('answer.preloadAnswer',5)}</Field></Section>
   <Section title="Global extra" open={!!q.answer.globalExtra}><Field label="Global extra">{area('answer.globalExtra',5)}</Field></Section>
    </section>
    <section role="tabpanel" tabIndex={0} id="studio-panel-3" aria-labelledby="studio-tab-3" hidden={step!==3}>
   <Section title="Test cases" open>
    <p className="muted">Whitespace được giữ nguyên. Display chỉ điều khiển hiển thị, mọi test đã chọn vẫn được chấm.</p>
    {q.testcases.map((t,i)=><div className="test-block" key={t.id}>
     <div className="test-heading"><h3>Test {String(i+1).padStart(2,'0')} <small>/ 05</small></h3><div className="inline"><span className="badge">{t.useasexample?'Public Example':'Không phải ví dụ công khai'}</span><span className="badge">Display: {displayNames[t.display]||t.display}</span></div></div>
     <div className="test-io-grid">{['stdin','expected','testcode','extra'].map((key,j)=><Field key={key} label={['Standard Input','Expected output','Test code / harness','Extra template data'][j]} help={[trUI("Dữ liệu stdin, có thể rỗng."),trUI("Chuỗi mong đợi; không tự trim. Có thể rỗng."),trUI("Mã harness (bài viết hàm), khác dữ liệu stdin."),trUI("Metadata riêng cho template, được lưu nguyên vẹn.")][j]}>{area('testcases.'+i+'.'+key,3)}</Field>)}</div>
     <Field label="Test properties">
      {check('testcases.'+i+'.useasexample','Use as example')}
      <label className="inline">Display {select('testcases.'+i+'.display',Object.entries(displayNames))}</label>
      {check('testcases.'+i+'.hiderestiffail','Hide rest if fail')}
      <div className="inline"><label>Mark {input('testcases.'+i+'.mark','number',{min:0,step:'any',disabled:q.allornothing})}</label><label>Ordering {input('testcases.'+i+'.ordering','number',{step:1})}</label></div>
     </Field>
     {q.precheck===3&&<Field label="Precheck test type">{select('testcases.'+i+'.testtype',[[0,'Check only'],[1,'Precheck only'],[2,'Both']])}</Field>}
    </div>)}
    <p className="muted">Mỗi đề công bố có đúng 5 testcase: ví dụ, cơ bản, biên, đặc biệt và phức tạp.</p>
   </Section>
    </section>
    <section role="tabpanel" tabIndex={0} id="studio-panel-4" aria-labelledby="studio-tab-4" hidden={step!==4}>
   <Section title="Xuất bản & phân phối" open><p className="muted">Ready yêu cầu đúng 5 testcase có nội dung. Bộ chấm và server xác thực cấu hình khi lưu; điều kiện chọn đề Survival dựa trên phiên bản đã xác thực.</p>
    <Field label="Question status">{select('general.status',[['draft','Draft'],['ready',trUI("Ready / Công bố")]])}</Field>
    <Field label="Code Survival">{check('survivalEligible',trUI("Cho phép dùng trong Code Survival"))}<small className="muted">Đáp án mẫu đã xác thực: {q.validatedVersion===q.version&&q.version&&!dirty?'v'+q.version:trUI("chưa xác thực phiên bản này")}</small></Field>
   </Section>
   <Section title="Tham số & cấu hình giao diện">
    <Field label="Template params">{area('templateparams',5)}</Field>
    <Field label="Template param controls">
     {check('hoisttemplateparams','Hoist template parameters')}{check('extractcodefromjson','Extract code from JSON')}{check('twigall','Twig all')}
     {select('templateparamslang',['None','twig','python3','C','C++','Java','php','Octave','Pascal'].map(v=>[v,v==='twig'?'Twig':v]))}
     {!['None','twig'].includes(q.templateparamslang)&&check('templateparamsevalpertry','Evaluate per try')}
    </Field>
    <Field label="UI parameters">{area('uiparameters')}</Field>
   </Section>
   {q.customise&&<>
    <Section title="Advanced customisation">
     <Field label="Prototype type">{select('advancedCustomisation.prototypetype',[[0,'No'],[2,'Yes — user defined (draft)']])}</Field>
     <Field label="Type name">{input('advancedCustomisation.typename','text',{disabled:q.advancedCustomisation.prototypetype!==2})}</Field>
     <Field label="Sandbox">{select('advancedCustomisation.sandbox',[['DOCKER','Docker isolated runner']])}</Field>
     {field('CPU time limit (seconds)','advancedCustomisation.cputimelimitsecs','number',trUI("1–10 giây mỗi test."),{min:1,max:10})}
     {field('Memory limit (MB)','advancedCustomisation.memlimitmb','number',trUI("64–512 MB; trống/0 dùng tối thiểu 64 MB."),{min:0,max:512})}
     <Field label="Sandbox params">{area('advancedCustomisation.sandboxparams')}</Field>
     {field('Language','advancedCustomisation.language')}{field('Ace language','advancedCustomisation.acelang')}
    </Section>
   </>}
   <Section title="Support files"><div className="alert">Chỉ khả dụng với bản nháp.</div><pre>{JSON.stringify(q.datafiles,null,2)}</pre></Section>
   <Section title="Attachment options">
    <div className="alert">Chỉ khả dụng với bản nháp.</div>
    <Field label="Attachments">{select('attachments.attachments',[[0,'No'],[1,'1'],[2,'2'],[3,'3'],[-1,'Unlimited']])}</Field>
    <Field label="Attachments required">{select('attachments.attachmentsrequired',[0,1,2,3].map(v=>[v,String(v)]),q.attachments.attachments===0)}</Field>
    {['filenamesregex','filenamesexplain','maxfilesize'].map(k=><Field key={k} label={k}>{input('attachments.'+k,k==='maxfilesize'?'number':'text',{disabled:q.attachments.attachments===0})}</Field>)}
   </Section>
   <Section title="Tags"><Field label="Tags"><input aria-label="tags" value={q.tags.join(', ')} onChange={e=>update('tags',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}/></Field></Section>
    </section>
   </fieldset><div className="studio-step-actions"><button className="secondary" disabled={step===0} onClick={()=>changeStep(step-1)}>← Bước trước</button><span>{step+1} / 5</span><button className="secondary" disabled={step===4} onClick={()=>changeStep(step+1)}>Bước tiếp →</button></div></div>
   <aside className="studio-support" aria-label="Kiểm tra & tóm tắt đề"><section><span className="eyebrow">PUBLISH CHECKLIST</span><h2>Trạng thái đề</h2><ul className="studio-checklist">{[[!!q.general.questionName.trim(),'Tên câu hỏi'],[!!q.general.questionText.trim(),'Nội dung đề'],[q.languages.length>0,'Ngôn ngữ lập trình'],[q.testcases.length===5,'Đủ 5 testcase'],[issues.length===0,'Cấu hình hợp lệ'],[verified,'Đáp án mẫu xác thực phiên bản hiện tại']].map(([ok,label])=><li key={label}><i aria-hidden="true" className={'fa-solid '+(ok?'fa-circle-check':'fa-circle-minus')}/><span>{label}</span><span className="sr-only">{ok?'Đạt':'Chưa đạt'}</span></li>)}</ul><p className="studio-validation" role="status">{issues.length?issues.length+' vấn đề cần kiểm tra':'Cấu hình hợp lệ để gửi lưu'}</p>{issues.length>0&&<details><summary>Xem vấn đề cấu hình</summary><ul>{issues.map((issue,i)=><li key={i}>{issue}</li>)}</ul></details>}</section><section><h3>Tóm tắt cấu hình</h3><dl className="fact-list"><div><dt>Loại câu hỏi</dt><dd>{q.coderunnertype}</dd></div><div><dt>Ngôn ngữ</dt><dd>{q.languages.map(l=>languageNames[l]).join(', ')||'Chưa chọn'}</dd></div><div><dt>Testcases</dt><dd>{q.testcases.length} · {exampleCount} Public Example</dd></div><div><dt>Điểm</dt><dd>{q.general.defaultMark}</dd></div><div><dt>Survival</dt><dd>{q.survivalEligible?'Cho phép':'Không dùng'}</dd></div></dl><p className="muted">Public Example và Display là hai thuộc tính độc lập. Ẩn hiển thị không thay đổi việc chấm test.</p></section>{readDraft()&&<section><h3>Nháp trên thiết bị</h3><p className="muted">Thay đổi được giữ cục bộ; chỉ nút Lưu mới cập nhật server.</p><button className="secondary" disabled={busy||loadFailed} onClick={()=>{try{if(dirty&&!window.confirm(trUI('Thay nội dung hiện tại bằng nháp cục bộ?')))return;setQ(normalize(JSON.parse(readDraft())));setDirty(true);}catch(e){setError(e);}}}>Khôi phục nháp cục bộ</button></section>}</aside>
  </div>
  <footer className="savebar studio-savebar"><div><b>{busy?'Đang lưu…':dirty?'Có thay đổi chưa lưu':'Không có thay đổi'}</b><small>{dirty?'Nháp cục bộ được giữ trên thiết bị':'Cấu hình server là nguồn dữ liệu chính thức'}</small></div><div className="inline"><button className="ghost" disabled={busy} onClick={cancel}>Hủy</button><button className="secondary" aria-busy={busy} disabled={busy||loadFailed} onClick={()=>save(true)}>Lưu và tiếp tục sửa</button><button aria-busy={busy} disabled={busy||loadFailed} onClick={()=>save(false)}>Lưu thay đổi →</button></div></footer>
 </div>;
}
