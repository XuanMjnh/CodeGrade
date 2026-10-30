import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {fileURLToPath} from 'node:url';

const frontendDir=fileURLToPath(new URL('..',import.meta.url));
const bundle=await build({stdin:{contents:`import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import ProgressionStrip from './src/components/ProgressionStrip.jsx';window.renderStats=(stats,showRankGuide=true)=>renderToStaticMarkup(<ProgressionStrip stats={stats} user={{displayName:'Coder'}} showRankGuide={showRankGuide}/>);`,resolveDir:frontendDir,loader:'jsx'},bundle:true,write:false,format:'iife',plugins:[{name:'progression-fixture',setup(b){
 b.onResolve({filter:/lib\/locale$/},()=>({path:'locale',namespace:'fixture'}));
 b.onResolve({filter:/^\.\/ui$/},()=>({path:'ui',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({loader:'jsx',resolveDir:frontendDir,contents:a.path==='locale'?'export const t=s=>s;':`import React from 'react';export const Badge=p=><span>{p.children}</span>;`}));
}}]});

const names=['Đồng','Bạc','Vàng','Bạch Kim','Kim Cương','Cao Thủ'];
function stats(thresholds=[1100,1300,1500,1700,1900]){
 return {level:1,exp:0,nextLevelExp:100,rank:'Đồng',rating:1000,avatarFrame:'basic',badges:[],rankMinRating:null,nextRank:'Bạc',nextRankRating:thresholds[0],ratingToNextRank:thresholds[0]-1000,ratingGainMultiplier:3,rankTiers:names.map((name,i)=>({name,minRating:i?thresholds[i-1]:null,maxRating:i<5?thresholds[i]-1:null,gainMultiplier:[3,2,1.5,1,1,1][i]}))};
}
function render(data,showGuide=true){
 const dom=new JSDOM('',{runScripts:'outside-only'});
 dom.window.TextEncoder=TextEncoder;dom.window.TextDecoder=TextDecoder;
 dom.window.eval(bundle.outputFiles[0].text);dom.window.document.body.innerHTML=dom.window.renderStats(data,showGuide);
 return dom;
}

test('rank guide shows all rating ranges, gain boosts and the remaining promotion target',()=>{
 const dom=render(stats());try{
  const doc=dom.window.document;
  assert.deepEqual([...doc.querySelectorAll('.rank-rating-range')].map(e=>e.textContent),['Dưới 1100 rating','1100–1299 rating','1300–1499 rating','1500–1699 rating','1700–1899 rating','Từ 1900 rating']);
  assert.match(doc.querySelector('.rank-next-target').textContent,/Còn thiếu 100 rating để lên Bạc/);
  assert.match(doc.querySelector('.rank-next-target').textContent,/1100 rating/);
  assert.deepEqual([...doc.querySelectorAll('.rank-gain-badge')].map(e=>e.textContent),['×3 điểm tăng','×2 điểm tăng','×1.5 điểm tăng']);
  assert.equal(doc.querySelectorAll('.progression-rank-guide .is-current').length,1);
 }finally{dom.window.close();}
});

test('custom server thresholds are reflected without a second frontend rank table',()=>{
 const dom=render(stats([1050,1200,1400,1700,2000]));try{
  const doc=dom.window.document;
  assert.match(doc.querySelector('.rank-next-target').textContent,/Còn thiếu 50 rating để lên Bạc/);
  assert.match(doc.querySelectorAll('.rank-rating-range')[1].textContent,/1050–1199 rating/);
  assert.match(doc.querySelectorAll('.rank-rating-range')[5].textContent,/Từ 2000 rating/);
  assert.equal(doc.querySelector('.rank-next-target progress').max,1050);
 }finally{dom.window.close();}
});

test('highest rank has no nonexistent promotion target or gain boost',()=>{
 const dom=render({...stats(),rank:'Cao Thủ',rating:2000,rankMinRating:1900,nextRank:null,nextRankRating:null,ratingToNextRank:0,ratingGainMultiplier:1},false);try{
  const doc=dom.window.document;
  assert.match(doc.querySelector('.rank-highest').textContent,/rank cao nhất/);
  assert.equal(doc.querySelector('.rank-next-target'),null);
  assert.equal(doc.querySelector('.rank-gain-support'),null);
  assert.equal(doc.querySelector('.progression-rank-guide'),null);
 }finally{dom.window.close();}
});
