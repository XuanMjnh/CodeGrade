"""Deterministic Vietnamese problem bank; trusted Python oracles, C++11 solutions.
Run generate_dataset.py, then verify_dataset.py. Does not execute submitted code.
"""
import bisect
import collections
import copy
import itertools
import json
import math
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESOURCE = ROOT / 'backend/src/main/resources'
MOD = 1000000007
RNG = random.Random(56120)
OLD = json.loads((RESOURCE / 'dataset.json').read_text(encoding='utf-8'))
BASE = OLD[0]
TITLES = {q['general']['idNumber']: q['general']['questionName'] for q in OLD}
SPECS = []
HEADER = '#include <bits/stdc++.h>\nusing namespace std;\n'

def add(cat, i, level, description, contract, output, body, oracle, cases, method, complexity, prefix=''):
    key = f'v5-{cat}-{i}'
    source = HEADER + prefix + '\nint main() {\n    ios::sync_with_stdio(false); cin.tie(nullptr);\n' + body + '\n    return 0;\n}\n'
    SPECS.append(dict(key=key, cat=cat, title=TITLES[key], level=level,
        text=description+'\n\nDữ liệu vào\n'+contract+'\n\nDữ liệu ra\n'+output+'\n',
        source=source, oracle=oracle, cases=list(dict.fromkeys(cases)), method=method, complexity=complexity))

def arr(v): return str(len(v))+'\n'+' '.join(map(str,v))+'\n'
def values(s):
    data=list(map(int,s.split())); assert data[0]==len(data)-1
    return data[1:]
def pairs(s): return tuple(map(int,s.split()))
def sub_sums(v):
    out=[0]
    for x in v: out += [s+x for s in out]
    return out

def lis(v, non=False):
    d=[]
    for x in v:
        i=(bisect.bisect_right if non else bisect.bisect_left)(d,x)
        if i==len(d): d.append(x)
        else: d[i]=x
    return len(d)

def kadane(v, minimum=False):
    cur=best=v[0]
    for x in v[1:]:
        cur=(min if minimum else max)(x,cur+x)
        best=(min if minimum else max)(best,cur)
    return best

def run(v, predicate):
    cur=best=1
    for a,b in zip(v,v[1:]):
        cur=cur+1 if predicate(a,b) else 1
        best=max(best,cur)
    return best

def zero_subarrays(v, longest=False):
    d={0:0 if longest else 1}; s=ans=0
    for i,x in enumerate(v,1):
        s+=x
        if longest:
            if s in d: ans=max(ans,i-d[s])
            else: d[s]=i
        else: ans+=d.get(s,0);d[s]=d.get(s,0)+1
    return ans

