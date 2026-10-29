"""Real WebSocket/MySQL/Java workers/Docker checks on demo accounts.

Use with an isolated Compose project and --env-file. Never prints credentials.
Requires the demo bank and author, coder01..coder10 accounts.
"""
import argparse
import asyncio
import json
from pathlib import Path
import time
import uuid
import websockets

class Peer:
    def __init__(self,ws,user,url):self.ws=ws;self.user=user;self.url=url;self.token=None;self.lock=asyncio.Lock()
    async def call(self,kind,payload=None,rid=None):
        async with self.lock:
            rid=rid or str(uuid.uuid4())
            for retry in range(15):
                try:
                    await self.ws.send(json.dumps(dict(v=1,type=kind,requestId=rid,payload=payload or {})))
                    while True:
                        m=json.loads(await asyncio.wait_for(self.ws.recv(),35))
                        if m.get('requestId')==rid:
                            if not m.get('ok'):raise AssertionError((kind,m.get('error')))
                            assert 'receipt' not in m.get('data',{}) and 'certificate' not in m.get('data',{})
                            return m['data']
                except (websockets.ConnectionClosed,OSError,TimeoutError):
                    if not self.token:raise
                    await asyncio.sleep(2)
                    try:
                        self.ws=await websockets.connect(self.url,proxy=None,max_size=2**22)
                        auth=str(uuid.uuid4());await self.ws.send(json.dumps(dict(v=1,type='AUTH',requestId=auth,payload=dict(token=self.token))))
                        while True:
                            reply=json.loads(await self.ws.recv())
                            if reply.get('requestId')==auth:
                                assert reply.get('ok');break
                    except OSError:pass
            raise AssertionError('Could not reconnect '+self.user)

