// Display signed evidence without changing the original payload used for verification.
export function parseProof(envelope,kind){
 if(typeof envelope?.payload!=='string'||typeof envelope.signature!=='string'||!envelope.signature||typeof envelope.publicKey!=='string'||!envelope.publicKey)throw Error('Bằng chứng không đầy đủ hoặc không đọc được.');
 let payload;try{payload=JSON.parse(envelope.payload);}catch{throw Error('Bằng chứng không đầy đủ hoặc không đọc được.');}
 const object=payload&&typeof payload==='object'&&!Array.isArray(payload);
 if(!object)throw Error('Bằng chứng không đầy đủ hoặc không đọc được.');
 if(kind==='receipt'){
  if(typeof payload.submissionId!=='string'||!payload.submissionId||!validTime(payload.receivedAt)||!Number.isSafeInteger(payload.admissionOrder)||payload.admissionOrder<1)throw Error('Biên nhận thiếu thông tin tiếp nhận bài.');
 }else if(kind==='certificate'){
  if(typeof payload.roundId!=='string'||!payload.roundId||!validTime(payload.deadline)||!Array.isArray(payload.admitted)||payload.admitted.some(row=>!row||typeof row.id!=='string'||typeof row.user_id!=='string'||!validTime(row.received_at)||!Number.isFinite(row.score)||typeof row.status!=='string'))throw Error('Chứng thư thiếu thông tin vòng đấu.');
 }else throw Error('Loại bằng chứng không hợp lệ.');
 return payload;
}

function validTime(value){return Number.isSafeInteger(value)&&value>0&&Number.isFinite(new Date(value).getTime());}

export function certificateStats(payload){
 return {submissions:payload.admitted.length,players:new Set(payload.admitted.map(row=>row.user_id)).size,accepted:payload.admitted.filter(row=>row.status==='AC').length,onTime:payload.admitted.filter(row=>row.received_at<=payload.deadline).length};
}

function decode(value){
 if(typeof value!=='string'||!value||!/^[-A-Za-z0-9+/=]+$/.test(value))throw Error('Invalid encoding');
 return Uint8Array.from(atob(value),c=>c.charCodeAt(0));
}

export async function verifyProofSignature(envelope,subtle=globalThis.crypto?.subtle){
 if(!subtle)return 'unavailable';
 try{
  const key=await subtle.importKey('spki',decode(envelope.publicKey),{name:'Ed25519'},false,['verify']);
  return await subtle.verify({name:'Ed25519'},key,decode(envelope.signature),new TextEncoder().encode(envelope.payload))?'valid':'invalid';
 }catch(error){return error?.name==='NotSupportedError'?'unavailable':'invalid';}
}
