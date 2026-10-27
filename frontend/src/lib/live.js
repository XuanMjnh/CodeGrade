// Raw JSON/WebSocket v1. Retrying a mutation always reuses requestId + payload.
export class LiveClient {
 constructor(){
  this.pending=new Map(); this.listeners=new Set(); this.states=new Set();
  this.token=sessionStorage.getItem('cg-token'); this.cursor=Number(sessionStorage.getItem('cg-cursor')||0);
  this.delay=500; this.ready=false; this.offset=0;
 }
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 onState(fn){this.states.add(fn);return()=>this.states.delete(fn);}
 state(value){this.status=value;this.states.forEach(fn=>fn(value));}
 connect(){
  if(this.ws&&(this.ws.readyState===0||this.ws.readyState===1))return;
  this.state('connecting');
  this.ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws');
  this.ws.onopen=async()=>{
   this.delay=500;
   try{
    if(this.token){const auth=await this.raw('AUTH',{token:this.token,lastSeq:this.cursor});this.cursor=Math.min(this.cursor,auth.headSeq||0);sessionStorage.setItem('cg-cursor',String(this.cursor));}
    this.ready=true; this.state(this.token?'online':'anonymous');
    for(const p of this.pending.values()) if(p.type!=='AUTH') this.transmit(p);
    this.listeners.forEach(fn=>fn({event:'connected'}));
   }catch(e){if(e.code)this.clearAuth();else this.ws.close();}
  };
  this.ws.onmessage=e=>{
   let m;try{m=JSON.parse(e.data);}catch{this.ws.close();return;}
   if(m.serverTime)this.offset=m.serverTime-Date.now();
   if(m.type==='ACK'){
    const p=this.pending.get(m.requestId);if(!p)return;
    clearTimeout(p.timer);this.pending.delete(m.requestId);
    m.ok?p.resolve(m.data):p.reject(Object.assign(Error(m.error?.message||'Lỗi yêu cầu'),{code:m.error?.code}));
   }else if(m.type==='EVENT'){
    if(m.seq<=this.cursor)return;
    this.cursor=m.seq;sessionStorage.setItem('cg-cursor',String(this.cursor));
    if(m.event==='session_revoked')this.clearAuth();
    this.listeners.forEach(fn=>fn(m));
   }
  };
  this.ws.onclose=()=>{
   this.ready=false;this.state('offline');
   clearTimeout(this.reconnect);this.reconnect=setTimeout(()=>this.connect(),this.delay);
   this.delay=Math.min(this.delay*2,10000);
  };
  this.ws.onerror=()=>this.ws.close();
  clearInterval(this.heartbeat);this.heartbeat=setInterval(()=>{if(this.ready)this.raw('PING',{}).catch(()=>this.ws.close());},15000);
 }
 transmit(p){
  if(this.ws?.readyState===1)this.ws.send(JSON.stringify({v:1,type:p.type,requestId:p.id,payload:p.payload}));
 }
 raw(type,payload={},id=crypto.randomUUID()){
  return new Promise((resolve,reject)=>{
   const p={id,type,payload,resolve,reject};this.pending.set(id,p);
   p.timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Chưa nhận ACK. Có thể mất kết nối; thử lại cùng thao tác trong lịch sử.'));},30000);
   this.transmit(p);
  });
 }
 call(type,payload={},id=crypto.randomUUID()){
  if(!this.ready||!this.token)return Promise.reject(Error('Đang kết nối lại. Vui lòng chờ trạng thái Online.'));
  return this.raw(type,payload,id);
 }
 async signIn(type,payload){
  if(this.ws?.readyState!==1)throw Error('Máy chủ chưa kết nối.');
  const data=await this.raw(type,payload);
  this.token=data.token;this.cursor=0;sessionStorage.setItem('cg-token',data.token);sessionStorage.removeItem('cg-cursor');
  const auth=await this.raw('AUTH',{token:this.token});this.cursor=auth.headSeq||0;sessionStorage.setItem('cg-cursor',String(this.cursor));this.ready=true;this.state('online');return data.user;
 }
 clearAuth(){this.token=null;sessionStorage.removeItem('cg-token');sessionStorage.removeItem('cg-cursor');this.cursor=0;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('Phiên đăng nhập đã kết thúc.'));}this.pending.clear();this.state('anonymous');this.listeners.forEach(fn=>fn({event:'logged_out'}));}
 async logout(){try{await this.call('LOGOUT');}finally{this.clearAuth();}}
}
export const live=new LiveClient();
