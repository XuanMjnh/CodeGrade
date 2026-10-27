"""Verify trusted bundled solutions; never use this for untrusted submissions.
Requires Python 3.11 and g++. Compiles all 120 standalone C++11 sources and a
namespaced compatibility harness under C++11/17/20; compares every case with
stored Python-oracle outputs, then adds independent brute-force checks.
"""
import argparse
import collections
import concurrent.futures
import hashlib
import importlib.util
import itertools
import json
import math
from pathlib import Path
import random
import subprocess
import tempfile
import time

ROOT=Path(__file__).resolve().parents[1]
def execute(cmd,stdin='',seconds=10):
    p=subprocess.run(cmd,input=stdin,text=True,capture_output=True,timeout=seconds)
    if p.returncode:raise AssertionError(f'{cmd[0]} exit {p.returncode}: {p.stderr[:2000]}')
    return p.stdout

def brute(key,inp):
    cat,i=key.split('-')[1:];i=int(i)
    if cat=='Strings':
        s=inp[:-1]
        if i==18:return sum(s[l:r]==s[l:r][::-1] for l in range(len(s)) for r in range(l+1,len(s)+1))
        if i==19:return len({s[l:r] for l in range(len(s)) for r in range(l+1,len(s)+1)})
    if cat in ('Sequences','Arrays'):
        v=list(map(int,inp.split()))[1:];n=len(v)
        subs=[v[l:r] for l in range(n) for r in range(l+1,n+1)]
        if cat=='Arrays':
            if i==14:return sum(v[a]>v[b] for a in range(n) for b in range(a+1,n))
            if i==18:return sum(sum(a)==0 for a in subs)
            if i==19:return max(map(sum,subs))
        else:
            selected=[[v[j] for j in range(n) if mask>>j&1] for mask in range(1<<n)]
            sums=list(map(sum,selected));strict=lambda a:all(x<y for x,y in zip(a,a[1:]))
            if i==0:return max(len(a) for a in selected if strict(a))
            if i==1:return max(len(a) for a in selected if all(x>y for x,y in zip(a,a[1:])))
            if i==2:return max(len(a) for a in selected if all(x<=y for x,y in zip(a,a[1:])))
            if i==3:return sum(bool(a) and strict(a) for a in selected)%1000000007
            if i==4:return max(sum(v[j] for j in range(n) if mask>>j&1) for mask in range(1<<n) if not(mask&(mask<<1)))
            if i==5:return max(map(math.prod,subs))
            if i==6:return min(map(sum,subs))
            if i==7:return max(len(a) for a in selected if a==a[::-1])
            if i==8:return sums.count(0)
            if i==9:return len(set(sums))
            if i==13:return min(abs(sum(v)-2*x) for x in sums)
            if i==15:return int(any(sum(v)==2*x for x in sums))
            if i==16:return sum(x>0 for x in sums)
            if i==17:return max((len(a) for a in subs if sum(a)==0),default=0)
            if i==19:return n-max(len(a) for a in selected if strict(a))
    if cat=='Graphs' and i in (10,11,12,18,19):
        data=list(map(int,inp.split()));n,m=data[:2];edges={tuple(sorted(e)) for e in zip(data[2::2],data[3::2])}
        if i==18:return sum((a,b) in edges and (a,c) in edges and (b,c) in edges for a,b,c in itertools.combinations(range(1,n+1),3))
        if i==19:return int(any(all(((mask>>(a-1))^(mask>>(b-1)))&1 for a,b in edges) for mask in range(1<<n)))
        # DSU yields cycle rank independently of the generator's BFS.
        p=list(range(n+1))
        def find(x):
            while x!=p[x]:x=p[x]
            return x
        c=n;cycles=0
        for a,b in edges:
            a,b=find(a),find(b)
            if a==b:cycles+=1
            else:p[a]=b;c-=1
        return cycles if i==10 else int(cycles==0) if i==11 else int(cycles==0 and c==1)
    return None

