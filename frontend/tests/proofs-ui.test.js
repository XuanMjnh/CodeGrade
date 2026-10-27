import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
const {buildSync}=createRequire(require.resolve('vite/package.json'))('esbuild');
globalThis.localStorage={getItem:()=>null};
globalThis.sessionStorage={getItem:()=>null};
globalThis.document={documentElement:{lang:'vi'}};
const bundled=buildSync({entryPoints:['src/components/SignedProof.jsx'],bundle:true,platform:'node',format:'cjs',external:['react'],write:false}).outputFiles[0].text;
const module={exports:{}};new Function('require','module','exports',bundled)(require,module,module.exports);
const SignedProof=module.exports.default;
const envelope=payload=>({payload:JSON.stringify(payload),signature:'fixture',publicKey:'fixture'});
const render=props=>renderToStaticMarkup(React.createElement(SignedProof,props));

test('receipt renders readable admission details and keeps raw verification fields in a disclosure',()=>{
 const html=render({kind:'receipt',expectedId:'s1',envelope:envelope({submissionId:'s1',receivedAt:1700000000000,admissionOrder:7,language:'CPP17',sourceHash:'abc',roundId:'r1'})});
 assert.match(html,/Biên nhận nộp bài/);assert.match(html,/C\+\+ 17/);assert.match(html,/#7/);assert.match(html,/kết quả đúng hay sai/);assert.match(html,/<details[^>]*class="proof-technical"/);assert.doesNotMatch(html,/<details[^>]*\bopen/);assert.match(html,/Tải bản có chữ ký/);assert.doesNotMatch(html,/Chữ ký khớp/);
});
test('certificate shows participant names, plain-language verdicts, deadline checks and totals',()=>{
 const html=render({kind:'certificate',players:[{id:'u1',name:'<img src=x onerror=alert(1)>'}],rounds:[{id:'r1',number:2}],envelope:envelope({roundId:'r1',deadline:1700000000000,state:'ROUND_RESULT',admitted:[{id:'s1',user_id:'u1',received_at:1699999999999,admission_order:1,status:'AC',score:100},{id:'s2',user_id:'u1',received_at:1700000000001,admission_order:2,status:'TLE',score:0}]})});
 assert.match(html,/Chứng thư vòng đấu/);assert.match(html,/Vòng 2/);assert.match(html,/Đúng tất cả test/);assert.match(html,/Quá thời gian/);assert.match(html,/Trong hạn/);assert.match(html,/Sau hạn/);assert.match(html,/1\/2/);assert.match(html,/&lt;img/);assert.doesNotMatch(html,/<img/);
});
test('a receipt for another submission and malformed evidence render an error instead of a misleading summary',()=>{
 const html=render({kind:'receipt',expectedId:'s2',envelope:envelope({submissionId:'s1',receivedAt:1700000000000,admissionOrder:1})});
 assert.match(html,/role="alert"/);assert.match(html,/không thuộc bài nộp đang xem/);assert.doesNotMatch(html,/XÁC NHẬN TIẾP NHẬN/);
 assert.match(render({kind:'certificate',envelope:envelope({roundId:'r1',deadline:0,admitted:[]})}),/role="alert"/);
});
