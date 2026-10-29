"""Run against the isolated demo project; restart its server after READY_FOR_RESTART."""
import argparse,asyncio,json,hashlib,time
from pathlib import Path
import websockets
from survival_smoke import Peer
async def main(args):
    config=dict(l.split('=',1) for l in Path(args.env_file).read_text().splitlines() if '=' in l and not l.startswith('#'))
    ws=await websockets.connect(args.url,proxy=None,max_size=2**22);p=Peer(ws,'coder10',args.url)
    try:
        data=await p.call('LOGIN',dict(username='coder10',password=config['DEMO_PASSWORD']));p.token=data['token'];await p.call('AUTH',dict(token=p.token))
        def identity(bank):return sorted((q['id'],q['publicId'],q['version']) for q in bank)
        before=identity(await p.call('PROBLEMS'));assert len(before)==320
        queued=await p.call('MATCH_QUEUE_JOIN',dict(mode='NORMAL'));assert queued['state']=='WAITING'
        print('READY_FOR_RESTART',flush=True);await asyncio.sleep(15)
        after=identity(await p.call('PROBLEMS'));queue=await p.call('MATCH_QUEUE_STATUS')
        assert before==after and queue['state']=='WAITING' and queue['joinedAt']==queued['joinedAt']
        await p.call('MATCH_QUEUE_CANCEL')
        report=dict(kind='Real server restart with MySQL-backed session and queue',problems=len(before),same_ids_codes_versions=True,queue_restored=True,joined_at_preserved=True,bank_fingerprint=hashlib.sha256(json.dumps(before).encode()).hexdigest())
        Path(args.output).write_text(json.dumps(report,indent=2)+'\n');print('Restart verification passed',flush=True)
    finally:await p.ws.close()
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--url',default='ws://server:8080/ws');p.add_argument('--env-file',default='.env');p.add_argument('--output',default='statics/results/restart-v6.json');asyncio.run(main(p.parse_args()))