READ='    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;\n'
PAIR='    long long a,b; cin >> a >> b;\n'
NUMBER='    long long n; cin >> n;\n'
PRINT=lambda x: '    cout << ('+x+') << "\\n";'
# Scalar arithmetic: all intermediates and outputs fit signed 64-bit.
AR=[
('Tính tổng a + b.','a+b',lambda a,b:a+b,1,'Một phép cộng.'),
('Tính hiệu a − b (có thể âm).','a-b',lambda a,b:a-b,1,'Một phép trừ.'),
('Tính tích a × b.','a*b',lambda a,b:a*b,1,'Một phép nhân.'),
('Tính khoảng cách |a − b| trên trục số.','llabs(a-b)',lambda a,b:abs(a-b),1,'Lấy trị tuyệt đối.'),
('Tìm số lớn hơn trong hai số a và b.','max(a,b)',max,1,'So sánh hai số.'),
('Tìm số nhỏ hơn trong hai số a và b.','min(a,b)',min,1,'So sánh hai số.'),
('Tính bình phương khoảng cách (a − b)².','(a-b)*(a-b)',lambda a,b:(a-b)**2,1,'Nhân hiệu với chính nó.'),
('Tính tổng hai bình phương a² + b².','a*a+b*b',lambda a,b:a*a+b*b,1,'Tính hai bình phương rồi cộng.'),
('Tính thương nguyên khi chia a cho b, làm tròn xuống.','a/b',lambda a,b:a//b,1,'Chia nguyên hai số dương.'),
('Tính phần dư khi chia a cho b.','a%b',lambda a,b:a%b,1,'Dùng phép chia lấy dư.'),
('Tính số nguyên nhỏ nhất không bé hơn a/b.','a/b+(a%b!=0)',lambda a,b:(a+b-1)//b,2,'Cộng một vào thương nếu còn dư.'),
('Tìm ước chung lớn nhất của a và b.','a',math.gcd,2,'Thuật toán Euclid.'),
('Tìm bội chung nhỏ nhất dương của a và b.','a/g*b',math.lcm,2,'Chia cho GCD trước khi nhân.'),
('Tính tổng các số nguyên từ a đến b, bao gồm cả a và b.','(a+b)*(b-a+1)/2',lambda a,b:(a+b)*(b-a+1)//2,2,'Công thức tổng cấp số cộng.'),
('Một hình chữ nhật có hai cạnh a và b. Tính chu vi.','2*(a+b)',lambda a,b:2*(a+b),1,'Tính 2(a+b).'),
('Một hình chữ nhật có hai cạnh a và b. Tính diện tích.','a*b',lambda a,b:a*b,1,'Nhân chiều dài với chiều rộng.'),
('Tính phần dư của a mũ b khi chia cho 1 000 000 007.','r',lambda a,b:pow(a,b,MOD),3,'Lũy thừa nhị phân và lấy dư sau mỗi phép nhân.'),
('Cho một tập hợp có a + b phần tử phân biệt. Tính số cách chọn a phần tử, tức C(a+b, a) = (a+b)! / (a! × b!).','c[a+b][a]',lambda a,b:math.comb(a+b,a),3,'Tam giác Pascal, tránh tính trực tiếp giai thừa.'),
('Trên lưới, đi từ (0,0) đến (a,b). Mỗi bước chỉ được sang phải một đơn vị hoặc lên trên một đơn vị. Đếm số đường đi.','c[a+b][a]',lambda a,b:math.comb(a+b,a),3,'Mỗi đường đi là một cách chọn vị trí của a bước sang phải.'),
('Đặt T(x) = 1 + 2 + … + x. Tính T(b) − T(a), tương đương tổng các số từ a+1 đến b. Khi a=b, tổng bằng 0.','b*(b+1)/2-a*(a+1)/2',lambda a,b:b*(b+1)//2-a*(a+1)//2,2,'Lấy hiệu hai số tam giác.')]
for i,(desc,expr,fn,level,method) in enumerate(AR):
    bound=30 if i in (17,18) else (1000000000 if i==16 else 1000000)
    unordered=i not in (13,17,18,19)
    contract=f'Một dòng gồm hai số nguyên a, b; 1 ≤ a, b ≤ {bound:,}.'.replace(',', ' ')
    if not unordered: contract=f'Một dòng gồm hai số nguyên a, b; 1 ≤ a ≤ b ≤ {bound:,}.'.replace(',', ' ')
    cases=['2 3\n','1 1\n',f'{bound} {bound}\n',f'1 {bound}\n']
    if unordered:cases += ['9 2\n',f'{bound} 1\n']
    cases += [f'{a} {b}\n' for a,b in [(RNG.randint(1,bound),RNG.randint(1,bound)) for _ in range(10)] if unordered or a<=b]
    if not unordered:cases += [f'{a} {b}\n' for a,b in [(1,2),(2,2),(3,3),(bound-1,bound)]]
    body=PAIR
    if i==11: body+='    while(b){ long long t=a%b; a=b; b=t; }\n'
    if i==12: body+='    long long x=a,y=b; while(y){long long t=x%y;x=y;y=t;} long long g=x;\n'
    if i==16: body+='    const long long M=1000000007; long long r=1; while(b){if(b&1)r=r*a%M; a=a*a%M; b>>=1;}\n'
    if i in (17,18):body+='    long long c[61][61]={}; for(int n=0;n<=a+b;n++){c[n][0]=1;for(int k=1;k<=n;k++)c[n][k]=c[n-1][k-1]+c[n-1][k];}\n'
    output='In một số nguyên là kết quả. Kết quả phải chính xác, không lấy modulo.' if i!=16 else 'In phần dư trong đoạn [0, 1 000 000 006].'
    complexity='O(log b), bộ nhớ O(1)' if i in (11,12,16) else ('O((a+b)²), bộ nhớ O((a+b)²)' if i in (17,18) else 'O(1), bộ nhớ O(1)')
    add('Arithmetic',i,level,desc,contract,output,body+PRINT(expr),lambda s,f=fn:f(*pairs(s)),cases,method,complexity)

COMMON_ARRAYS=[arr([0]),arr([1,2,3,4]),arr([-2,3,-1,0,4]),arr([2]*8),arr([-3,-2,-1]),arr([1000000000,-1000000000]*100),arr([0]*5000),arr(list(range(5000,0,-1))),arr([RNG.randint(-100,100) for _ in range(5000)])]
COMMON_ARRAYS += [arr([RNG.randint(-6,6) for _ in range(RNG.randint(1,18))]) for _ in range(12)]
A=[
('Tính tổng mọi phần tử của dãy.','accumulate(v.begin(),v.end(),0LL)',sum,1,'Cộng dồn.','O(n)'),
('Tìm giá trị lớn nhất trong dãy.','*max_element(v.begin(),v.end())',max,1,'Duyệt và giữ giá trị lớn nhất.','O(n)'),
('Tìm giá trị nhỏ nhất trong dãy.','*min_element(v.begin(),v.end())',min,1,'Duyệt và giữ giá trị nhỏ nhất.','O(n)'),
('Đếm số giá trị phân biệt trong dãy.','set<long long>(v.begin(),v.end()).size()',lambda v:len(set(v)),2,'Đưa các giá trị vào tập hợp.','O(n log n)'),
('Đếm các phần tử chẵn; số 0 là số chẵn.','count_if(v.begin(),v.end(),[](long long x){return x%2==0;})',lambda v:sum(x%2==0 for x in v),1,'Kiểm tra phần dư khi chia 2.','O(n)'),
('Đếm các phần tử lẻ, kể cả số lẻ âm.','count_if(v.begin(),v.end(),[](long long x){return x%2!=0;})',lambda v:sum(x%2!=0 for x in v),1,'Phần dư khác 0.','O(n)'),
('Đếm các phần tử âm (nhỏ hơn 0).','count_if(v.begin(),v.end(),[](long long x){return x<0;})',lambda v:sum(x<0 for x in v),1,'So sánh với 0.','O(n)'),
('Đếm các phần tử dương (lớn hơn 0).','count_if(v.begin(),v.end(),[](long long x){return x>0;})',lambda v:sum(x>0 for x in v),1,'So sánh với 0.','O(n)'),
('Tính tổng trị tuyệt đối của các phần tử.','ans',lambda v:sum(map(abs,v)),1,'Lấy trị tuyệt đối rồi cộng.','O(n)'),
('Tính tổng bình phương các phần tử. Giới hạn giá trị riêng của bài này là |v[i]| ≤ 100 000.','ans',lambda v:sum(x*x for x in v),2,'Dùng số nguyên 64-bit cho tổng.','O(n)'),
('Tính hiệu giữa giá trị lớn nhất và giá trị nhỏ nhất.','*max_element(v.begin(),v.end())-*min_element(v.begin(),v.end())',lambda v:max(v)-min(v),1,'Tìm hai cực trị.','O(n)'),
('Sắp xếp dãy tăng dần. In phần tử ở vị trí floor(n/2)+1, đánh số từ 1; khi n chẵn lấy trung vị phía trên.','v[n/2]',lambda v:sorted(v)[len(v)//2],2,'Sắp xếp rồi truy cập vị trí.','O(n log n)'),
('Tìm số lần xuất hiện nhiều nhất của một giá trị. Chỉ in tần suất, không in giá trị đó.','ans',lambda v:max(collections.Counter(v).values()),2,'Đếm tần suất bằng bảng ánh xạ.','O(n log n)'),
('Đếm cặp chỉ số (i,j) thỏa 1 ≤ i < j ≤ n và v[i]=v[j].','ans',lambda v:sum(c*(c-1)//2 for c in collections.Counter(v).values()),3,'Mỗi phần tử đóng góp số phần tử bằng nó đã xuất hiện.','O(n log n)'),
('Đếm nghịch thế: các cặp chỉ số i<j mà v[i]>v[j]. Hai giá trị bằng nhau không tạo nghịch thế.','ans',None,4,'Nén tọa độ và Fenwick lưu số phần tử đã gặp.','O(n log n)'),
('Đếm các vị trí i từ 1 đến n−1 có v[i] < v[i+1].','ans',lambda v:sum(a<b for a,b in zip(v,v[1:])),1,'So sánh hai phần tử liên tiếp.','O(n)'),
('Tính tổng |v[i+1] − v[i]| với i=1..n−1. Dãy một phần tử cho kết quả 0.','ans',lambda v:sum(abs(a-b) for a,b in zip(v,v[1:])),2,'Cộng độ chênh từng cặp liên tiếp.','O(n)'),
('Đếm vị trí i mà v[i] bằng giá trị lớn nhất trong đoạn v[1..i]. Phần tử bằng kỷ lục cũ vẫn được tính.','ans',lambda v:sum(x==max(v[:i+1]) for i,x in enumerate(v)),2,'Giữ cực đại tiền tố, dùng so sánh ≥.','O(n)'),
('Đếm đoạn con liên tiếp không rỗng có tổng bằng 0. Hai đoạn khác vị trí được tính riêng.','ans',zero_subarrays,4,'Các tổng tiền tố bằng nhau tạo một đoạn có tổng 0.','O(n log n)'),
('Tìm tổng lớn nhất của một đoạn con liên tiếp không rỗng. Nếu mọi số âm, phải chọn ít nhất một phần tử.','ans',kadane,3,'Kadane, khởi tạo bằng phần tử đầu tiên.','O(n)')]
def inv(v):
    return sum(x>y for i,x in enumerate(v) for y in v[i+1:])
for i,(desc,expr,fn,level,method,time) in enumerate(A):
    body=READ
    if i==8:body+='    long long ans=0; for(auto x:v)ans+=llabs(x);\n'
    if i==9:body+='    long long ans=0; for(auto x:v)ans+=x*x;\n'
    if i==11:body+='    sort(v.begin(),v.end());\n'
    if i==12:body+='    map<long long,int> f; int ans=0; for(auto x:v)ans=max(ans,++f[x]);\n'
    if i==13:body+='    map<long long,long long> f; long long ans=0; for(auto x:v){ans+=f[x];++f[x];}\n'
    if i==14:
        body+='    auto s=v; sort(s.begin(),s.end());s.erase(unique(s.begin(),s.end()),s.end()); vector<int> bit(s.size()+1);long long ans=0;int seen=0; for(auto x:v){int k=lower_bound(s.begin(),s.end(),x)-s.begin()+1,at=k,c=0;for(;at;at-=at&-at)c+=bit[at];ans+=seen-c;for(at=k;at<(int)bit.size();at+=at&-at)++bit[at];++seen;}\n'
        fn=inv
    if i in (15,16):body+='    long long ans=0;for(int j=1;j<n;j++)ans+='+('v[j-1]<v[j]' if i==15 else 'llabs(v[j]-v[j-1])')+';\n'
    if i==17:body+='    long long top=LLONG_MIN,ans=0;for(auto x:v){top=max(top,x);ans+=x==top;}\n'
    if i==18:body+='    map<long long,long long> f;f[0]=1;long long s=0,ans=0;for(auto x:v){s+=x;ans+=f[s];++f[s];}\n'
    if i==19:body+='    long long cur=v[0],ans=cur;for(int j=1;j<n;j++){cur=max(v[j],cur+v[j]);ans=max(ans,cur);}\n'
    cases=COMMON_ARRAYS
    if i==9:cases=[s for s in cases if max(map(abs,values(s)))<=100000]+[arr([100000]*5000)]
    bound='100 000' if i==9 else '1 000 000 000'
    add('Arrays',i,level,desc,f'Dòng đầu là n (1 ≤ n ≤ 5 000). Dòng tiếp theo gồm n số nguyên v[i], |v[i]| ≤ {bound}.','In một số nguyên là kết quả chính xác.',body+PRINT(expr),lambda s,f=fn:f(values(s)),cases,method,time+', bộ nhớ O(n)')

# Printable ASCII avoids locale-dependent isalpha/toupper behavior.
STRING_CASES=['abba\n','\n','a\n','a b 12\n','Hello World\n','  a   B  c  \n','Aa0!? Zz\n','aaaaaa\n','abcabc\n','   \n']
STRING_CASES += [''.join(RNG.choice('abcABC 019!?') for _ in range(RNG.randint(1,40)))+'\n' for _ in range(12)]
STRING_CASES += ['abCD 19!'*3750+'\n']
SD=[
('Tính độ dài của dòng, tính cả dấu cách.','s.size()',len,1,'Đếm số ký tự.','O(n)'),
('Đảo ngược toàn bộ dòng, giữ nguyên từng ký tự và dấu cách.','s',lambda s:s[::-1],1,'Đảo thứ tự ký tự.','O(n)'),
('Chuyển các chữ cái a..z thành A..Z. Các ký tự khác giữ nguyên.','s',str.upper,1,'Chuyển từng chữ thường ASCII.','O(n)'),
('Chuyển các chữ cái A..Z thành a..z. Các ký tự khác giữ nguyên.','s',str.lower,1,'Chuyển từng chữ hoa ASCII.','O(n)'),
('Đếm nguyên âm a, e, i, o, u, không phân biệt chữ hoa và chữ thường.','ans',lambda s:sum(c.lower() in 'aeiou' for c in s),1,'Chuẩn hóa chữ rồi kiểm tra tập nguyên âm.','O(n)'),
('Đếm ký tự là chữ số 0..9.','ans',lambda s:sum('0'<=c<='9' for c in s),1,'Kiểm tra khoảng ký tự.','O(n)'),
('Đếm ký tự là chữ cái A..Z hoặc a..z.','ans',lambda s:sum(c.isascii() and c.isalpha() for c in s),1,'Kiểm tra hai khoảng ASCII.','O(n)'),
('Đếm số dấu cách (ASCII 32) trong dòng.','count(s.begin(),s.end(),\' \')',lambda s:s.count(' '),1,'Đếm dấu cách.','O(n)'),
('Một từ là một đoạn liên tiếp không rỗng không chứa dấu cách. Đếm số từ; nhiều dấu cách liên tiếp chỉ là dấu phân cách.','ans',lambda s:len(s.split()),2,'Đếm điểm bắt đầu từ.','O(n)'),
('Đếm số ký tự phân biệt, có phân biệt hoa thường và tính cả dấu cách.','set<char>(s.begin(),s.end()).size()',lambda s:len(set(s)),2,'Đánh dấu ký tự đã xuất hiện.','O(n)'),
('Kiểm tra dòng có đối xứng khi đọc từ hai phía hay không. So sánh chính xác cả hoa thường, dấu câu và dấu cách. Dòng rỗng là đối xứng.','s==r',lambda s:int(s==s[::-1]),2,'So sánh với chuỗi đảo.','O(n)'),
('Chia dòng thành các đoạn cực đại gồm các ký tự bằng nhau liên tiếp. Đếm số đoạn; dòng rỗng có 0 đoạn.','ans',lambda s:sum(i==0 or c!=s[i-1] for i,c in enumerate(s)),2,'Đếm đầu đoạn mới.','O(n)'),
('Tìm tần suất lớn nhất của một ký tự, tính cả dấu cách. Dòng rỗng cho kết quả 0.','ans',lambda s:max(collections.Counter(s).values(),default=0),2,'Đếm 128 ký tự ASCII.','O(n)'),
('Sắp xếp mọi ký tự theo mã ASCII tăng dần, giữ nguyên số lần xuất hiện.','s',lambda s:''.join(sorted(s)),2,'Sắp xếp ký tự.','O(n log n)'),
('Xóa tất cả dấu cách khỏi dòng; các ký tự khác giữ nguyên thứ tự.','s',lambda s:s.replace(' ',''),1,'Lọc ký tự.','O(n)'),
('Đổi chữ thường thành chữ hoa và chữ hoa thành chữ thường. Giữ nguyên các ký tự khác.','s',str.swapcase,1,'Đổi theo từng khoảng ASCII.','O(n)'),
('Lấy mỗi ký tự phân biệt đúng một lần rồi sắp xếp theo mã ASCII tăng dần. Có tính cả dấu cách và dấu câu.','s',lambda s:''.join(sorted(set(s))),2,'Sắp xếp, xóa trùng.','O(n log n)'),
('Một từ là một đoạn liên tiếp không chứa dấu cách. Tìm độ dài từ dài nhất; dòng không có từ cho kết quả 0.','ans',lambda s:max(map(len,s.split()),default=0),2,'Đếm độ dài từ hiện tại.','O(n)'),
('Đếm các đoạn con liên tiếp không rỗng là chuỗi đối xứng. Các lần xuất hiện ở vị trí khác nhau được tính riêng.','ans',None,4,'Quy hoạch động theo độ dài đoạn.','O(n²)'),
('Đếm số chuỗi con liên tiếp không rỗng phân biệt theo nội dung. Những đoạn có cùng nội dung chỉ tính một lần.','ans',None,6,'Suffix automaton: cộng len[state] − len[link[state]] cho mọi trạng thái khác gốc.','O(n × 26)')]
def palindrome_count(s):
    total=0
    for c in range(len(s)):
        for l,r in [(c,c),(c,c+1)]:
            while l>=0 and r<len(s) and s[l]==s[r]: total+=1;l-=1;r+=1
    return total

def distinct_substrings(s):
    # Independent suffix-array oracle; no suffix automaton shared with C++.
    n=len(s);sa=list(range(n));rank=list(map(ord,s));k=1
    while k<n:
        sa.sort(key=lambda j:(rank[j],rank[j+k] if j+k<n else -1))
        nr=[0]*n
        for x,y in zip(sa,sa[1:]): nr[y]=nr[x]+((rank[x],rank[x+k] if x+k<n else -1)!=(rank[y],rank[y+k] if y+k<n else -1))
        rank=nr
        if n and rank[sa[-1]]==n-1:break
        k*=2
    ans=n*(n+1)//2;pos=[0]*n
    for j,x in enumerate(sa):pos[x]=j
    k=0
    for x in range(n):
        if pos[x]==0:k=0;continue
        y=sa[pos[x]-1]
        while x+k<n and y+k<n and s[x+k]==s[y+k]:k+=1
        ans-=k
        k=max(0,k-1)
    return ans
for i,(desc,expr,fn,level,method,time) in enumerate(SD):
    prefix='';body='    string s; getline(cin,s);\n';cases=STRING_CASES
    if i==1:body+='    reverse(s.begin(),s.end());\n'
    if i in (2,3,15):
        op="if(c>='a'&&c<='z')c=c-'a'+'A';" if i==2 else "if(c>='A'&&c<='Z')c=c-'A'+'a';" if i==3 else "if(c>='a'&&c<='z')c=c-'a'+'A';else if(c>='A'&&c<='Z')c=c-'A'+'a';"
        body+='    for(char &c:s){'+op+'}\n'
    if i in (4,5,6):
        cond="string(\"aeiouAEIOU\").find(c)!=string::npos" if i==4 else "c>='0'&&c<='9'" if i==5 else "(c>='a'&&c<='z')||(c>='A'&&c<='Z')"
        body+='    int ans=0;for(char c:s)ans+=('+cond+');\n'
    if i==8:body+="    int ans=0;for(int j=0;j<(int)s.size();j++)ans+=s[j]!=' '&&(j==0||s[j-1]==' ');\n"
    if i==10:body+='    string r=s;reverse(r.begin(),r.end());\n'
    if i==11:body+='    int ans=0;for(int j=0;j<(int)s.size();j++)ans+=j==0||s[j]!=s[j-1];\n'
    if i==12:body+='    int f[128]={},ans=0;for(unsigned char c:s)ans=max(ans,++f[c]);\n'
    if i in (13,16):body+='    sort(s.begin(),s.end());\n'
    if i==16:body+='    s.erase(unique(s.begin(),s.end()),s.end());\n'
    if i==14:body+="    s.erase(remove(s.begin(),s.end(),' '),s.end());\n"
    if i==17:body+="    int ans=0,cur=0;for(char c:s){cur=c==' '?0:cur+1;ans=max(ans,cur);}\n"
    if i==18:
        body+='    int n=s.size();vector<vector<bool>> d(n,vector<bool>(n));long long ans=0;for(int len=1;len<=n;len++)for(int l=0;l+len<=n;l++){int r=l+len-1;d[l][r]=s[l]==s[r]&&(len<=2||d[l+1][r-1]);ans+=d[l][r];}\n'
        fn=palindrome_count;cases=[s for s in cases if len(s)<=501]+['a'*500+'\n','ab'*250+'\n']
    if i==19:
        prefix='struct State { int len=0,link=-1; array<int,26> next; State(){next.fill(-1);} };\n'
        body+='''    vector<State> st(1);int last=0;
    for(char ch:s){int c=ch-'a',cur=st.size();st.push_back(State());st[cur].len=st[last].len+1;int p=last;
        while(p!=-1&&st[p].next[c]==-1){st[p].next[c]=cur;p=st[p].link;}
        if(p==-1)st[cur].link=0;
        else {int q=st[p].next[c];if(st[p].len+1==st[q].len)st[cur].link=q;
            else {int clone=st.size();st.push_back(st[q]);st[clone].len=st[p].len+1;
                while(p!=-1&&st[p].next[c]==q){st[p].next[c]=clone;p=st[p].link;}
                st[q].link=st[cur].link=clone;}}
        last=cur;
    }
    long long ans=0;for(int j=1;j<(int)st.size();j++)ans+=st[j].len-st[st[j].link].len;
'''
        fn=distinct_substrings
        # Prefixes deliberately include clone-heavy, repeated and random strings.
        cases=['abba\n','\n','a\n','aaaaaa\n','abcabc\n','ababa\n','banana\n','mississippi\n','abcdefghijklmnopqrstuvwxyz\n',''.join(RNG.choice('abcd') for _ in range(30000))+'\n','a'*30000+'\n']+[ ''.join(RNG.choice('abc') for _ in range(RNG.randint(1,24)))+'\n' for _ in range(15)]
    contract='Một dòng gồm 0 đến 30 000 ký tự ASCII in được (mã 32..126). Dấu cách đầu và cuối dòng thuộc dữ liệu. Ký tự xuống dòng không thuộc chuỗi.'
    if i==18:contract=contract.replace('30 000','500')
    if i==19:contract='Một dòng gồm 0 đến 30 000 chữ cái thường a..z. Dòng rỗng là dữ liệu hợp lệ.'
    output='In 1 nếu tính chất đúng, ngược lại in 0.' if i==10 else ('In chuỗi kết quả trên một dòng; kết quả rỗng được biểu diễn bằng một dòng trống.' if i in (1,2,3,13,14,15,16) else 'In một số nguyên là kết quả chính xác.')
    add('Strings',i,level,desc,contract,output,body+PRINT(expr),lambda s,f=fn:f(s[:-1]),cases,method,time+', bộ nhớ '+('O(n²)' if i==18 else 'O(n)'),prefix)

def phi(n):
    ans=n;p=2
    while p*p<=n:
        if n%p==0:
            ans-=ans//p
            while n%p==0:n//=p
        p+=1
    if n>1:ans-=ans//n
    return ans

def fib(n):
    if not n:return (0,1)
    a,b=fib(n//2);c=a*(2*b-a)%MOD;d=(a*a+b*b)%MOD
    return (d,(c+d)%MOD) if n%2 else (c,d)

def floor_sum(n):
    ans=0;l=1
    while l<=n:
        q=n//l;r=n//q;ans+=(r-l+1)*q;l=r+1
    return ans

def prime_count(n):
    p=bytearray(b'\1')*(n+1);p[:2]=b'\0\0'
    for i in range(2,math.isqrt(n)+1):
        if p[i]:p[i*i:n+1:i]=b'\0'*((n-i*i)//i+1)
    return sum(p)

def coprime_pairs(n):
    p=list(range(n+1))
    for i in range(2,n+1):
        if p[i]==i:
            for j in range(i,n+1,i):p[j]-=p[j]//i
    return sum(p[2:])

def divs(n):
    result=[]
    for d in range(1,math.isqrt(n)+1):
        if n%d==0:
            result.append(d)
            if d*d!=n:result.append(n//d)
    return result

NT=[
('Đếm số ước nguyên dương của n.',lambda n:len(divs(n)),2,1000000000,'Liệt kê cặp ước d và n/d tới căn bậc hai.','O(√n)',"long long ans=0;for(long long d=1;d*d<=n;d++)if(n%d==0)ans+=d*d==n?1:2;"),
('Tính tổng các ước nguyên dương của n.',lambda n:sum(divs(n)),2,1000000000,'Cộng cặp ước, không đếm đôi căn bậc hai.','O(√n)',"long long ans=0;for(long long d=1;d*d<=n;d++)if(n%d==0){ans+=d;if(d*d!=n)ans+=n/d;}"),
('Tính tổng các ước nguyên dương nhỏ hơn n. Với n=1, tổng bằng 0.',lambda n:sum(divs(n))-n,2,1000000000,'Tổng ước trừ chính n.','O(√n)',"long long ans=-n;for(long long d=1;d*d<=n;d++)if(n%d==0){ans+=d;if(d*d!=n)ans+=n/d;}"),
('Kiểm tra n có phải số nguyên tố hay không. Số 1 không phải số nguyên tố.',lambda n:int(n>1 and all(n%d for d in range(2,math.isqrt(n)+1))),2,1000000000,'Thử ước tới căn bậc hai.','O(√n)',"int ans=n>1;for(long long d=2;d*d<=n;d++)if(n%d==0){ans=0;break;}"),
('Tính φ(n): số nguyên x trong đoạn [1,n] thỏa gcd(x,n)=1. Quy ước φ(1)=1.',phi,3,1000000000,'Phân tích thừa số nguyên tố và áp dụng công thức Euler.','O(√n)',"long long ans=n,x=n;for(long long p=2;p*p<=x;p++)if(x%p==0){ans-=ans/p;while(x%p==0)x/=p;}if(x>1)ans-=ans/x;"),
('Tính n! modulo 1 000 000 007; n! là tích các số từ 1 đến n.',lambda n:math.factorial(n)%MOD,2,10000,'Nhân dồn và lấy dư từng bước.','O(n)',"long long ans=1;for(long long i=1;i<=n;i++)ans=ans*i%1000000007;"),
('Tính tổng các chữ số trong biểu diễn thập phân của n.',lambda n:sum(map(int,str(n))),1,10**18,'Tách chữ số bằng chia và lấy dư cho 10.','O(log n)',"long long ans=0;while(n){ans+=n%10;n/=10;}"),
('Tính tích các chữ số trong biểu diễn thập phân của n. Nếu có chữ số 0, kết quả bằng 0.',lambda n:math.prod(map(int,str(n))),2,10**18,'Nhân từng chữ số. Kết quả nằm trong số nguyên 64-bit.','O(log n)',"long long ans=1;while(n){ans*=n%10;n/=10;}"),
('Đếm bit 1 trong biểu diễn nhị phân của n.',int.bit_count,2,10**18,'Tách bit thấp nhất.','O(log n)',"int ans=0;while(n){ans+=n&1;n>>=1;}"),
('Tính số chữ số trong biểu diễn nhị phân của n, không có số 0 ở đầu.',int.bit_length,1,10**18,'Chia đôi liên tiếp.','O(log n)',"int ans=0;while(n){ans++;n>>=1;}"),
('Kiểm tra n có phải bình phương của một số nguyên hay không.',lambda n:int(math.isqrt(n)**2==n),3,10**18,'Tìm căn nguyên bằng tìm kiếm nhị phân; dùng phép chia để tránh tràn.','O(log n)',"long long l=0,r=1000000001;while(l+1<r){long long m=(l+r)/2;if(m<=n/m)l=m;else r=m;}long long ans=l*l==n;"),
('Tìm số nguyên không âm lớn nhất x sao cho x² ≤ n.',math.isqrt,3,10**18,'Tìm kiếm nhị phân trên căn nguyên.','O(log n)',"long long l=0,r=1000000001;while(l+1<r){long long m=(l+r)/2;if(m<=n/m)l=m;else r=m;}long long ans=l;"),
('Đếm số chữ số 0 liên tiếp ở cuối biểu diễn thập phân của n!, không cần tính n!.',lambda n:sum(n//5**k for k in range(1,27)),3,10**18,'Đếm số thừa số 5 bằng chia liên tiếp.','O(log n)',"long long ans=0;while(n){n/=5;ans+=n;}"),
('Tính tổng các số nguyên x trong [1,n] thỏa gcd(x,n)=1. Với n=1, kết quả là 1.',lambda n:1 if n==1 else n*phi(n)//2,3,1000000000,'Ghép x với n−x để có nφ(n)/2; xét riêng n=1.','O(√n)',"long long x=n,p=n;for(long long d=2;d*d<=x;d++)if(x%d==0){p-=p/d;while(x%d==0)x/=d;}if(x>1)p-=p/x;long long ans=n==1?1:n*p/2;"),
('Đếm các số nguyên tố không vượt quá n.',prime_count,3,1000000,'Sàng Eratosthenes.','O(n log log n)',"vector<bool> p(n+1,true);p[0]=p[1]=false;for(long long i=2;i*i<=n;i++)if(p[i])for(long long j=i*i;j<=n;j+=i)p[j]=false;long long ans=count(p.begin(),p.end(),true);"),
('Kiểm tra n có dạng 2^k với số nguyên k≥0 hay không. Số 1 được tính là lũy thừa của 2.',lambda n:int(n&(n-1)==0),2,10**18,'Số dương có đúng một bit 1.','O(1)',"int ans=(n&(n-1))==0;"),
('Dãy Fibonacci có F(0)=0, F(1)=1 và F(k)=F(k−1)+F(k−2). Tính F(n) modulo 1 000 000 007.',lambda n:fib(n)[0],4,10**18,'Nhân ma trận 2×2 theo lũy thừa nhị phân.','O(log n)',"long long a=1,b=0,c=0,d=1,e=1,f=1,g=1,h=0;const long long M=1000000007;while(n){if(n&1){long long A=(a*e+b*g)%M,B=(a*f+b*h)%M,C=(c*e+d*g)%M,D=(c*f+d*h)%M;a=A;b=B;c=C;d=D;}long long E=(e*e+f*g)%M,F=(e*f+f*h)%M,G=(g*e+h*g)%M,H=(g*f+h*h)%M;e=E;f=F;g=G;h=H;n>>=1;}long long ans=b;"),
('Tính S(n) = floor(n/1) + floor(n/2) + … + floor(n/n).',floor_sum,4,10**12,'Gom những mẫu số có cùng thương floor(n/d).','O(√n)',"long long ans=0;for(long long l=1,r;l<=n;l=r+1){long long q=n/l;r=n/q;ans+=(r-l+1)*q;}"),
('Đếm các cặp số nguyên (a,b) thỏa 1≤a<b≤n và gcd(a,b)=1. Mỗi cặp chỉ tính một lần.',coprime_pairs,4,1000000,'Sàng φ và tính tổng φ(2)..φ(n).','O(n log log n)',"vector<long long> p(n+1);iota(p.begin(),p.end(),0);for(long long i=2;i<=n;i++)if(p[i]==i)for(long long j=i;j<=n;j+=i)p[j]-=p[j]/i;long long ans=accumulate(p.begin()+2,p.end(),0LL);"),
('Đếm cặp có thứ tự (a,b) với 1≤a,b≤n và a×b≤n. Nếu a≠b, (a,b) và (b,a) là hai cặp khác nhau.',floor_sum,4,10**12,'Với mỗi a có floor(n/a) cách chọn b; gom theo thương.','O(√n)',"long long ans=0;for(long long l=1,r;l<=n;l=r+1){long long q=n/l;r=n/q;ans+=(r-l+1)*q;}")]
for i,(desc,fn,level,bound,method,time,body) in enumerate(NT):
    nums=[1,2,12,25,100,bound,max(1,bound-1), min(bound,99991),min(bound,1024),min(bound,999950884)]
    nums += [RNG.randint(1,min(bound,10000)) for _ in range(6)]
    if i in (10,11):nums += [10**18-1,10**18,999999998000000001,999999998000000000]
    output='In 1 nếu tính chất đúng, ngược lại in 0.' if i in (3,10,15) else ('In phần dư trong đoạn [0, 1 000 000 006].' if i in (5,16) else 'In một số nguyên là kết quả chính xác, không lấy modulo.')
    add('NumberTheory',i,level,desc,'Một số nguyên n, 1 ≤ n ≤ '+f'{bound:,}'.replace(',',' ')+'.',output,NUMBER+'    '+body+'\n'+PRINT('ans'),lambda s,f=fn:f(int(s)),[str(n)+'\n' for n in nums],method,time+', bộ nhớ '+('O(n)' if i in (14,18) else 'O(1)'))

MITM='''vector<long long> sums(const vector<long long>& v,int l,int r){vector<long long>s(1,0);for(int i=l;i<r;i++){int n=s.size();for(int j=0;j<n;j++)s.push_back(s[j]+v[i]);}return s;}
'''
def subset_zero(v):
    f=collections.Counter(sub_sums(v[len(v)//2:]));return sum(f[-s] for s in sub_sums(v[:len(v)//2]))
def subset_positive(v):
    b=sorted(sub_sums(v[len(v)//2:]));return sum(len(b)-bisect.bisect_right(b,-s) for s in sub_sums(v[:len(v)//2]))
def partition(v):
    total=sum(v);b=sorted(sub_sums(v[len(v)//2:]));ans=abs(total)
    for a in sub_sums(v[:len(v)//2]):
        at=bisect.bisect_left(b,(total-2*a+1)//2)
        for j in (at-1,at):
            if 0<=j<len(b):ans=min(ans,abs(total-2*(a+b[j])))
    return ans

def increasing_count(v):
    d=[]
    for i,x in enumerate(v):d.append((1+sum(d[j] for j in range(i) if v[j]<x))%MOD)
    return sum(d)%MOD

def nonadj(v):
    a=b=0
    for x in v:a,b=b,max(b,a+x)
    return b

def lps(v):
    n=len(v);d=[[0]*n for _ in v]
    for i in range(n-1,-1,-1):
        d[i][i]=1
        for j in range(i+1,n):d[i][j]=(2+(d[i+1][j-1] if j>i+1 else 0)) if v[i]==v[j] else max(d[i+1][j],d[i][j-1])
    return d[0][-1]

def distinct_sums(v):
    s={0}
    for x in v:s|={a+x for a in s}
    return len(s)

SEQ=[
('Tìm độ dài dãy con tăng nghiêm ngặt dài nhất. Dãy con giữ thứ tự chỉ số nhưng không cần liên tiếp.',lambda v:lis(v),4,'LIS bằng mảng đuôi và lower_bound.','O(n log n)'),
('Tìm độ dài dãy con giảm nghiêm ngặt dài nhất; các phần tử không cần liên tiếp.',lambda v:lis([-x for x in v]),4,'Đổi dấu rồi tìm LIS.','O(n log n)'),
('Tìm độ dài dãy con không giảm dài nhất (cho phép hai giá trị liên tiếp bằng nhau).',lambda v:lis(v,True),4,'Mảng đuôi và upper_bound.','O(n log n)'),
('Đếm dãy con tăng nghiêm ngặt không rỗng. Hai cách chọn chỉ số khác nhau được tính riêng, kể cả khi giá trị giống nhau. Lấy kết quả modulo 1 000 000 007.',increasing_count,5,'Nén tọa độ; Fenwick cộng số dãy kết thúc ở giá trị nhỏ hơn hiện tại.','O(n log n)'),
('Chọn một số phần tử sao cho không có hai chỉ số kề nhau. Tìm tổng lớn nhất; được phép không chọn phần tử nào và nhận tổng 0.',nonadj,3,'DP hai trạng thái chọn/bỏ phần tử.','O(n)'),
('Tìm tích lớn nhất của một đoạn con liên tiếp không rỗng.',lambda v:max(math.prod(v[i:j]) for i in range(len(v)) for j in range(i+1,len(v)+1)),3,'Giữ đồng thời tích nhỏ nhất và lớn nhất kết thúc tại mỗi vị trí.','O(n)'),
('Tìm tổng nhỏ nhất của một đoạn con liên tiếp không rỗng.',lambda v:kadane(v,True),3,'Kadane phiên bản lấy min.','O(n)'),
('Tìm độ dài dãy con đối xứng dài nhất. Hai phía phải bằng nhau theo giá trị; không yêu cầu liên tiếp.',lps,4,'DP trên đoạn: bỏ một đầu hoặc ghép hai đầu bằng nhau.','O(n²)'),
('Đếm các tập con chỉ số có tổng bằng 0. Mỗi chỉ số chọn tối đa một lần. Có tính tập rỗng; các tập chỉ số khác nhau được tính riêng.',subset_zero,5,'Chia đôi, liệt kê tổng mỗi nửa, tìm số cặp tổng đối nhau.','O(n × 2^(n/2))'),
('Đếm số giá trị tổng khác nhau có thể tạo từ một tập con chỉ số. Có tính tổng 0 của tập rỗng. Các cách chọn cho cùng một tổng chỉ tính một lần.',distinct_sums,4,'DP tập tổng đạt được; không cập nhật tại chỗ khi xét một phần tử.','O(n × S), S là tổng trị tuyệt đối'),
('Tìm độ dài đoạn liên tiếp dài nhất gồm các giá trị bằng nhau.',lambda v:run(v,lambda a,b:a==b),2,'Duyệt độ dài đoạn hiện tại.','O(n)'),
('Tìm độ dài đoạn liên tiếp dài nhất có hai phần tử kề nhau trái dấu (tích âm). Số 0 không trái dấu với số nào; đoạn một phần tử luôn hợp lệ.',lambda v:run(v,lambda a,b:a*b<0),2,'Duyệt và bắt đầu lại khi không trái dấu.','O(n)'),
('Tìm chênh lệch tuyệt đối nhỏ nhất giữa hai phần tử ở hai chỉ số khác nhau. Với n=1, in 0.',lambda v:min((abs(a-b) for a,b in zip(sorted(v),sorted(v)[1:])),default=0),2,'Sắp xếp; đáp án nằm giữa hai giá trị kề nhau.','O(n log n)'),
('Chia toàn bộ chỉ số thành hai tập rời nhau, hợp lại là cả dãy. Cho phép một tập rỗng. Tìm trị tuyệt đối nhỏ nhất của hiệu hai tổng.',partition,5,'Chia đôi tổng tập con và tìm kiếm nhị phân gần một nửa tổng toàn dãy.','O(n × 2^(n/2))'),
('Tìm tích lớn nhất của hai phần tử ở hai chỉ số khác nhau. Với n=1, in 0.',lambda v:max((a*b for i,a in enumerate(v) for b in v[i+1:]),default=0),2,'So sánh tích hai số nhỏ nhất với tích hai số lớn nhất.','O(n log n)'),
('Kiểm tra có thể chia toàn bộ chỉ số thành hai tập có tổng bằng nhau hay không. Cho phép một tập rỗng.',lambda v:int(partition(v)==0),5,'Bài toán chia hai tập, kiểm tra chênh lệch nhỏ nhất bằng 0.','O(n × 2^(n/2))'),
('Đếm các tập con chỉ số có tổng dương. Tập rỗng không được tính vì có tổng 0; các tập chỉ số khác nhau được tính riêng.',subset_positive,5,'Chia đôi, sắp xếp tổng nửa sau, đếm các tổng vượt −s.','O(n × 2^(n/2))'),
('Tìm độ dài lớn nhất của đoạn con liên tiếp không rỗng có tổng bằng 0. Nếu không có, in 0.',lambda v:zero_subarrays(v,True),4,'Lưu vị trí đầu tiên của mỗi tổng tiền tố.','O(n log n)'),
('Tìm độ dài đoạn con liên tiếp tăng nghiêm ngặt dài nhất.',lambda v:run(v,lambda a,b:a<b),2,'Duyệt và nối khi phần tử sau lớn hơn.','O(n)'),
('Xóa ít phần tử nhất để dãy còn lại tăng nghiêm ngặt. Thứ tự các phần tử còn lại không thay đổi.',lambda v:len(v)-lis(v),4,'Giữ lại một LIS, xóa n−LIS phần tử.','O(n log n)')]
for i,(desc,fn,level,method,time) in enumerate(SEQ):
    nmax=5000;bound=10**9;prefix='';body=READ
    if i in (0,1,2,19):
        body+='    vector<long long>d;for(auto x:v){'+('x=-x;' if i==1 else '')+'auto it='+('upper_bound' if i==2 else 'lower_bound')+'(d.begin(),d.end(),x);if(it==d.end())d.push_back(x);else *it=x;} long long ans='+('n-d.size()' if i==19 else 'd.size()')+';\n'
    if i==3:body+='    auto s=v;sort(s.begin(),s.end());s.erase(unique(s.begin(),s.end()),s.end());vector<long long>bit(s.size()+1);long long ans=0;const long long M=1000000007;for(auto x:v){int at=lower_bound(s.begin(),s.end(),x)-s.begin()+1;long long count=1;for(int j=at-1;j;j-=j&-j)count=(count+bit[j])%M;ans=(ans+count)%M;for(int j=at;j<(int)bit.size();j+=j&-j)bit[j]=(bit[j]+count)%M;}\n'
    if i==4:body+='    long long a=0,b=0;for(auto x:v){long long next=max(b,a+x);a=b;b=next;}long long ans=b;\n'
    if i==5:
        nmax=16;bound=10
        body+='    long long lo=v[0],hi=v[0],ans=v[0];for(int j=1;j<n;j++){long long a=lo*v[j],b=hi*v[j];lo=min(v[j],min(a,b));hi=max(v[j],max(a,b));ans=max(ans,hi);}\n'
    if i==6:body+='    long long cur=v[0],ans=cur;for(int j=1;j<n;j++){cur=min(v[j],cur+v[j]);ans=min(ans,cur);}\n'
    if i==7:
        nmax=500
        body+='    vector<vector<int>>d(n,vector<int>(n));for(int l=n-1;l>=0;l--){d[l][l]=1;for(int r=l+1;r<n;r++)d[l][r]=v[l]==v[r]?2+(r>l+1?d[l+1][r-1]:0):max(d[l+1][r],d[l][r-1]);}long long ans=d[0][n-1];\n'
    if i in (8,13,15,16):
        nmax=36;prefix=MITM
        body+='    auto a=sums(v,0,n/2),b=sums(v,n/2,n);sort(b.begin(),b.end());long long ans=0;\n'
        if i==8:body+='    for(auto x:a){auto p=equal_range(b.begin(),b.end(),-x);ans+=p.second-p.first;}\n'
        if i==16:body+='    for(auto x:a)ans+=b.end()-upper_bound(b.begin(),b.end(),-x);\n'
        if i in (13,15):body+='    long long total=accumulate(v.begin(),v.end(),0LL);ans=llabs(total);for(auto x:a){long long target=total-2*x;long long need=target/2;if(target>0&&target%2)++need;auto p=lower_bound(b.begin(),b.end(),need);if(p!=b.end())ans=min(ans,llabs(total-2*(x+*p)));if(p!=b.begin()){--p;ans=min(ans,llabs(total-2*(x+*p)));}}\n'
        if i==15:body+='    ans=ans==0;\n'
    if i==9:
        nmax=200;bound=100
        body+='    int S=0;for(auto x:v)S+=llabs(x);vector<bool>d(2*S+1);d[S]=true;for(auto x:v){auto next=d;for(int j=0;j<=2*S;j++)if(d[j]&&j+x>=0&&j+x<=2*S)next[j+x]=true;d.swap(next);}long long ans=count(d.begin(),d.end(),true);\n'
    if i in (10,11,18):
        cond='v[j]==v[j-1]' if i==10 else '(v[j]>0&&v[j-1]<0)||(v[j]<0&&v[j-1]>0)' if i==11 else 'v[j]>v[j-1]'
        body+='    int cur=1,ans=1;for(int j=1;j<n;j++){cur=('+cond+')?cur+1:1;ans=max(ans,cur);}\n'
    if i==12:body+='    sort(v.begin(),v.end());long long ans=n==1?0:LLONG_MAX;for(int j=1;j<n;j++)ans=min(ans,v[j]-v[j-1]);\n'
    if i==14:body+='    sort(v.begin(),v.end());long long ans=n==1?0:max(v[0]*v[1],v[n-1]*v[n-2]);\n'
    if i==17:body+='    map<long long,int>first;first[0]=0;long long s=0;int ans=0;for(int j=0;j<n;j++){s+=v[j];if(first.count(s))ans=max(ans,j+1-first[s]);else first[s]=j+1;}\n'
    raw=[[0],[1,2,3,4],[-2,3,-1,0,4],[2]*8,[-3,-2,-1],[0]*nmax,[min(10,bound)]*nmax,[-min(10,bound)]*nmax,[RNG.randint(-min(bound,20),min(bound,20)) for _ in range(nmax)]]
    raw += [[RNG.randint(-6,6) for _ in range(RNG.randint(1,min(nmax,16)))] for _ in range(12)]
    if i in (8,13,15,16):raw += [[RNG.randint(-bound,bound) for _ in range(nmax)],[-bound,bound]*18]
    if i==9:raw += [[100]*200,[-100]*200]
    if i not in (5,9):raw += [[bound,-bound],[bound]*min(nmax,20)]
    output='In 1 nếu chia được, ngược lại in 0.' if i==15 else ('In phần dư trong đoạn [0, 1 000 000 006].' if i==3 else 'In một số nguyên là kết quả chính xác, không lấy modulo.')
    add('Sequences',i,level,desc,f'Dòng đầu là n (1 ≤ n ≤ {nmax:,}). Dòng tiếp theo gồm n số nguyên v[i], |v[i]| ≤ {bound:,}.'.replace(',',' '),output,body+PRINT('ans'),lambda s,f=fn:f(values(s)),[arr(v) for v in raw],method,time+', bộ nhớ '+('O(n²)' if i==7 else 'O(2^(n/2))' if i in (8,13,15,16) else 'O(S)' if i==9 else 'O(n)'),prefix)

from functools import lru_cache

def graph_input(n,edges): return f'{n} {len(edges)}\n'+''.join(f'{a} {b}\n' for a,b in edges)
@lru_cache(maxsize=64)
def graph_results(text):
    data=list(map(int,text.split()));n,m=data[:2];edges=list(zip(data[2::2],data[3::2]));assert len(edges)==m
    g=[set() for _ in range(n)]
    for a,b in edges:g[a-1].add(b-1);g[b-1].add(a-1)
    seen=set();comps=[];colors={};bip=True
    for start in range(n):
        if start in seen:continue
        seen.add(start);q=[start];colors[start]=0
        for u in q:
            for v in g[u]:
                if v not in seen:seen.add(v);colors[v]=1-colors[u];q.append(v)
                elif colors[v]==colors[u]:bip=False
        comps.append(q)
    dist=[-1]*n;dist[0]=0;q=[0]
    for u in q:
        for v in g[u]:
            if dist[v]<0:dist[v]=dist[u]+1;q.append(v)
    triangles=sum(len(g[a-1]&g[b-1]) for a,b in edges)//3
    return [n,m,sum(not a for a in g),max(map(len,g)),min(map(len,g)),sum(len(a)%2 for a in g),len(comps),max(map(len,comps)),min(map(len,comps)),int(len(comps)==1),m-n+len(comps),int(m==n-len(comps)),int(m==n-1 and len(comps)==1),len(q),max(dist),sum(x for x in dist if x>=0),dist[-1],sum(len(a)==1 for a in g),triangles,int(bip)]
GRAPH_READ='''    int n,m;cin>>n>>m;vector<vector<int>>g(n);vector<pair<int,int>>edges;
    for(int i=0;i<m;i++){int a,b;cin>>a>>b;--a;--b;g[a].push_back(b);g[b].push_back(a);edges.push_back({a,b});}
'''
COMP='''    vector<int> color(n,-1),sizes;bool bip=true;
    for(int start=0;start<n;start++)if(color[start]<0){vector<int> q(1,start);color[start]=0;for(int at=0;at<(int)q.size();at++){int u=q[at];for(int v:g[u]){if(color[v]<0){color[v]=1-color[u];q.push_back(v);}else if(color[v]==color[u])bip=false;}}sizes.push_back(q.size());}
'''
DIST='''    vector<int>d(n,-1),q(1,0);d[0]=0;for(int at=0;at<(int)q.size();at++){int u=q[at];for(int v:g[u])if(d[v]<0){d[v]=d[u]+1;q.push_back(v);}}
'''
GD=[
('In số đỉnh của đồ thị.','n',1,'Đọc n.','O(n+m)'),
('In số cạnh của đồ thị.','m',1,'Đọc m.','O(n+m)'),
('Đếm đỉnh cô lập, tức đỉnh có bậc bằng 0.','ans',2,'Đếm danh sách kề rỗng.','O(n+m)'),
('Tìm bậc lớn nhất của một đỉnh. Bậc là số cạnh kề đỉnh đó.','ans',2,'Lấy độ dài danh sách kề lớn nhất.','O(n+m)'),
('Tìm bậc nhỏ nhất của một đỉnh, có tính cả đỉnh cô lập.','ans',2,'Lấy độ dài danh sách kề nhỏ nhất.','O(n+m)'),
('Đếm đỉnh có bậc lẻ.','ans',2,'Kiểm tra tính chẵn lẻ của bậc.','O(n+m)'),
('Đếm thành phần liên thông. Một đỉnh cô lập là một thành phần.','sizes.size()',3,'BFS từ mỗi đỉnh chưa thăm.','O(n+m)'),
('Tìm số đỉnh của thành phần liên thông lớn nhất.','*max_element(sizes.begin(),sizes.end())',3,'BFS và lưu kích thước thành phần.','O(n+m)'),
('Tìm số đỉnh của thành phần liên thông nhỏ nhất, có tính thành phần một đỉnh.','*min_element(sizes.begin(),sizes.end())',3,'BFS và lấy kích thước nhỏ nhất.','O(n+m)'),
('Kiểm tra đồ thị có liên thông hay không. Đồ thị một đỉnh không có cạnh được xem là liên thông.','sizes.size()==1',3,'Đếm số thành phần.','O(n+m)'),
('Tính số cạnh ít nhất phải xóa để đồ thị không còn chu trình; giữ nguyên mọi đỉnh.','m-n+(int)sizes.size()',3,'Một rừng trên n đỉnh với c thành phần có n−c cạnh.','O(n+m)'),
('Kiểm tra đồ thị có phải rừng (không có chu trình) hay không. Các đỉnh cô lập được phép xuất hiện.','m==n-(int)sizes.size()',3,'So sánh m với n−c.','O(n+m)'),
('Kiểm tra đồ thị có phải cây, tức liên thông và không có chu trình, hay không. Đồ thị một đỉnh là cây.','m==n-1&&sizes.size()==1',3,'Kiểm tra liên thông và số cạnh n−1.','O(n+m)'),
('Đếm đỉnh có thể đến được từ đỉnh 1, có tính cả đỉnh 1.','q.size()',3,'BFS từ đỉnh 1.','O(n+m)'),
('Tính khoảng cách lớn nhất từ đỉnh 1 tới các đỉnh đến được. Mỗi cạnh dài 1. Bỏ qua các đỉnh không đến được; nếu chỉ đến được đỉnh 1 thì in 0.','*max_element(d.begin(),d.end())',3,'BFS và lấy khoảng cách hữu hạn lớn nhất.','O(n+m)'),
('Tính tổng khoảng cách ngắn nhất từ đỉnh 1 tới các đỉnh đến được, có tính khoảng cách 0 tới chính nó. Bỏ qua các đỉnh không đến được.','ans',3,'BFS rồi cộng các khoảng cách không âm.','O(n+m)'),
('Tìm số cạnh ít nhất trên đường đi từ đỉnh 1 tới đỉnh n. Không có đường đi thì in −1. Khi n=1, in 0.','d[n-1]',3,'BFS trên đồ thị không trọng số.','O(n+m)'),
('Đếm đỉnh có bậc đúng bằng 1. Đỉnh cô lập không được tính.','ans',2,'Đếm danh sách kề có một phần tử.','O(n+m)'),
('Đếm bộ ba đỉnh phân biệt {u,v,w} có đủ cả ba cạnh uv, uw, vw. Mỗi tam giác chỉ tính một lần.','ans',5,'Hướng cạnh từ đỉnh bậc nhỏ sang bậc lớn (hòa thì theo chỉ số), đánh dấu láng giềng để đếm tam giác một lần.','O(m√m+n)'),
('Kiểm tra có thể chia mọi đỉnh thành hai tập sao cho mỗi cạnh nối hai tập khác nhau hay không. Đồ thị có thể không liên thông; đỉnh cô lập thuộc tập nào cũng được.','bip',3,'Tô hai màu bằng BFS ở mọi thành phần.','O(n+m)')]
GRAPH_CASES=[graph_input(1,[]),graph_input(3,[(1,2),(2,3)]),graph_input(3,[(1,2),(2,3),(1,3)]),graph_input(4,[(1,2)]),graph_input(4,[(1,2),(2,3),(3,4),(1,4)]),graph_input(6,[(1,2),(3,4),(4,5),(3,5)]),graph_input(5000,[]),graph_input(5000,[(i,i+1) for i in range(1,5000)]),graph_input(5000,[(1,i) for i in range(2,5001)]),graph_input(100,[(i,j) for i in range(1,101) for j in range(i+1,101)])]
for _ in range(12):
    n=RNG.randint(1,14);edges=[(i,j) for i in range(1,n+1) for j in range(i+1,n+1) if RNG.random()<.25];GRAPH_CASES.append(graph_input(n,edges))
edges=set()
while len(edges)<5000:
    a,b=sorted(RNG.sample(range(1,5001),2));edges.add((a,b))
GRAPH_CASES.append(graph_input(5000,sorted(edges)))
for i,(desc,expr,level,method,time) in enumerate(GD):
    body=GRAPH_READ
    if i in (2,3,4,5,17):
        init='n' if i==4 else '0';body+='    int ans='+init+';for(auto &v:g)'+('ans+=v.empty();' if i==2 else 'ans=max(ans,(int)v.size());' if i==3 else 'ans=min(ans,(int)v.size());' if i==4 else 'ans+=v.size()%2;' if i==5 else 'ans+=v.size()==1;')+'\n'
    if i in (6,7,8,9,10,11,12,19):body+=COMP
    if i in (13,14,15,16):body+=DIST
    if i==15:body+='    long long ans=0;for(int x:d)if(x>=0)ans+=x;\n'
    if i==18:body+='''    vector<vector<int>> out(n);for(auto e:edges){int a=e.first,b=e.second;if(make_pair(g[a].size(),a)>make_pair(g[b].size(),b))swap(a,b);out[a].push_back(b);}
    vector<int> mark(n,-1);long long ans=0;for(int u=0;u<n;u++){for(int v:out[u])mark[v]=u;for(int v:out[u])for(int w:out[v])ans+=mark[w]==u;}
'''
    output='In 1 nếu tính chất đúng, ngược lại in 0.' if i in (9,11,12,19) else 'In một số nguyên là kết quả.'
    add('Graphs',i,level,desc,'Dòng đầu gồm n, m: 1 ≤ n ≤ 5 000, 0 ≤ m ≤ min(5 000, n(n−1)/2). Tiếp theo là m dòng u v (1 ≤ u,v ≤ n). Đồ thị vô hướng đơn: không có khuyên, không có cạnh trùng. Các đỉnh đánh số từ 1.',output,body+PRINT(expr),lambda s,j=i:graph_results(s)[j],GRAPH_CASES,method,time+', bộ nhớ O(n+m)')

def generate():
    from generate_dataset_v6 import main
    return main()

if __name__=='__main__':generate()
