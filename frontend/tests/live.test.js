import test from 'node:test';
import assert from 'node:assert/strict';

const values=new Map();
globalThis.sessionStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
globalThis.location={protocol:'http:',host:'localhost:8080'};
class Socket {
 constructor(){this.readyState=1;this.closed=false;}
 send(){}
 close(){this.closed=true;}
}
globalThis.WebSocket=Socket;
const {LiveClient}=await import('../src/lib/live.js');

test('ending a session rejects queued mutations before another account can reconnect',async()=>{
 const client=new LiveClient();client.token='old';
 const pending=client.raw('SUBMIT',{source:'old account'});
 client.clearAuth();
 await assert.rejects(pending,/Phiên đăng nhập/);
 assert.equal(client.pending.size,0);assert.equal(client.token,null);
});
test('a transient reconnect failure preserves credentials and retries the socket',async()=>{
 const client=new LiveClient();client.token='saved';
 client.raw=async()=>{throw Error('temporary disconnect');};
 client.connect();await client.ws.onopen();clearInterval(client.heartbeat);
 assert.equal(client.token,'saved');assert.equal(client.ws.closed,true);
});
test('an explicit authentication failure clears the expired session',async()=>{
 const client=new LiveClient();client.token='expired';
 client.raw=async()=>{throw Object.assign(Error('expired'),{code:'AUTH'});};
 client.connect();await client.ws.onopen();clearInterval(client.heartbeat);
 assert.equal(client.token,null);assert.equal(client.status,'anonymous');
});
test('reconnecting retains the replay cursor rather than jumping to the event head',async()=>{
 const client=new LiveClient();client.token='saved';client.cursor=4;
 client.raw=async()=>({headSeq:10});
 client.connect();await client.ws.onopen();clearInterval(client.heartbeat);
 assert.equal(client.cursor,4);assert.equal(client.status,'online');
});
test('fresh sign-in saves the server event head for subsequent reconnects',async()=>{
 const client=new LiveClient();client.ws=new Socket();
 client.raw=async type=>type==='AUTH'?{headSeq:30}:{token:'new',user:{id:'coder'}};
 assert.deepEqual(await client.signIn('LOGIN',{}),{id:'coder'});
 assert.equal(client.cursor,30);assert.equal(values.get('cg-cursor'),'30');
});
