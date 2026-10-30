"""Rebuild the single 320-problem bank from bundled C++ and Python references.

Run from Source using Python 3.11+. Only executes trusted bundled reference code.
"""
import collections
import copy
import cpp_bank
import json
from pathlib import Path
import subprocess
import sys
from new_bank import SPECS

ROOT=Path(__file__).resolve().parents[1]
RESOURCE=ROOT/'backend/src/main/resources'
def run(source,stdin):
    p=subprocess.run([sys.executable,'-c',source],input=stdin,text=True,encoding='utf-8',capture_output=True,timeout=8)
    if p.returncode:raise AssertionError(p.stderr)
    return p.stdout.replace('\r\n','\n')
def pick_five(tests):
    """Public example, basic, largest boundary, special and diverse complex case.

    Selection keeps original stdin/expected unchanged; outputs are checked again
    against the original independent Python oracles before writing the bank.
    """
    assert len(tests)>=5
    if len(tests)==5:
        return copy.deepcopy(tests)
    def features(t):
        s=t['stdin'];tokens=s.split()
        return {('size',len(s)//100),('negative','-' in s),('zero','0' in tokens),('output',t['expected']),('lines',s.count('\n'))}
    chosen=[0,1]
    boundary=max(range(len(tests)),key=lambda i:len(tests[i]['stdin']))
    if boundary not in chosen:chosen.append(boundary)
    while len(chosen)<5:
        covered=set().union(*(features(tests[i]) for i in chosen))
        candidates=[i for i in range(len(tests)) if i not in chosen]
        chosen.append(max(candidates,key=lambda i:(len(features(tests[i])-covered),len(tests[i]['stdin']),i)))
    out=[copy.deepcopy(tests[i]) for i in chosen]
    for i,t in enumerate(out):
        t.update(ordering=10*(i+1),useasexample=i==0,display='SHOW' if i==0 else 'HIDE',testtype=0)
        t['extra']=['Ví dụ công khai','Cơ bản','Biên kích thước','Trường hợp đặc biệt','Phức tạp / đa dạng'][i]
    return out
def main():
    bank=json.loads((RESOURCE/'dataset.json').read_text(encoding='utf-8'))
    old=[q for q in bank if q['answer']['language']=='CPP11']
    assert len(old)==120, 'Expected 120 bundled C++ reference problems'
    bykey={s['key']:s for s in cpp_bank.SPECS};out=[];index=[]
    for q in old:
        q=copy.deepcopy(q);key=q['general']['idNumber']
        for t in q['testcases']:
            assert t['expected']==str(bykey[key]['oracle'](t['stdin']))+'\n',(key,'C++ oracle mismatch')
        q['testcases']=pick_five(q['testcases']);out.append(q)
        dest=ROOT/'solutions'/key.split('-')[1]/(key+'.cpp');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(q['answer']['sampleAnswer'],encoding='utf-8')
        index.append({k:bykey[key][k] for k in ('key','title','level','method','complexity')})
    for s in SPECS:
        q=copy.deepcopy(old[0])
        for k in ('id','version','publicId','validatedVersion','sampleValidation','validationNotice'):q.pop(k,None)
        q.update(difficulty=s['level'],coderunnertype='python3_program',survivalEligible=True,languages=['CPP11','CPP17','CPP20','PY311'])
        q['general'].update(categoryId=s['cat'].lower(),questionName=s['title'],questionText=s['text'],idNumber=s['key'],status='ready',defaultMark=100,generalFeedback='')
        q['answer'].update(sampleAnswer=s['source'],language='PY311',preloadAnswer='',validateOnSave=True)
        q['advancedCustomisation'].update(cputimelimitsecs=3,memlimitmb=256)
        q['testcases']=[]
        for i,stdin in enumerate(s['cases']):
            expected=run(s['source'],stdin)
            assert len(stdin.encode())<=65536 and len(expected.encode())<=65536
            q['testcases'].append(dict(id=f'{s["key"]}-{i}',testcode='',stdin=stdin,expected=expected,extra=['Ví dụ công khai','Cơ bản','Biên','Đặc biệt','Phức tạp'][i],useasexample=i==0,display='SHOW' if i==0 else 'HIDE',hiderestiffail=False,mark=1,ordering=(i+1)*10,testtype=0))
        example=q['testcases'][0]
        q['general']['questionText']+='\nVí dụ\nInput:\n'+example['stdin']+'Output:\n'+example['expected']
        out.append(q);index.append({k:s[k] for k in ('key','title','level','method','complexity')})
        dest=ROOT/'solutions'/s['cat']/(s['key']+'.py');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(s['source'],encoding='utf-8')
    expected={'Arithmetic':34,'Arrays':34,'Strings':33,'NumberTheory':33,'Sequences':33,'Graphs':33}
    assert dict(collections.Counter(s['cat'] for s in SPECS))==expected
    assert len(out)==320 and len({q['general']['idNumber'] for q in out})==320
    assert len({q['general']['questionName'] for q in out})==320,'Duplicate titles'
    assert all(len(q['testcases'])==5 for q in out)
    for e in index:e['tests']=5
    (RESOURCE/'dataset.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (ROOT/'solutions/index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['# Lời giải tham chiếu','', '320 bài: 120 lời giải C++11 và 200 lời giải Python 3.11. Mọi bài có đúng 5 testcase. C++11/17/20 và Python 3.11 vẫn là ngôn ngữ nộp bài.','', '| Mã | Bài | Mức | Thuật toán | Độ phức tạp |','|---|---|---:|---|---|']
    for e in index:
        cat=e['key'].split('-')[1];ext='py' if e['key'].startswith('v6-') else 'cpp'
        lines.append(f'| [{e["key"]}]({cat}/{e["key"]}.{ext}) | {e["title"]} | {e["level"]} | {e["method"]} | {e["complexity"]} |')
    (ROOT/'solutions/README.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('Generated 320 problems, 1600 cases; new:',expected)
if __name__=='__main__':main()