async def main(args):
    started=time.monotonic();config=dict(line.split('=',1) for line in Path(args.env_file).read_text().splitlines() if '=' in line and not line.startswith('#'))
    peers=[];checks=[];results=[];rooms={};answers={}
    async def connect(name):
        ws=await websockets.connect(args.url,proxy=None,max_size=2**22);p=Peer(ws,name,args.url);peers.append(p)
        data=await p.call('LOGIN',dict(username=name,password=config['DEMO_PASSWORD']))
        await p.call('AUTH',dict(token=data['token']));p.token=data['token'];p.uid=data['user']['id'];return p
    author=await connect('author');players=[await connect(f'coder{i:02}') for i in range(1,11)]
    async def heartbeat():
        while True:
            for p in peers:
                try:
                    await p.call('PING')
                    if p in rooms:await p.call('ROOM_TOUCH',dict(roomId=rooms[p]))
                    if p is not author:await p.call('MATCH_QUEUE_STATUS')
                except Exception:pass
            await asyncio.sleep(10)
    beat=asyncio.create_task(heartbeat())
    async def snapshot(host,rid):return await host.call('ROOM_SNAPSHOT',dict(roomId=rid))
    async def play(host,rid,group,forfeit=False):
        for p in group:rooms[p]=rid
        submitted=set();left=False
        for _ in range(240):
            r=await snapshot(host,rid)
            assert 'certificate' not in r and 'bank' not in r
            if r['state']=='FINISHED':
                assert len(r['results'])==len(group)
                for p in group:rooms.pop(p,None)
                return r
            assert r['state'] not in ('CLOSED','UNRESOLVED'),r.get('reason')
            if r['state']=='ROUND_ACTIVE' and r['current']['id'] not in submitted:
                if forfeit and not left:
                    await group[-1].call('ROOM_LEAVE',dict(roomId=rid));left=True
                    r=await snapshot(host,rid)
                pid=r['current']['problemId']
                if pid not in answers:answers[pid]=await author.call('QUESTION_EDIT',dict(id=pid))
                answer=answers[pid]['answer']
                alive={p['id'] for p in r['players'] if p['status']=='ALIVE'}
                allowed=set(r.get('tiePlayers',alive));submitted.add(r['current']['id'])
                async def submit(p):
                    fail=args.tied_losers and p.uid!=group[0].uid
                    payload=dict(roomId=rid,roundId=r['current']['id'],problemId=pid,source="raise RuntimeError('EXP policy smoke')\n" if fail else answer['sampleAnswer'],language='PY311' if fail else answer['language'])
                    return await p.call('SUBMIT',payload)
                await asyncio.gather(*(submit(p) for p in group if p.uid in alive and p.uid in allowed))
            await asyncio.sleep(1)
        raise AssertionError('Match did not finish within 240 seconds')
    try:
        for p in players:
            state=await p.call('SYNC')
            for r in state['rooms']:
                if r['state'] not in ['FINISHED','CLOSED','UNRESOLVED']:
                    if r.get('mode','PRACTICE')!='PRACTICE' and r['state'] in ['LOBBY','COUNTDOWN']:await p.call('MATCH_DECLINE')
                    elif any(x['id']==p.uid and x['status']=='ALIVE' for x in r['players']):await p.call('ROOM_LEAVE',dict(roomId=r['id']))
            if (await p.call('MATCH_QUEUE_STATUS'))['state']=='WAITING':await p.call('MATCH_QUEUE_CANCEL')
        problems=await author.call('PROBLEMS')
        assert len(problems)==320;checks.append('MySQL seeded exactly 320 distinct public problems')
        # Wait until worker validation has made at least four difficulty-1 problems eligible.
        for _ in range(120):
            eligible=[]
            for q in [q for q in problems if q['difficulty']==1][:8]:
                detail=await author.call('QUESTION_EDIT',dict(id=q['id']))
                if detail.get('validatedVersion')==detail['version']:eligible.append(detail)
            if len(eligible)>=4:break
            await asyncio.sleep(5)
        assert len(eligible)>=4;checks.append('Actual workers validated eligible references')
        group=players[8:10];r=await group[0].call('ROOM_CREATE',dict(mode='PRACTICE',capacity=2,name='V6 smoke practice',selectedDifficulties=[1]))
        rid=r['id'];await group[1].call('ROOM_JOIN',dict(roomId=r['code']));await group[0].call('ROOM_START',dict(roomId=rid))
        r=await play(group[0],rid,group);assert r['mode']=='PRACTICE';assert all(p['exp']==0 and p['ratingBefore']==p['ratingAfter'] for p in r['results'])
        results.append(dict(mode='PRACTICE',roomId=rid,players=2,results=r['results']));checks.append('Practice two-player game finished using real judge; no EXP or Elo')
        for mode in ['NORMAL','RANKED']:
            group=players[:5]
            for p in group[:4]:assert (await p.call('MATCH_QUEUE_JOIN',dict(mode=mode)))['state']=='WAITING'
            found=await group[4].call('MATCH_QUEUE_JOIN',dict(mode=mode));assert found['state']=='MATCH_FOUND';rid=found['roomId'];assert len(found['room']['players'])==5
            sixth=await players[5].call('MATCH_QUEUE_JOIN',dict(mode=mode));assert sixth['state']=='WAITING';await players[5].call('MATCH_QUEUE_CANCEL')
            for p in group[:4]:await p.call('MATCH_ACCEPT',dict(roomId=rid))
            assert (await snapshot(group[0],rid))['state']=='LOBBY'
            await group[4].call('MATCH_ACCEPT',dict(roomId=rid));assert (await snapshot(group[0],rid))['state']=='COUNTDOWN'
            r=await play(group[0],rid,group,forfeit=mode=='RANKED' and not args.tied_losers)
            assert len(r['participants'])==5
            for p in r['results']:
                tied=sum(other['placement']==p['placement'] for other in r['results'])
                assert p['exp']==120-20*(p['placement']+tied-1)
            if mode=='NORMAL':assert all(p['ratingAfter']==p['ratingBefore'] for p in r['results'])
            else:
                assert any(p['ratingAfter']!=p['ratingBefore'] for p in r['results'])
                if not args.tied_losers:assert next(p for p in r['results'] if p['userId']==group[-1].uid)['placement']==5
            if args.tied_losers:
                assert next(p for p in r['results'] if p['userId']==group[0].uid)['exp']==100
                assert all(p['placement']==2 and p['exp']==20 for p in r['results'] if p['userId']!=group[0].uid)
            for p in group:
                history=await p.call('MATCH_HISTORY');assert sum(h['room_id']==rid for h in history)==1
            results.append(dict(mode=mode,roomId=rid,players=5,results=r['results']))
            checks.append(mode+': four cannot start, five confirmations, sixth waits, judge settles once'+(' with four tied losers receiving 20 EXP each' if args.tied_losers else ' with retained forfeit' if mode=='RANKED' else ''))
        # Neither first AC nor repeated AC of standalone practice awards EXP.
        q=eligible[0];p=players[6];before=(await p.call('PROGRESSION_GET'))['exp']
        for _ in range(2):
            ack=await p.call('SUBMIT',dict(problemId=q['id'],source=q['answer']['sampleAnswer'],language=q['answer']['language']))
            for _ in range(120):
                status=await p.call('SUBMISSION_GET',dict(id=ack['id']))
                if status['status'] not in ['QUEUED','RUNNING']:break
                await asyncio.sleep(1)
            assert status['status']=='AC'
        assert (await p.call('PROGRESSION_GET'))['exp']==before;checks.append('First and repeated independent AC do not award EXP')
        report=dict(kind='Real WebSocket + MySQL 8.4 + Java workers + Docker sandbox',checks=checks,matches=results,elapsed_seconds=round(time.monotonic()-started,2))
        Path(args.output).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps(dict(checks=checks,matches=len(results),elapsed_seconds=report['elapsed_seconds']),ensure_ascii=False,indent=2))
    finally:
        beat.cancel()
        await asyncio.gather(*(p.ws.close() for p in peers),return_exceptions=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--url',default='ws://server:8080/ws');p.add_argument('--env-file',default='.env');p.add_argument('--tied-losers',action='store_true');p.add_argument('--output',default='statics/results/survival-v6-smoke.json');asyncio.run(main(p.parse_args()))