def main(args):
    started=time.monotonic();data=json.loads((ROOT/'backend/src/main/resources/dataset.json').read_text())
    spec=importlib.util.spec_from_file_location('bank',ROOT/'scripts/generate_dataset.py');bank=importlib.util.module_from_spec(spec);spec.loader.exec_module(bank)
    specs={s['key']:s for s in bank.SPECS};assert len(data)==120
    checks=0;fuzz=0;mutants=0;rng=random.Random(56121)
    levels=collections.Counter();cats=collections.Counter();cases=0
    with tempfile.TemporaryDirectory(prefix='codegrade-bank-') as tmp:
        tmp=Path(tmp);combined=[bank.HEADER]
        for k,q in enumerate(data):
            key=q['general']['idNumber'];s=specs[key];source=q['answer']['sampleAnswer']
            assert source==s['source'],(key,'reference source differs from generator')
            assert q['answer']['language']=='CPP11' and q['general']['questionText']==s['text'] and q['difficulty']==s['level']
            cats[q['general']['categoryId']]+=1;levels[q['difficulty']]+=1
            combined += [f'namespace problem{k} {{\n'+source.removeprefix(bank.HEADER).replace('int main()', 'int solve()')+'\n}\n']
            for t in q['testcases']:
                assert len(t['stdin'].encode())<=65536 and len(t['expected'].encode())<=65536
                assert t['expected']==str(s['oracle'](t['stdin']))+'\n',(key,t['id'],'oracle mismatch')
                cases+=1
            # Reject hardcoded public example and a constant-zero solution.
            for wrong in [q['testcases'][0]['expected'],'0\n']:
                assert any(t['expected']!=wrong for t in q['testcases']),(key,'weak test suite')
                mutants+=1
        combined += ['int main(int argc,char**argv){if(argc!=2)return 2;switch(atoi(argv[1])){']
        combined += [f'case {k}:return problem{k}::solve();' for k in range(len(data))]
        combined += ['default:return 3;}}']
        (tmp/'bank.cpp').write_text('\n'.join(combined))
        for standard in ('c++11','c++17','c++20'):
            binary=tmp/standard
            execute(['g++','-std='+standard,'-O2','-Wall','-Wextra',str(tmp/'bank.cpp'),'-o',str(binary)],seconds=180)
            for k,q in enumerate(data):
                for t in q['testcases']:
                    actual=execute([str(binary),str(k)],t['stdin'],seconds=3)
                    assert actual==t['expected'],(standard,q['general']['idNumber'],t['id'],repr(actual),repr(t['expected']))
                    checks+=1
            print(standard,cases,'stored cases passed',flush=True)
            if standard=='c++11':
                for k,q in enumerate(data):
                    key=q['general']['idNumber'];cat=specs[key]['cat']
                    if cat not in ('Strings','Sequences','Arrays','Graphs'):continue
                    for _ in range(30):
                        if cat=='Strings':inp=''.join(rng.choice('abc') for _ in range(rng.randint(0,16)))+'\n'
                        elif cat in ('Arrays','Sequences'):inp=bank.arr([rng.randint(-5,5) for _ in range(rng.randint(1,10))])
                        else:
                            n=rng.randint(1,8);inp=bank.graph_input(n,[(a,b) for a in range(1,n+1) for b in range(a+1,n+1) if rng.random()<.35])
                        expected=brute(key,inp)
                        if expected is None:continue
                        assert specs[key]['oracle'](inp)==expected,(key,'oracle/brute disagreement',inp)
                        assert execute([str(binary),str(k)],inp,seconds=3)==str(expected)+'\n',(key,'C++/brute disagreement',inp)
                        fuzz+=1
                # Detect undefined signed overflow / indexing bugs on max-size stored cases.
                execute(['g++','-std=c++11','-O1','-fsanitize=undefined','-fno-sanitize-recover=all',str(tmp/'bank.cpp'),'-o',str(tmp/'ubsan')],seconds=180)
                for k,q in enumerate(data):
                    for t in q['testcases']:
                        assert execute([str(tmp/'ubsan'),str(k)],t['stdin'],seconds=8)==t['expected']
                print('UBSan and',fuzz,'independent brute-force checks passed',flush=True)
        def standalone(item):
            k,q=item;key=q['general']['idNumber'];cat=specs[key]['cat'];binary=tmp/str(k)
            standalone_source=tmp/(str(k)+'.cpp')
            standalone_source.write_text(q['answer']['sampleAnswer'],encoding='utf-8')
            execute(['g++','-std=c++11','-O2',str(standalone_source),'-o',str(binary)],seconds=90)
            test=q['testcases'][0];assert execute([str(binary)],test['stdin'],seconds=3)==test['expected'];return 1
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.jobs) as pool:standalone_count=sum(pool.map(standalone,enumerate(data)))
        print(standalone_count,'standalone C++11 programs compiled and public examples passed',flush=True)
    assert set(levels)==set(range(1,7)) and all(n==20 for n in cats.values())
    result=dict(kind='Local trusted reference verification; not Docker/MySQL end-to-end',problems=120,cases=cases,cpp_standard_case_runs=checks,standalone_cpp11=standalone_count,ubsan_case_runs=cases,independent_brute_checks=fuzz,rejected_constant_mutants=mutants,levels=dict(sorted(levels.items())),categories=dict(cats),dataset_sha256=hashlib.sha256((ROOT/'backend/src/main/resources/dataset.json').read_bytes()).hexdigest(),elapsed_seconds=round(time.monotonic()-started,2))
    if args.report:
        dest=ROOT/args.report;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--jobs',type=int,default=2);p.add_argument('--report',default='statics/results/dataset-verification.json');main(p.parse_args())
