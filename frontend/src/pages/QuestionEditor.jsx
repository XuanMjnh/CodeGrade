import {StatGrid} from '../components/Insights';
import {t as trUI} from "../lib/locale";
import React,{useEffect,useState} from 'react';
import {live} from '../lib/live';
import {defaults,normalize,validate,serialized,createTest,displayNames,languageNames} from '../lib/coderunner';
import {Field,Section,Check,Heading,ErrorBox,Help,go} from '../components/ui';

function at(obj,path){return path.split('.').reduce((v,k)=>v?.[k],obj);}
export default function QuestionEditor({id,revision,onNotice}){
 const [q,setQ]=useState(()=>defaults()),[categories,setCategories]=useState([]),[types,setTypes]=useState([]),[errors,setErrors]=useState([]),[error,setError]=useState(null),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
 const draftKey='cg-question-draft-'+(id||'new');
 useEffect(()=>{
  live.call('CATEGORIES').then(setCategories).catch(setError);
  fetch('/api/meta').then(r=>r.json()).then(m=>setTypes(m.questionTypes)).catch(setError);
  if(id)live.call('QUESTION_EDIT',{id}).then(d=>{setQ(normalize(d));setDirty(false);}).catch(setError);
  else{setQ(defaults());setDirty(false);}
 },[id]);
 useEffect(()=>{if(dirty)localStorage.setItem(draftKey,JSON.stringify(q));},[q,dirty,draftKey]);
 useEffect(()=>{const f=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',f);return()=>window.removeEventListener('beforeunload',f);},[dirty]);
 function update(path,value){setQ(prev=>{const next=structuredClone(prev),parts=path.split('.'),last=parts.pop();let obj=next;for(const k of parts)obj=obj[k];obj[last]=value;return next;});setDirty(true);}
 const input=(path,type='text',props={})=><input aria-label={path} type={type} value={at(q,path)??''} onChange={e=>update(path,type==='number'?(e.target.value===''?null:Number(e.target.value)):e.target.value)} {...props}/>;
 const area=(path,rows=4)=><textarea className={/answer|testcases|template|globalextra/i.test(path)?"code-input":undefined} aria-label={path} spellCheck={false} rows={rows} value={at(q,path)??''} onChange={e=>update(path,e.target.value)}/>;
 const check=(path,label,disabled=false)=><Check label={label} checked={at(q,path)} onChange={v=>update(path,v)} disabled={disabled}/>;
 const select=(path,options,disabled=false)=><select aria-label={path} value={at(q,path)??''} disabled={disabled} onChange={e=>update(path,typeof at(q,path)==='number'?Number(e.target.value):e.target.value)}>{options.map(([v,n])=><option key={v} value={v}>{n}</option>)}</select>;
 const field=(label,path,type='text',help=label,props={})=><Field label={label} help={help}>{input(path,type,props)}</Field>;
 async function save(stay){
  setError(null);const errs=validate(q);setErrors(errs);if(errs.length){document.querySelector('.editor-errors')?.scrollIntoView({behavior:'smooth'});return;}
  setBusy(true);
  try{const result=await live.call('QUESTION_SAVE',serialized(q));setQ(normalize(result));setDirty(false);localStorage.removeItem(draftKey);
   onNotice(result.sampleValidation?trUI("Đã lưu. Đáp án mẫu được đưa vào queue; xem kết quả ở Bài nộp."):result.validationNotice||trUI("Đã lưu câu hỏi."));
   if(stay){location.hash='/edit/'+result.id;}else go('/practice');
  }catch(e){setError(e);}finally{setBusy(false);}
 }
 function exportJson(){const blob=new Blob([JSON.stringify(serialized(q),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='coderunner-question.json';a.click();URL.revokeObjectURL(a.href);}
 async function importJson(e){
  try{const f=e.target.files?.[0];if(!f)return;if(f.size>900000)throw Error(trUI("JSON tối đa 900 KiB."));const incoming=normalize(JSON.parse(await f.text()));const errs=validate(incoming);if(errs.length)throw Error(errs.join('\n'));
   if(dirty&&!window.confirm(trUI("Thay dữ liệu đang sửa bằng JSON này?")))return;
   // Import creates a copy unless editing the same server identity.
   if(incoming.id!==id){delete incoming.id;delete incoming.version;delete incoming.validatedVersion;}
   setQ(incoming);setDirty(true);setErrors([]);setError(null);
  }catch(err){setError(err);}finally{e.target.value='';}
 }
 function cloneTest(i){const list=[...q.testcases];list.splice(i+1,0,{...list[i],id:crypto.randomUUID(),ordering:Math.max(0,...list.map(t=>t.ordering))+10});update('testcases',list);}
 function deleteTest(i){const t=q.testcases[i];if((t.testcode||t.stdin||t.expected||t.extra)&&!window.confirm(trUI("Xóa test case có dữ liệu này?")))return;update('testcases',q.testcases.filter((_,k)=>k!==i));}
 const selectedHelp=types.find(t=>t.id===q.coderunnertype)?.description||trUI("Chưa chọn loại câu hỏi.");
 return <div className="question-editor">
  
  <Heading eyebrow="QUESTION BANK" title={id?'Editing a CodeRunner question':'Adding a CodeRunner question'} action={<button className="secondary" onClick={()=>{if(!dirty||window.confirm(trUI("Bỏ các thay đổi chưa lưu?")))go('/practice');}}>Hủy</button>}>Soạn đề bài, lời giải mẫu và bộ kiểm thử.</Heading>
  <StatGrid label="Tổng quan đề đang soạn" items={[{label:'Mã bài',value:q.publicId||trUI('Chưa cấp mã')},{label:'Test đang soạn',value:q.testcases.length},{label:'Ví dụ công khai',value:q.testcases.filter(t=>t.useasexample).length},{label:'Trạng thái lưu',value:dirty?trUI('Chưa lưu'):trUI('Đã lưu')}]}/>
  <div className="toolbar"><label className="button secondary">Import JSON<input type="file" accept=".json,application/json" hidden onChange={importJson}/></label><button className="secondary" onClick={exportJson}>Export JSON</button>{localStorage.getItem(draftKey)&&<button className="ghost" onClick={()=>{try{setQ(normalize(JSON.parse(localStorage.getItem(draftKey))));setDirty(true);}catch(e){setError(e);}}}>Khôi phục nháp cục bộ</button>}<span className="muted">{q.id?'v'+q.version:trUI("Câu hỏi mới")}{dirty?trUI(" · Chưa lưu"):''}</span></div>
  <ErrorBox error={error}/>{errors.length>0&&<div role="alert" className="alert danger editor-errors"><strong>Cần sửa trước khi lưu</strong><ul>{errors.map((e,i)=><li key={i}>{e}</li>)}</ul></div>}
  <div className="paper">
   <Section title="CodeRunner question type" open>
    <Field label="Question type">{select('coderunnertype',[['Undefined','Undefined'],...types.map(t=>[t.id,t.id])])}</Field>
    <Field label="Customisation"><div className="inline">{check('customise','Customise')}{check('showsource','Template debugging')}</div></Field>
    {field('Answer box — Rows','answerboxlines','number',trUI("Số dòng ô trả lời của coder, không phải số dòng testcase."),{min:1,max:200})}
    <Field label="Submit buttons"><div className="inline">{select('precheck',[[0,'Disabled'],[1,'Empty'],[2,'Examples'],[3,'Selected'],[4,'All']])}{check('hidecheck','Hide check')}</div></Field>
    <Field label="Stop button">{select('giveupallowed',[[0,'Never available'],[1,'After maximum marks'],[2,'Always available']])}<small className="muted">Chỉ khả dụng với bản nháp.</small></Field>
    <Field label="Feedback">{select('displayfeedback',[[0,'Use quiz settings'],[1,'Force show'],[2,'Force hide']])}</Field>
    <Field label="Marking">{check('allornothing','All-or-nothing grading')}</Field>
    {field('Penalty regime','penaltyregime','text',trUI("Lưu penalty Moodle; Code Survival dùng cố định 10 giây/lần sai."))}
    <Field label="Template params">{area('templateparams',5)}</Field>
    <Field label="Template param controls">
     {check('hoisttemplateparams','Hoist template parameters')}{check('extractcodefromjson','Extract code from JSON')}{check('twigall','Twig all')}
     {select('templateparamslang',['None','twig','python3','C','C++','Java','php','Octave','Pascal'].map(v=>[v,v==='twig'?'Twig':v]))}
     {!['None','twig'].includes(q.templateparamslang)&&check('templateparamsevalpertry','Evaluate per try')}
    </Field>
    <Field label="UI parameters">{area('uiparameters')}</Field>
   </Section>
   <Section title="Question type details"><p>{selectedHelp}</p><p>EqualityGrader so sánh chính xác, chỉ chuẩn hóa CRLF → LF. NearEqualityGrader dùng sai số tương đối 10⁻⁶. RegexGrader dùng RE2.</p></Section>
   <Section title="General" open>
    <Field label="Category">{select('general.categoryId',categories.map(c=>[c.id,c.name]))}</Field>
    {field('Question name','general.questionName')}{<Field label="Question text">{area('general.questionText',8)}</Field>}
    <Field label="Question status">{select('general.status',[['draft','Draft'],['ready',trUI("Ready / Công bố")]])}</Field>
    {field('Default mark','general.defaultMark','number',trUI("Tổng điểm câu hỏi, khác trọng số Mark của từng test."),{min:0.01,step:'any'})}
    <Field label="General feedback">{area('general.generalFeedback')}</Field>
    {field(trUI('Mã tham chiếu ngoài'),'general.idNumber')}
    <Field label="Difficulty">{select('difficulty',[1,2,3,4,5,6].map(d=>[d,trUI("Mức ")+d]))}</Field>
    <Field label="Languages"><div className="inline">{Object.entries(languageNames).map(([k,n])=><Check key={k} label={n} checked={q.languages.includes(k)} onChange={yes=>update('languages',yes?[...q.languages,k]:q.languages.filter(l=>l!==k))}/>)}</div></Field>
    <Field label="Code Survival">{check('survivalEligible',trUI("Cho phép dùng trong Code Survival"))}<small className="muted">Đáp án mẫu đã xác thực: {q.validatedVersion===q.version&&q.version?'v'+q.version:trUI("chưa xác thực phiên bản này")}</small></Field>
   </Section>
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
   <Section title="Answer" open>
    <Field label="Sample answer">{area('answer.sampleAnswer',12)}</Field>
    <Field label="Sample answer language">{select('answer.language',q.languages.map(l=>[l,languageNames[l]]))}</Field>
    <Field label="Validate on Save">{check('answer.validateOnSave','Validate sample answer on save')}</Field>
    
   </Section>
   <Section title="Answer box preload" open={!!q.answer.preloadAnswer}><Field label="Preload">{area('answer.preloadAnswer',5)}</Field></Section>
   <Section title="Global extra" open={!!q.answer.globalExtra}><Field label="Global extra">{area('answer.globalExtra',5)}</Field></Section>
   <Section title="Test cases" open>
    <p className="muted">Whitespace được giữ nguyên. Display chỉ điều khiển hiển thị, mọi test đã chọn vẫn được chấm.</p>
    {q.testcases.map((t,i)=><div className="test-block" key={t.id}>
     <div className="test-heading"><h3>Test case {i+1}</h3><div><button className="ghost" type="button" onClick={()=>cloneTest(i)}>Nhân bản</button><button className="ghost danger-text" type="button" onClick={()=>deleteTest(i)}>Xóa</button></div></div>
     {['testcode','stdin','expected','extra'].map((key,j)=><Field key={key} label={['Test case '+(i+1),'Standard Input','Expected output','Extra template data'][j]} help={[trUI("Mã harness (bài viết hàm), khác dữ liệu stdin."),trUI("Dữ liệu stdin, có thể rỗng."),trUI("Chuỗi mong đợi; không tự trim. Có thể rỗng."),trUI("Metadata riêng cho template, được lưu nguyên vẹn.")][j]}>{area('testcases.'+i+'.'+key,3)}</Field>)}
     <Field label="Test properties">
      {check('testcases.'+i+'.useasexample','Use as example')}
      <label className="inline">Display {select('testcases.'+i+'.display',Object.entries(displayNames))}</label>
      {check('testcases.'+i+'.hiderestiffail','Hide rest if fail')}
      <div className="inline"><label>Mark {input('testcases.'+i+'.mark','number',{min:0,step:'any',disabled:q.allornothing})}</label><label>Ordering {input('testcases.'+i+'.ordering','number',{step:1})}</label></div>
     </Field>
     {q.precheck===3&&<Field label="Precheck test type">{select('testcases.'+i+'.testtype',[[0,'Check only'],[1,'Precheck only'],[2,'Both']])}</Field>}
    </div>)}
    <button className="secondary" type="button" onClick={()=>{const max=Math.max(0,...q.testcases.map(t=>t.ordering));update('testcases',[...q.testcases,...Array.from({length:3},(_,i)=>({...createTest(q.testcases.length+i),ordering:max+(i+1)*10}))]);}}>+ Blanks for 3 more choices</button>
   </Section>
   <Section title="Support files"><div className="alert">Chỉ khả dụng với bản nháp.</div><pre>{JSON.stringify(q.datafiles,null,2)}</pre></Section>
   <Section title="Attachment options">
    <div className="alert">Chỉ khả dụng với bản nháp.</div>
    <Field label="Attachments">{select('attachments.attachments',[[0,'No'],[1,'1'],[2,'2'],[3,'3'],[-1,'Unlimited']])}</Field>
    <Field label="Attachments required">{select('attachments.attachmentsrequired',[0,1,2,3].map(v=>[v,String(v)]),q.attachments.attachments===0)}</Field>
    {['filenamesregex','filenamesexplain','maxfilesize'].map(k=><Field key={k} label={k}>{input('attachments.'+k,k==='maxfilesize'?'number':'text',{disabled:q.attachments.attachments===0})}</Field>)}
   </Section>
   <Section title="Tags"><Field label="Tags"><input aria-label="tags" value={q.tags.join(', ')} onChange={e=>update('tags',e.target.value.split(',').map(s=>s.trim()).filter(Boolean))}/></Field></Section>
  </div>
  <div className="savebar"><button aria-busy={busy} disabled={busy} onClick={()=>save(false)}>Save changes</button><button className="secondary" aria-busy={busy} disabled={busy} onClick={()=>save(true)}>Save changes and continue editing</button><button className="ghost" onClick={()=>{if(!dirty||window.confirm(trUI("Bỏ thay đổi chưa lưu?")))go('/practice');}}>Cancel</button></div>
 </div>;
}
