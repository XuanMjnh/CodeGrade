"""Measure real WebSocket round trips. No fabricated latency numbers.
pip install websockets==15.0.1
python scripts/benchmark_ws.py --url ws://localhost:8080/ws --output statics/results/network.json
"""
import argparse
import asyncio
import json
import platform
import statistics
import time
from pathlib import Path
import websockets


async def measure(url, clients, rounds):
    barrier = asyncio.Barrier(clients)
    durations = []
    errors = []
    started = []
    ended = []

    async def client(index):
        async with websockets.connect(url, proxy=None, max_size=2**20) as ws:
            await barrier.wait()
            started.append(time.perf_counter())
            for j in range(rounds):
                rid = f"bench-{index}-{j}"
                request = dict(v=1, type="PING", requestId=rid, payload={})
                begin = time.perf_counter()
                await ws.send(json.dumps(request))
                while True:
                    response = json.loads(await asyncio.wait_for(ws.recv(), 10))
                    if response.get("requestId") == rid:
                        break
                if response.get("ok"):
                    durations.append((time.perf_counter() - begin) * 1000)
                else:
                    errors.append(response.get("error"))
            ended.append(time.perf_counter())
    await asyncio.gather(*(client(i) for i in range(clients)))
    duration = max(ended) - min(started)
    ordered = sorted(durations)
    return dict(clients=clients, rounds_per_client=rounds, requests=clients*rounds,
                successful=len(durations), errors=len(errors), elapsed_seconds=duration,
                throughput_per_second=len(durations)/duration,
                p50_ms=statistics.median(durations),
                p95_ms=ordered[min(len(ordered)-1, int(len(ordered)*.95))],
                max_ms=max(durations), raw_rtt_ms=durations)


async def main(args):
    results = []
    for n in args.clients:
        result = await measure(args.url, n, args.rounds)
        results.append(result)
        print(f"{n} clients: {result['successful']} ACKs; p95 {result['p95_ms']:.3f}ms", flush=True)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(dict(kind="measured WebSocket PING RTT, not judge throughput",url=args.url,
                                  platform=platform.platform(), python=platform.python_version(),
                                  timestamp_utc=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),
                                  scenarios=results), indent=2)+"\n")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--url", default="ws://localhost:8080/ws")
    p.add_argument("--clients", nargs="+", type=int, default=[1,10,30])
    p.add_argument("--rounds", type=int, default=50)
    p.add_argument("--output", default="statics/results/network.json")
    options = p.parse_args()
    if max(options.clients)>200 or options.rounds>60 or min(options.clients)<1 or options.rounds<1:
        p.error("Use 1–200 clients and 1–60 rounds to stay within protocol limits")
    asyncio.run(main(options))
