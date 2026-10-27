// DOM interaction against a real Spring Boot server. Not a visual/browser layout test.
// Build client first. CG_UI_PASSWORD=... node frontend/tests/ui-integration.cjs
const {JSDOM,VirtualConsole}=require('jsdom');
const WS=require('ws');const crypto=require('crypto');const fs=require('fs');const path=require('path');
const project=path.resolve(__dirname,'../..');const base=process.env.CG_UI_URL||'http://localhost:8080';
const password=process.env.CG_UI_PASSWORD;if(!password)throw Error('Set CG_UI_PASSWORD to the demo password');
const html=fs.readFileSync(path.join(project,'frontend/dist/index.html'),'utf8');
const asset=html.match(/src="([^"]+\.js)"/)[1];const code=fs.readFileSync(path.join(project,'frontend/dist',asset),'utf8');
const checks=[],errors=[],sockets=[],windows=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn,label){for(let i=0;i<300;i++){if(fn())return;await delay(50);}throw Error('Timed out: '+label);}
function boot(lang="vi"){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.startsWith('Not implemented: navigation'))errors.push(e.message);});
 const dom=new JSDOM(html,{url:base,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;windows.push(w);
 w.ResizeObserver=class{observe(){} unobserve(){} disconnect(){}};w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.Range.prototype.getClientRects=()=>[];w.Range.prototype.getBoundingClientRect=()=>({left:0,right:0,top:0,bottom:0,width:0,height:0});w.File.prototype.text=function(){return new Promise(resolve=>{const reader=new w.FileReader();reader.onload=()=>resolve(reader.result);reader.readAsText(this);});};
 w.fetch=(url,opts)=>fetch(new URL(url,base),opts);w.structuredClone=structuredClone;w.crypto.randomUUID=crypto.randomUUID;
 w.WebSocket=class extends WS{constructor(...args){super(...args);sockets.push(this);}};w.confirm=()=>true;
 w.URL.createObjectURL=b=>{w._exported=b;return 'blob:test';};w.URL.revokeObjectURL=()=>{};
 w.localStorage.setItem("cg-locale",lang);w.eval(code);return w;
}
function input(w,label,value){const el=w.document.querySelector('[aria-label="'+label+'"]');if(!el)throw Error('Missing '+label);const proto=el.tagName==='TEXTAREA'?w.HTMLTextAreaElement.prototype:el.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,String(value));el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));}
function button(w,text){const b=[...w.document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);if(!b)throw Error('Missing button '+text);b.click();}
function checkbox(w,text){return [...w.document.querySelectorAll('label.check')].find(x=>x.textContent.trim()===text)?.querySelector('input');}
async function login(w,user,label="Đăng nhập →"){await wait(()=>w.document.querySelector('input[autocomplete=username]')&&!w.document.querySelector('button[type=submit]')?.disabled,'login ready');const u=w.document.querySelector('input[autocomplete=username]'),p=w.document.querySelector('input[type=password]');Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(u,user);u.dispatchEvent(new w.Event('input',{bubbles:true}));Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(p,password);p.dispatchEvent(new w.Event('input',{bubbles:true}));await delay(100);button(w,label);await wait(()=>w.document.querySelector('.practice-banner'),'login '+user);}
(async()=>{
 const servedHtml=await fetch(base).then(r=>{if(!r.ok)throw Error('Server HTML unavailable');return r.text();});
 const servedCode=await fetch(new URL(asset,base)).then(r=>{if(!r.ok)throw Error('Server client bundle unavailable');return r.text();});
 if(servedHtml!==html||servedCode!==code)throw Error('Packaged server assets differ from the built frontend; clean rebuild required');
 const w=boot();await delay(300);await login(w,'author');checks.push('author authenticated through live WebSocket');
 if(w.document.querySelectorAll('.header nav a').length!==5)throw Error('primary navigation density');
 if(w.document.querySelectorAll('.header nav i,.heading h1 i').length)throw Error('unnecessary automatic icons');
 if(!w.document.querySelector('.header nav [aria-current=page]'))throw Error('current navigation missing');
 if(w.document.documentElement.lang!=='vi')throw Error('VI document language');
 const skip=w.document.querySelector('.skip-link');skip.click();if(w.document.activeElement.id!=='main-content')throw Error('skip link focus');
 const account=w.document.querySelector('.user-menu details');account.open=true;account.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));if(account.open||w.document.activeElement!==account.querySelector('summary'))throw Error('account Escape');
 checks.push('five text navigation links, skip link and account Escape');
 await wait(()=>w.document.querySelector('.bookmark-button'),'practice rows');const bookmark=w.document.querySelector('.bookmark-button');bookmark.click();await wait(()=>w.document.querySelector('.bookmark-button')?.getAttribute('aria-pressed')==='true','bookmark pressed');
 checks.push('bookmark exposes pressed state');
 const favoriteTitle=w.document.querySelector('.problem-title').textContent;
 await wait(()=>[...w.document.querySelectorAll('.favorite-list a')].some(a=>a.textContent.includes(favoriteTitle)),'favorite rail refresh');
 await wait(()=>w.document.querySelectorAll('.category-chip').length>=6&&w.document.querySelectorAll('.elo-list li').length===5,'data rails');
 if(w.document.querySelector('.header-user-name').textContent.trim()==='')throw Error('header display name');
 checks.push('live favorites, category counts, top five Elo and header name');
 if(!w.document.querySelector('.utility-rail.left > section:first-child.timer-card'))throw Error('timer order');
 if(w.document.querySelectorAll('.elo-list .fa-trophy').length!==1)throw Error('top one trophy');
 if(w.document.querySelector('.header .connection'))throw Error('removed connection label');
 checks.push('timer above favorites, one top Elo trophy and no connection label');

 input(w,'Tìm danh mục','Đồ thị');await delay(100);if(w.document.querySelectorAll('.category-chip').length!==1)throw Error('category chip search');
 w.document.querySelector('.category-chip').click();await wait(()=>w.document.querySelector('.filters select')?.value==='graphs','category deep link');
 input(w,'Tìm bài tập',favoriteTitle);w.document.querySelector('.header-search').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await wait(()=>w.document.querySelector('.filters input')?.value===favoriteTitle,'header search deep link');
 await wait(()=>w.document.querySelectorAll('table tbody tr').length===1,'header search result');
 checks.push('category chip navigation and header search filter practice');
 const publicCode=w.document.querySelector('.problem-library-table .problem-id').textContent;if(!/^CG-[0-9]{4,}$/.test(publicCode))throw Error('public problem code');
 input(w,'Tìm bài tập',publicCode);w.document.querySelector('.header-search').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>w.document.querySelector('.filters input')?.value===publicCode&&w.document.querySelectorAll('.problem-library-table tbody tr').length===1,'public ID search');
 checks.push('public problem ID is displayed and searchable');



 w.location.hash='/edit';await wait(()=>w.document.querySelectorAll('.test-block').length===5,'five default tests');checks.push('five initial tests');
 await wait(()=>w.document.querySelector('[aria-label=coderunnertype]')?.options.length>1,'metadata');input(w,'coderunnertype','cpp_program');
 input(w,'general.questionName','DOM QA '+Date.now());input(w,'general.questionText','Read two integers and print sum.');input(w,'precheck',3);
 input(w,'testcases.0.stdin','2 3\n');input(w,'testcases.0.expected','5\n');input(w,'testcases.1.stdin','10 20\n');input(w,'testcases.1.expected','30\n');input(w,'testcases.0.extra','line one\nline two');input(w,'testcases.0.display','HIDE_IF_FAIL');await delay(100);
 checkbox(w,'Chấm toàn bộ hoặc không có điểm').click();await delay(50);input(w,'testcases.0.mark',2.5);await delay(50);checkbox(w,'Chấm toàn bộ hoặc không có điểm').click();await delay(50);
 if(!w.document.querySelector('[aria-label="testcases.0.mark"]').disabled)throw Error('mark not disabled');checkbox(w,'Chấm toàn bộ hoặc không có điểm').click();await delay(50);
 if(w.document.querySelector('[aria-label="testcases.0.mark"]').value!=='2.5')throw Error('mark lost');checks.push('all-or-nothing preserves mark');
 button(w,'Thêm 3 test');await wait(()=>w.document.querySelectorAll('.test-block').length===8,'eight tests');if(w.document.querySelector('[aria-label="testcases.7.ordering"]').value!=='80')throw Error('ordering');checks.push('add three keeps ordering');
 checkbox(w,'Thêm tùy chỉnh').click();await delay(50);if(!w.document.body.textContent.includes('Tùy chỉnh nâng cao'))throw Error('custom sections');checks.push('custom sections toggle');
 button(w,'Xuất JSON');await delay(50);const exported=await new Promise((resolve,reject)=>{const r=new w.FileReader();r.onload=()=>resolve(JSON.parse(r.result));r.onerror=reject;r.readAsText(w._exported);});
 if(exported.testcases[0].stdin!=='2 3\n'||exported.testcases[0].mark!==2.5||exported.testcases[0].display!=='HIDE_IF_FAIL'||exported.testcases[0].extra!=='line one\nline two')throw Error('export exact metadata');checks.push('export JSON keeps metadata and newline');
 button(w,'Lưu và tiếp tục sửa');await wait(()=>w.location.hash.startsWith('#/edit/'),'server save');await delay(500);const id=w.location.hash.split('/').pop();
 w.location.hash='/practice';await wait(()=>w.document.querySelector('.practice-banner'),'leave editor');w.location.hash='/edit/'+id;await wait(()=>w.document.querySelector('[aria-label="testcases.0.mark"]')?.value==='2.5','server reload');
 if(w.document.querySelector('[aria-label="testcases.0.stdin"]').value!=='2 3\n')throw Error('newline lost');checks.push('server save load roundtrip');
 // Isolated window = separate sessionStorage/account, real simultaneous sockets.
 const c=boot();await delay(300);await login(c,'coder01');c.location.hash='/survival';await wait(()=>c.document.querySelector('.difficulty-checks'),'survival');
 const option=c.document.querySelector('.difficulty-option');if(c.document.querySelectorAll('.difficulty-option').length!==6||option.querySelector('.difficulty-label').textContent!=='Mức 1')throw Error('difficulty option labels');
 const selected=option.querySelector('input').checked;option.querySelector('.difficulty-label').click();await delay(50);if(option.querySelector('input').checked===selected)throw Error('difficulty label cannot toggle selection');option.querySelector('.difficulty-label').click();await delay(50);

 for(const d of [1,2,3])checkbox(c,'Mức '+d).click();await delay(50);button(c,'+ Tạo phòng');await wait(()=>c.document.body.textContent.includes('Chọn ít nhất một mức khó.'),'empty difficulty');checks.push('empty difficulty rejected');
 for(const d of [1,2,3])checkbox(c,'Mức '+d).click();await delay(50);button(c,'+ Tạo phòng');await wait(()=>c.document.querySelector('.invite-code'),'create room');const invite=c.document.querySelector('.invite-code').textContent;
 const other=boot();await delay(300);await login(other,'coder02');other.location.hash='/room/'+invite;await wait(()=>other.document.querySelectorAll('.player').length>=2,'second player');
 checkbox(c,'Mức 1').click();await delay(50);button(c,'Lưu độ khó cho cả phòng');await wait(()=>{const a=other.document.querySelectorAll('.room-status input[type=checkbox]');return a.length===6&&!a[0].checked&&a[1].checked&&a[0].disabled;},'broadcast config');checks.push('two simultaneous clients synchronize room config');
 const locked=other.document.querySelector('.difficulty-option');const before=locked.querySelector('input').checked;locked.querySelector('.difficulty-label').click();await delay(50);if(!locked.querySelector('input').disabled||locked.querySelector('input').checked!==before)throw Error('disabled difficulty option changed');
 checks.push('six readable difficulty labels toggle through their full label and remain locked for other players');

 const english=boot('en');await delay(300);await login(english,'coder03','Sign in →');if(!english.document.body.textContent.includes('Problem library'))throw Error('English locale');checks.push('English interface renders and authenticates');if(english.document.documentElement.lang!=='en')throw Error('EN document language');
 await wait(()=>english.document.querySelector('.problem-title'),'English problem rows');
 if(!english.document.querySelector('.badge[class*=level-]'))throw Error('difficulty palette labels missing');
 if(english.document.querySelector('.heading .eyebrow')||english.document.body.textContent.includes('Phiên bản'))throw Error('removed headings/versions');
 const difficulty=[...english.document.querySelectorAll('.sort-button')].find(x=>x.textContent.includes('Difficulty'));difficulty.click();await delay(100);if(!english.document.querySelector('th[aria-sort="descending"]'))throw Error('sort direction');
 checks.push('sortable headers and clean problem metadata');
 english.document.querySelector('.problem-title').click();await wait(()=>english.document.querySelector('.cm-editor'),'syntax editor');
 if(english.document.querySelector('.cm-dark'))throw Error('editor still uses dark theme');
 const codeSurface=fs.readFileSync(path.join(project,'frontend/src/styles/tokens.css'),'utf8');if(!codeSurface.includes('--color-surface-code: #ffffff'))throw Error('editor surface is not light');
 checks.push('light CodeMirror editor and light banner semantic surfaces');
 await wait(()=>english.document.querySelector('input[type=file]'),'source import');
 const upload=english.document.querySelector('input[type=file]');Object.defineProperty(upload,'files',{configurable:true,value:[new english.File(['print(42)\n'],'solution.py',{type:'text/plain'})]});upload.dispatchEvent(new english.Event('change',{bubbles:true}));await delay(400);
 if(!english.document.querySelector('.cm-content').textContent.includes('print(42)'))throw Error('source file import');
 const history=english.document.querySelector('.submission-history');if(!history||!history.nextElementSibling?.textContent.includes('Comments'))throw Error('history before comments');
 checks.push('syntax editor, source import and separate judging history');
 english.location.hash='/submissions';await wait(()=>english.document.querySelector('.banner-submissions')&&english.document.body.textContent.includes('Verdict distribution'),'submission overview');
 english.location.hash='/leaderboard';await wait(()=>english.document.querySelectorAll('.podium-card').length===3,'podium');if(!english.document.body.textContent.includes('Your position'))throw Error('personal ranking');
 english.location.hash='/contests';await wait(()=>english.document.querySelector('.banner-contest'),'contest overview');if(!english.document.body.textContent.includes('No matching contests.'))await wait(()=>english.document.body.textContent.includes('No matching contests.'),'empty contest schedule');
 english.location.hash='/profile';await wait(()=>english.document.querySelector('.profile-grid'),'profile context');if(!english.document.body.textContent.includes('Contact details'))throw Error('profile panels');
 checks.push('submission summaries, podium, empty contest schedule and profile panels in English');
 w.location.hash='/contests';await wait(()=>w.document.querySelector('.banner-contest'),'author contest');button(w,'Tạo contest');await wait(()=>w.document.querySelector('.contest-create'),'contest creation');
 const contestForm=w.document.querySelector('.contest-create');const setNative=(el,value)=>{Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 setNative(contestForm.querySelector('input[type=text], input:not([type])'),'Dashboard contest');const dates=contestForm.querySelectorAll('input[type=datetime-local]');const localDate=ms=>{const d=new Date(ms);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);};setNative(dates[0],localDate(Date.now()+3600000));setNative(dates[1],localDate(Date.now()+7200000));await wait(()=>contestForm.querySelector('.problem-checks input'),'contest problems');contestForm.querySelector('.problem-checks input').click();await delay(100);contestForm.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>w.document.querySelector('.contest-cards .room-card'),'created contest card');w.document.querySelector('.contest-cards .room-card').click();await wait(()=>w.document.querySelector('#contest-detail .contest-countdown'),'contest detail');
 checks.push('contest creation, contextual schedule and countdown detail');
 const admin=boot();await delay(300);await login(admin,'admin');admin.location.hash='/admin';await wait(()=>admin.document.querySelector('.banner-admin'),'admin overview');admin.location.hash='/announcements';await wait(()=>admin.document.querySelector('.banner-announcements'),'announcement overview');button(admin,'Soạn thông báo');await wait(()=>admin.document.querySelector('textarea'),'announcement form');
 checks.push('admin overview and announcement composer');
 if(errors.length)throw Error(errors.join('; '));
 const output=path.join(project,'statics/results/ui.json');fs.writeFileSync(output,JSON.stringify({kind:'JSDOM interaction over real Spring Boot and configured SQL database, not native visual browser verification',checks,passed:checks.length,errors},null,2)+'\n');console.log('DOM UI integration:',checks.length,'passed');
 for(const s of sockets)s.close();for(const x of windows)x.close();process.exit(0);
})().catch(e=>{console.error(e);for(const s of sockets)s.terminate();for(const w of windows)w.close();process.exit(1);});
