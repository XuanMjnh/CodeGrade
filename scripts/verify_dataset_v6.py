"""Execute all trusted bank references under C++11/17/20 and Python 3.11.

Supports --python-only for local checks; full verification needs g++ (Docker tools-test
has g++12 and Python3.11). Includes independent exhaustive checks on new algorithms.
"""
import argparse
import collections
import hashlib
import itertools
import json
import math
import os
from pathlib import Path
import random
import subprocess
import sys
import tempfile
import time
from new_bank import SPECS

ROOT=Path(__file__).resolve().parents[1]
def execute(cmd,stdin='',timeout=180):
    p=subprocess.run(cmd,input=stdin,text=True,encoding='utf-8',capture_output=True,timeout=timeout)
    assert p.returncode==0,(cmd[0],p.stderr[:2000])
    return p.stdout.replace('\r\n','\n')
def independent():
    """Compare trusted solutions with independently enumerated combinatorial answers."""
    bytitle={s['title']:s for s in SPECS};rng=random.Random(600320);checks=0
    for _ in range(20):
        a=[rng.randint(1,6) for _ in range(rng.randint(1,8))];n=len(a);k=rng.randint(1,n);inp=f'{n} {k}\n'+ ' '.join(map(str,a))+'\n'
        subseqs=[[a[i] for i in range(n) if mask>>i&1] for mask in range(1<<n)]
        inc=[v for v in subseqs if v and all(x<y for x,y in zip(v,v[1:]))]
        expected={
            'Số tập con đạt tổng':sum(sum(v)==k for v in subseqs),
            'Dãy tăng có tổng lớn nhất':max(map(sum,inc)),
            'Đếm dãy tăng dài nhất':sum(len(v)==max(map(len,inc)) for v in inc),
            'Dãy con tổng chia hết':sum(sum(v)%k==0 for v in subseqs),
            'Mua bán cổ phiếu một lần':max([0]+[a[j]-a[i] for i in range(n) for j in range(i+1,n)]),
            'Số bước tăng thành không giảm':sum(max(a[:i+1])-a[i] for i in range(n)),
        }
        for title,ans in expected.items():
            assert execute([sys.executable,'-c',bytitle[title]['source']],inp)==str(ans)+'\n',(title,a,k)
            checks+=1
    # Brute validate modular inverses and roots with independent algebraic invariants.
    for a,m in [(3,7),(6,8),(17,43),(999,1000),(1,2)]:
        ans=int(execute([sys.executable,'-c',bytitle['Nghịch đảo modulo']['source']],f'{a} {m}\n'))
        assert (ans==-1 and math.gcd(a,m)!=1) or (0<=ans<m and a*ans%m==1);checks+=1
    return checks
def main(args):
    started=time.monotonic();path=ROOT/'backend/src/main/resources/dataset.json';bank=json.loads(path.read_text(encoding='utf-8'))
    old=json.loads((path.parent/'dataset-upgrade-6.json').read_text(encoding='utf-8'));original={q['general']['idNumber']:q for q in old}
    assert len(bank)==320 and len(original)==120
    keys=[q['general']['idNumber'] for q in bank];assert len(set(keys))==320
    assert set(original)<=set(keys)
    assert collections.Counter(q['general']['categoryId'] for q in bank)==dict(arithmetic=54,arrays=54,strings=53,numbertheory=53,sequences=53,graphs=53)
    assert len({q['general']['questionName'] for q in bank})==320
    assert len({q['general']['questionText'] for q in bank})==320
    checks=0;pythonchecks=0;bykey={s['key']:s for s in SPECS}
    with tempfile.TemporaryDirectory(prefix='codegrade-v6-') as temp:
        temp=Path(temp);combined=['#include <bits/stdc++.h>\nusing namespace std;']
        cpp=[]
        for q in bank:
            key=q['general']['idNumber'];assert len(q['testcases'])==5
            assert len({t['id'] for t in q['testcases']})==5
            assert len({t['stdin'] for t in q['testcases']})==5
            assert sum(t['useasexample'] for t in q['testcases'])==1
            assert set(q['languages'])=={'CPP11','CPP17','CPP20','PY311'}
            assert 1<=q['difficulty']<=6
            if key in original:
                assert q['general']==original[key]['general']
                assert q['answer']==original[key]['answer']
                for t in q['testcases']:assert any(t['stdin']==v['stdin'] and t['expected']==v['expected'] for v in original[key]['testcases'])
                source=q['answer']['sampleAnswer'].replace('#include <bits/stdc++.h>','').replace('using namespace std;','').replace('int main()', 'int solve()')
                combined.append(f'namespace p{len(cpp)} {{\n'+source+'\n}\n');cpp.append(q)
            else:
                assert q['answer']['sampleAnswer']==bykey[key]['source']
                for t in q['testcases']:
                    assert execute([sys.executable,'-c',q['answer']['sampleAnswer']],t['stdin'],8)==t['expected'],(key,t['id'])
                    pythonchecks+=1
        cppchecks=0;standards=[]
        if not args.python_only:
            combined.append('int main(int argc,char**argv){if(argc!=2)return 2;switch(atoi(argv[1])){')
            combined.extend(f'case {i}:return p{i}::solve();' for i in range(len(cpp)))
            combined.append('default:return 3;}}');source=temp/'bank.cpp';source.write_text('\n'.join(combined),encoding='utf-8')
            for standard in ['c++11','c++17','c++20']:
                binary=temp/(standard+('.exe' if os.name=='nt' else ''))
                execute([args.cxx,'-std='+standard,'-O2',str(source),'-o',str(binary)])
                for i,q in enumerate(cpp):
                    for t in q['testcases']:
                        assert execute([str(binary),str(i)],t['stdin'],8)==t['expected'],(standard,q['general']['idNumber'],t['id']);cppchecks+=1
                standards.append(standard);print(standard,'600 stored cases passed',flush=True)
        brute=independent()
    result=dict(kind='Trusted reference execution; separate from real worker validation',problems=320,new_problems=200,cases=1600,python_version=sys.version.split()[0],python_case_runs=pythonchecks,cpp_case_runs=cppchecks,cpp_standards=standards,independent_checks=brute,full_reference_check=not args.python_only,dataset_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),elapsed_seconds=round(time.monotonic()-started,2))
    dest=ROOT/args.report;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(result,ensure_ascii=False,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--python-only',action='store_true');p.add_argument('--cxx',default='g++');p.add_argument('--report',default='statics/results/dataset-v6-verification.json');main(p.parse_args())
