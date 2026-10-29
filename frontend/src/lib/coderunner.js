export const languageNames={CPP11:'C++ 11',CPP17:'C++ 17',CPP20:'C++ 20',PY311:'Python 3.11'};
export const displayNames={SHOW:'Show',HIDE:'Hide',HIDE_IF_FAIL:'Hide if fail',HIDE_IF_SUCCEED:'Hide if succeed'};
export const createTest=(i)=>({id:crypto.randomUUID(),testcode:'',stdin:'',expected:'',extra:'',useasexample:false,display:'SHOW',hiderestiffail:false,mark:1,ordering:(i+1)*10,testtype:0});
export function defaults(categoryId='algorithms'){
 return {coderunnertype:'Undefined',customise:false,showsource:false,answerboxlines:18,precheck:0,hidecheck:false,giveupallowed:0,displayfeedback:1,allornothing:true,penaltyregime:'10, 20, ...',templateparams:'',hoisttemplateparams:true,extractcodefromjson:true,twigall:false,templateparamslang:'None',templateparamsevalpertry:false,uiparameters:'',difficulty:1,languages:['CPP11','CPP17','CPP20','PY311'],survivalEligible:false,
 general:{categoryId,questionName:'',questionText:'',status:'draft',defaultMark:1,generalFeedback:'',idNumber:''},
 answer:{sampleAnswer:'',language:'PY311',preloadAnswer:'',globalExtra:'',validateOnSave:true,sampleAnswerAttachments:[]},
 testcases:Array.from({length:5},(_,i)=>createTest(i)),
 customisation:{template:'',iscombinatortemplate:false,allowmultiplestdins:false,testsplitterre:'',grader:'EqualityGrader',resultcolumns:'',uiplugin:'textarea',useace:false,prototypeextra:''},
 advancedCustomisation:{prototypetype:0,typename:'',sandbox:'DOCKER',cputimelimitsecs:2,memlimitmb:256,sandboxparams:'',language:'',acelang:''},
 attachments:{attachments:0,attachmentsrequired:0,filenamesregex:'',filenamesexplain:'',maxfilesize:10240},datafiles:[],tags:[]};
}
export function normalize(raw){
 if(!raw || typeof raw!=='object' || Array.isArray(raw) || !Array.isArray(raw.testcases)) throw Error('JSON phải là question object với mảng testcases.');
 const d=defaults(); const q={...d,...raw};
 for(const k of ['general','answer','customisation','advancedCustomisation','attachments']) q[k]={...d[k],...raw[k]};
 q.testcases=raw.testcases.map((t,i)=>({...createTest(i),...t}));
 if(!raw.languages) q.languages=raw.coderunnertype==='python3'?['PY311']:raw.coderunnertype==='cpp_function'?['CPP11','CPP17','CPP20']:d.languages;
 return q;
}
export const activeTests=q=>q.testcases.filter(t=>t.testcode!==''||t.stdin!==''||t.expected!=='');
export function validate(q){
 const errors=[];
 if(!['python3','python3_program','cpp_program','cpp_function'].includes(q.coderunnertype)) errors.push('Cần chọn Question type.');
 if(!q.general.questionName.trim()) errors.push('Question name không được trống.');
 if(!q.general.questionText.trim()) errors.push('Question text không được trống.');
 if(!(q.general.defaultMark>0)) errors.push('Default mark phải dương.');
 if(!Number.isInteger(q.answerboxlines)||q.answerboxlines<=0||q.answerboxlines>200) errors.push('Rows phải là số nguyên 1–200.');
 if(!Number.isInteger(q.difficulty)||q.difficulty<1||q.difficulty>6) errors.push('Độ khó từ 1 đến 6.');
 if(!Array.isArray(q.languages)||!q.languages.length||q.languages.some(l=>!languageNames[l])) errors.push('Cần chọn ngôn ngữ hợp lệ.');
 if(q.penaltyregime&&!/^\s*\d+(?:\.\d+)?(?:\s*,\s*\d+(?:\.\d+)?)*(?:\s*,\s*\.{3})?\s*$/.test(q.penaltyregime)) errors.push('Penalty regime: ví dụ 10, 20, ...');
 const tests=activeTests(q);
 if(q.testcases.length>5)errors.push('Tối đa 5 testcase.');
 if(q.general.status==='ready'&&(q.testcases.length!==5||tests.length!==5))errors.push('Đề công bố cần đúng 5 testcase có nội dung.');
 if(!tests.length && q.advancedCustomisation.prototypetype!==2) errors.push('Cần ít nhất một test có nội dung.');
 if(tests.some(t=>t.testcode!=='')&&tests.some(t=>t.testcode==='')) errors.push('Testcode phải có ở tất cả hoặc trống ở tất cả test có nội dung.');
 if(q.precheck===2&&!tests.some(t=>t.useasexample)) errors.push('Precheck Examples cần ít nhất một Use as example.');
 const ids=new Set();
 q.testcases.forEach((t,i)=>{
  if(!t.id||ids.has(t.id)) errors.push('ID test case '+(i+1)+' bị trùng.'); ids.add(t.id);
  if(['testcode','stdin','expected','extra'].some(k=>typeof t[k]!=='string')) errors.push('Test '+(i+1)+': các trường code/input/output/extra phải là chuỗi.');
  if(!displayNames[t.display]) errors.push('Test '+(i+1)+': Display không hợp lệ.');
  if(!Number.isFinite(t.mark)||t.mark<0||!Number.isInteger(t.ordering)||![0,1,2].includes(t.testtype)) errors.push('Test '+(i+1)+': Mark/Ordering/Test type không hợp lệ.');
 });
 for(const [key,value] of [['UI parameters',q.uiparameters],['Sandbox params',q.advancedCustomisation.sandboxparams],['Result columns',q.customisation.resultcolumns]]){
  if(value) try{JSON.parse(value);}catch{errors.push(key+' phải là JSON hợp lệ.');}
 }
 if((q.templateparamslang==='None')&&q.templateparams) try{JSON.parse(q.templateparams);}catch{errors.push('Template params phải là JSON khi Preprocessor=None.');}
 const a=q.attachments;
 if(a.attachments!==-1&&a.attachmentsrequired>a.attachments) errors.push('Số file bắt buộc không được vượt số file cho phép.');
 return errors;
}
export function serialized(q){return {...q,testcases:q.testcases.map(t=>({...t}))};}
