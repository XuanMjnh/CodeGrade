const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('crypto'),fs=require('fs'),os=require('os'),path=require('path'),cp=require('child_process');
const keys=crypto.generateKeyPairSync('ed25519');const publicKey=keys.publicKey.export({format:'der',type:'spki'}).toString('base64');
function envelope(p){const payload=JSON.stringify(p);return {payload,publicKey,signature:crypto.sign(null,Buffer.from(payload),keys.privateKey).toString('base64')};}
function run(manifest,receipt){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'receipt-test-'));try{fs.writeFileSync(path.join(dir,'key'),publicKey);fs.writeFileSync(path.join(dir,'m'),JSON.stringify(manifest));fs.writeFileSync(path.join(dir,'r'),JSON.stringify(receipt));return cp.spawnSync(process.execPath,[path.join(__dirname,'verify_certificate.cjs'),path.join(dir,'m'),path.join(dir,'key'),path.join(dir,'r')]).status;}finally{fs.rmSync(dir,{recursive:true,force:true});}}
const receipt=envelope({submissionId:'s1',roundId:'r1',receivedAt:100});
test('valid on-time receipt is present',()=>assert.equal(run(envelope({roundId:'r1',deadline:200,admitted:[{id:'s1'}]}),receipt),0));
test('signed omission is detected',()=>assert.notEqual(run(envelope({roundId:'r1',deadline:200,admitted:[]}),receipt),0));
test('tampered manifest is rejected',()=>{const m=envelope({roundId:'r1',deadline:200,admitted:[{id:'s1'}]});m.payload=m.payload.replace('200','300');assert.notEqual(run(m,receipt),0);});
