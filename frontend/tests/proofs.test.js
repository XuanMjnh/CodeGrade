import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,webcrypto} from 'node:crypto';
import {parseProof,certificateStats,verifyProofSignature} from '../src/lib/proofs.js';

const keys=generateKeyPairSync('ed25519');
const receipt={submissionId:'s1',roundId:'r1',receivedAt:1700000000000,admissionOrder:3,language:'CPP17',sourceHash:'a'.repeat(64)};
function envelope(data){const payload=typeof data==='string'?data:JSON.stringify(data);return {payload,signature:sign(null,Buffer.from(payload),keys.privateKey).toString('base64'),publicKey:keys.publicKey.export({format:'der',type:'spki'}).toString('base64')};}

test('receipt display keeps the signed payload unchanged and distinct from a verdict',()=>{
 const proof=envelope(receipt),original=proof.payload;
 assert.deepEqual(parseProof(proof,'receipt'),receipt);assert.equal(proof.payload,original);assert.equal(parseProof(proof,'receipt').status,undefined);
});
test('certificate overview counts submissions, unique people, AC and on-time admissions separately',()=>{
 const data={roundId:'r1',deadline:1700000000000,admitted:[{id:'a',user_id:'u1',received_at:1699999999999,status:'WA',score:40},{id:'b',user_id:'u1',received_at:1700000000000,status:'AC',score:100},{id:'c',user_id:'u2',received_at:1700000000001,status:'TLE',score:0}]};
 assert.deepEqual(certificateStats(parseProof(envelope(data),'certificate')),{submissions:3,players:2,accepted:1,onTime:2});
 assert.deepEqual(certificateStats({...data,admitted:[]}),{submissions:0,players:0,accepted:0,onTime:0});
});
test('malformed evidence and out-of-range dates fail before rendering',()=>{
 for(const proof of [{},envelope('null'),envelope('[]'),envelope('{bad json'),envelope({...receipt,receivedAt:Number.MAX_SAFE_INTEGER}),envelope({...receipt,admissionOrder:0})])assert.throws(()=>parseProof(proof,'receipt'));
 assert.throws(()=>parseProof(envelope({roundId:'r1',deadline:10,admitted:[{id:'s1',user_id:'u1',received_at:0,status:'AC',score:100}]}),'certificate'));
 assert.throws(()=>parseProof({...envelope(receipt),publicKey:{}},'receipt'));
});
test('browser verifier checks the original UTF-8 payload rather than reserialized JSON',async()=>{
 const raw='{ "submissionId": "s1", "receivedAt": 1700000000000, "name": "Nguyễn Kiên" }';
 const proof=envelope(raw);assert.equal(await verifyProofSignature(proof,webcrypto.subtle),'valid');
 assert.equal(await verifyProofSignature({...proof,payload:JSON.stringify(JSON.parse(raw))},webcrypto.subtle),'invalid');
});
test('tampered payload, wrong signing key and malformed signature never appear verified',async()=>{
 const proof=envelope(receipt),other=generateKeyPairSync('ed25519');
 assert.equal(await verifyProofSignature({...proof,payload:proof.payload.replace('CPP17','CPP20')},webcrypto.subtle),'invalid');
 assert.equal(await verifyProofSignature({...proof,publicKey:other.publicKey.export({format:'der',type:'spki'}).toString('base64')},webcrypto.subtle),'invalid');
 assert.equal(await verifyProofSignature({...proof,signature:'invalid!'},webcrypto.subtle),'invalid');
});
test('unsupported browser crypto is explicitly unverified',async()=>{
 assert.equal(await verifyProofSignature(envelope(receipt),null),'unavailable');
 assert.equal(await verifyProofSignature(envelope(receipt),{importKey(){throw Object.assign(Error(),{name:'NotSupportedError'});}}),'unavailable');
});
