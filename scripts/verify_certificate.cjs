// Usage: node scripts/verify_certificate.cjs certificate.json trusted-key-spki-base64.txt [receipt.json]
const fs=require('fs'),crypto=require('crypto');
const [certificatePath,keyPath,receiptPath]=process.argv.slice(2);
if(!certificatePath||!keyPath)throw Error('Provide certificate JSON and the trusted SPKI Base64 key file.');
const trusted=fs.readFileSync(keyPath,'utf8').trim();
function verify(p){if(p.publicKey!==trusted)throw Error('Untrusted signing key');const key=crypto.createPublicKey({key:Buffer.from(trusted,'base64'),format:'der',type:'spki'});if(!crypto.verify(null,Buffer.from(p.payload,'utf8'),key,Buffer.from(p.signature,'base64')))throw Error('Invalid signature');return JSON.parse(p.payload);}
const manifest=verify(JSON.parse(fs.readFileSync(certificatePath,'utf8')));
if(receiptPath){const receipt=verify(JSON.parse(fs.readFileSync(receiptPath,'utf8')));if(receipt.roundId!==manifest.roundId)throw Error('Different rounds');if(receipt.receivedAt>manifest.deadline)throw Error('Receipt after deadline');if(!manifest.admitted.some(x=>x.id===receipt.submissionId))throw Error('On-time submission omitted from manifest');}
console.log('Verified');
