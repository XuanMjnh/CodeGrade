"""Real Java-worker + Docker smoke test. pip install websockets==15.0.1
Run from project root after compose starts: python scripts/judge_smoke.py
Reads local demo password without printing secrets. Never executes user code locally.
"""
import argparse
import asyncio
import json
import os
import time
import uuid
from pathlib import Path
import websockets

async def request(ws,kind,payload):
    rid=str(uuid.uuid4())
    await ws.send(json.dumps(dict(v=1,type=kind,requestId=rid,payload=payload)))
    while True:
        m=json.loads(await asyncio.wait_for(ws.recv(),30))
        if m.get("requestId")==rid:
            if not m.get("ok"): raise RuntimeError(m.get("error"))
            return m["data"]

async def main(args):
    config={}
    envfile=Path(__file__).resolve().parents[1]/".env"
    if envfile.exists():
        config=dict(line.split("=",1) for line in envfile.read_text().splitlines() if "=" in line and not line.startswith("#"))
    password=os.environ.get(args.password_env,config.get(args.password_env,""))
    if not password: raise RuntimeError("Set "+args.password_env+" or generate demo .env first")
    async with websockets.connect(args.url,proxy=None,max_size=2**20) as ws:
        login=await request(ws,"LOGIN",dict(username=args.username,password=password))
        await request(ws,"AUTH",dict(token=login["token"]))
        problems=await request(ws,"PROBLEMS",dict(search=""))
        problem=next((p for p in problems if p["id"]==args.problem_id),None) if args.problem_id else next((p for p in problems if p["title"] in ("Tổng hai số","A + B")),None)
        if not problem: raise RuntimeError("Không tìm thấy bài Tổng hai số; dùng --problem-id để chọn bài tương đương")
        cpp='#include <iostream>\nint main(){long long a,b;std::cin>>a>>b;std::cout<<a+b<<"\\n";}\n'
        cases=[("CPP11",cpp,"AC"),("CPP17",cpp,"AC"),("CPP20",cpp,"AC"),
               ("PY311","a,b=map(int,input().split()); print(a+b)\n","AC"),
               ("PY311","print('wrong')\n","WA"),("PY311","def invalid syntax\n","CE"),
               ("PY311","while True: pass\n","TLE")]
        measured=[]
        for language,source,expected in cases:
            begin=time.perf_counter()
            ack=await request(ws,"SUBMIT",dict(problemId=problem["id"],language=language,source=source))
            for _ in range(360):
                result=await request(ws,"SUBMISSION_GET",dict(id=ack["id"]))
                if result["status"] not in ("QUEUED","RUNNING"): break
                await asyncio.sleep(.5)
            else: raise RuntimeError("Worker timeout: check compose logs worker")
            measured.append(dict(language=language,expected=expected,actual=result["status"],elapsed_seconds=time.perf_counter()-begin,submissionId=ack["id"]))
            if result["status"]!=expected: raise AssertionError(measured[-1])
            print(language,expected,"passed",flush=True)
    out=Path(args.output);out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(dict(kind="real Docker judge smoke results",results=measured),indent=2)+"\n")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--url",default="ws://localhost:8080/ws")
    p.add_argument("--username",default="coder01")
    p.add_argument("--problem-id",help="UUID bài tính tổng hai số nếu kho đề đã đổi tên")
    p.add_argument("--password-env",default="DEMO_PASSWORD")
    p.add_argument("--output",default="statics/results/judge-smoke.json")
    asyncio.run(main(p.parse_args()))
