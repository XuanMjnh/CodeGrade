// Current built React bundle + JSDOM + actual WebSocket/MySQL server. No CSS layout assertions.
const fs=require('node:fs'),path=require('node:path'),WS=require('ws'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'../..'),base=process.env.CG_UI_URL||'http://localhost:18080';
if(!process.env.CG_ENV_FILE)throw Error('Set CG_ENV_FILE to the isolated demo environment file.');
const config=Object.fromEntries(fs.readFileSync(process.env.CG_ENV_FILE,'utf8').split(/\r?\n/).filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')),l.slice(l.indexOf('=')+1)]));
const html=fs.readFileSync(path.join(root,'frontend/dist/index.html'),'utf8'),asset=html.match(/src="([^"]+\.js)"/)[1],code=fs.readFileSync(path.join(root,'frontend/dist',asset),'utf8');
const sockets=[],windows=[],errors=[],checks=[];const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(fn,label){for(let i=0;i<200;i++){if(fn())return;await delay(100);}throw Error('Timeout: '+label);}
function click(w,text){const b=[...w.document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);if(!b)throw Error('Button missing: '+text);b.click();}
function put(w,el,value){const proto=el.tagName==='SELECT'?w.HTMLSelectElement.prototype:w.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));}
function boot(){
 const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.startsWith('Not implemented: navigation'))errors.push(e.message);});
 const w=new JSDOM(html,{url:base,runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}).window;windows.push(w);
 w.ResizeObserver=class{observe(){} unobserve(){} disconnect(){}};w.matchMedia=()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});w.Range.prototype.getClientRects=()=>[];w.Range.prototype.getBoundingClientRect=()=>({left:0,right:0,top:0,bottom:0,width:0,height:0});
 w.fetch=(url,opts)=>fetch(new URL(url,base),opts);w.structuredClone=structuredClone;w.crypto.randomUUID=()=>require('node:crypto').randomUUID();
 w.WebSocket=class extends WS{constructor(...a){super(...a);sockets.push(this);}};w.confirm=()=>true;w.localStorage.setItem('cg-locale','vi');w.eval(code);return w;
}
async function login(w,user){await wait(()=>w.document.querySelector('input[autocomplete=username]')&&!w.document.querySelector('button[type=submit]').disabled,'login ready');put(w,w.document.querySelector('input[autocomplete=username]'),user);await delay(100);put(w,w.document.querySelector('input[type=password]'),config.DEMO_PASSWORD);await delay(100);click(w,'Đăng nhập');try{await wait(()=>w.document.querySelector('.practice-banner'),'login '+user);}catch(e){throw Error(e.message+'; '+w.document.querySelector('.auth-card')?.textContent);}}
(async()=>{
 try{
  const w=boot();await login(w,'coder08');w.location.hash='/survival';await wait(()=>w.document.querySelectorAll('.mode-card').length===3,'three modes');checks.push('Real authentication and three mode choices');
  await wait(()=>w.document.querySelector('.progression-strip progress'),'official progression');checks.push('Official EXP, level, rank and rating render');
  w.document.querySelectorAll('.mode-card')[2].click();await wait(()=>w.document.querySelector('.matchmaking-panel'),'ranked panel');
  if(!w.document.querySelector('.matchmaking-panel').textContent.includes('5/5'))throw Error('Missing five-player target');
  click(w,'Tìm trận Ranked');await wait(()=>w.document.body.textContent.includes('Đang tìm đủ 5 người chơi phù hợp'),'ranked waiting');
  if([...w.document.querySelectorAll('button')].some(b=>b.textContent.includes('Tạo phòng')))throw Error('Ranked manual create');click(w,'Hủy tìm trận');await wait(()=>!w.document.body.textContent.includes('Đang tìm đủ 5 người chơi phù hợp'),'ranked cancelled');checks.push('Ranked queue joins, waits for five, cancels, and has no manual room creation');
  w.document.querySelectorAll('.mode-card')[1].click();await delay(100);click(w,'Tìm trận');await wait(()=>w.document.body.textContent.includes('Đang tìm đủ 5 người chơi phù hợp'),'normal waiting');click(w,'Hủy tìm trận');await wait(()=>!w.document.body.textContent.includes('Đang tìm đủ 5 người chơi phù hợp'),'normal cancelled');checks.push('Normal queue joins and cancels against live backend');
  w.document.querySelectorAll('.mode-card')[0].click();await delay(100);const select=w.document.querySelector('#main-content select');const options=[...select.options].map(x=>x.value);if(options.join(',')!=='2,3,4,5,6,7,8,9,10')throw Error('Capacity options');put(w,select,'2');await delay(100);click(w,'Tạo phòng →');await wait(()=>w.document.querySelector('.invite-code'),'created practice');const invite=w.document.querySelector('.invite-code').textContent;
  const other=boot();await login(other,'coder09');other.location.hash='/room/'+invite;await wait(()=>other.document.querySelectorAll('.player').length===2,'join by code');checks.push('Practice capacities 2–10, room creation and second account joining by invite');
  const name=[...w.document.querySelectorAll('.room-status label')].find(l=>l.textContent.startsWith('Tên phòng'))?.querySelector('input');if(!name)throw Error('Host name configuration missing');put(w,name,'DOM V6 practice');await delay(100);click(w,'Lưu cấu hình phòng');await wait(()=>other.document.querySelector('h1').textContent.includes('DOM V6 practice'),'config broadcast');checks.push('Host configuration broadcasts to another live client');
  if(other.document.querySelector('.room-status button.ghost:not(.danger-text)'))throw Error('Non-host config controls');
  click(w,'Rời phòng / bỏ cuộc');await wait(()=>w.document.querySelector('.survival-modes'),'host leaves');click(other,'Rời phòng / bỏ cuộc');await wait(()=>other.document.querySelector('.survival-modes'),'other leaves');
  if(/Ed25519|biên nhận|chứng thư/i.test(w.document.querySelector('main').textContent))throw Error('Retired proof UI');checks.push('Retired proof UI absent and lobby leave releases memberships');
  if(errors.length)throw Error(errors.join('; '));
  const report={kind:'JSDOM current React bundle + real WebSocket/MySQL server; not native browser layout verification',checks,passed:checks.length,errors};fs.writeFileSync(path.join(root,'statics/results/survival-v6-ui.json'),JSON.stringify(report,null,2)+'\n');console.log('Live DOM UI:',checks.length,'checks passed');
 }finally{for(const s of sockets)s.terminate();for(const w of windows)w.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
