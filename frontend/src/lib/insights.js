// Summaries only use records visible to the current account.
export function practiceInsights(problems=[]){
 const categories=new Map();
 for(const p of problems){const key=p.category_id||p.category;const c=categories.get(key)||{id:key,name:p.category,total:0,solved:0};c.total++;if(p.solved)c.solved++;categories.set(key,c);}
 return {total:problems.length,solved:problems.filter(p=>p.solved).length,starred:problems.filter(p=>p.starred).length,categories:[...categories.values()].sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi')),next:problems.filter(p=>!p.solved).sort((a,b)=>a.difficulty-b.difficulty||String(a.title).localeCompare(String(b.title),'vi')).slice(0,3)};
}
export function submissionInsights(rows=[]){
 const official=rows.filter(s=>s.mode==='OFFICIAL');const pending=official.filter(s=>['QUEUED','RUNNING'].includes(s.status)).length;const ac=official.filter(s=>s.status==='AC').length;const judged=official.filter(s=>!['QUEUED','RUNNING','SE'].includes(s.status));
 return {total:official.length,pending,ac,rate:judged.length?Math.round(ac/judged.length*100):null,verdicts:[...new Set(official.map(s=>s.status))].map(status=>({status,count:official.filter(s=>s.status===status).length})),languages:[...new Set(official.map(s=>s.language))].map(language=>({language,count:official.filter(s=>s.language===language).length})),best:judged.length?Math.max(...judged.map(s=>Number(s.score)||0)):null};
}
export function contestState(c,now){if(c.settled)return 'finished';if(now<c.startsAt)return 'upcoming';if(now<c.endsAt)return 'live';return 'grading';}
export function contestInsights(contests=[],now,userId){return {upcoming:contests.filter(c=>contestState(c,now)==='upcoming').length,live:contests.filter(c=>contestState(c,now)==='live').length,joined:contests.filter(c=>(c.participants||[]).includes(userId)).length,pending:contests.filter(c=>(c.pending||[]).includes(userId)).length,next:contests.filter(c=>contestState(c,now)==='upcoming').sort((a,b)=>a.startsAt-b.startsAt)[0]};}
