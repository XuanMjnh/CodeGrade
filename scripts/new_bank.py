"""200 distinct exercises for bank v6. Trusted reference sources, never user code."""
import math
import itertools
import collections
SPECS=[]
HEADER='import sys, math, itertools, collections, functools, heapq, bisect\n'
def add(cat,title,level,desc,contract,code,cases,method,complexity='O(n²)',helpers=''):
    assert len(set(cases))==5,(title,'five distinct cases required')
    key=f'v6-{cat}-{1+sum(s["cat"]==cat for s in SPECS):02}'
    SPECS.append(dict(key=key,cat=cat,title=title,level=level,text=desc+'\n\nDữ liệu vào\n'+contract+'\n\nDữ liệu ra\nIn kết quả theo mô tả, kết thúc bằng một dòng mới.\n',source=HEADER+helpers+'\n'+code+'\n',cases=cases,method=method,complexity=complexity))
def scalar(title,desc,expr,cases,level=2,code='',contract='Một dòng chứa số nguyên n, 1 ≤ n ≤ 1000.',method='Biến đổi công thức và tính bằng số nguyên.'):
    add('Arithmetic',title,level,desc,contract,'n=int(input())\n'+code+'\nprint('+expr+')',[str(x)+'\n' for x in cases],method,'Theo số chữ số hoặc O(n)')
scalar('Năm nhuận','In 1 nếu năm n có 366 ngày theo lịch Gregory, ngược lại in 0.','int(n%400==0 or n%4==0 and n%100!=0)',[2024,2023,1,1900,2000],contract='Một năm n, 1 ≤ n ≤ 9999.')
scalar('Đồng hồ từ giây','Đổi n giây tính từ nửa đêm thành giờ:phút:giây, luôn có hai chữ số mỗi phần.','f"{n//3600:02}:{n//60%60:02}:{n%60:02}"',[3661,60,0,86399,43209],contract='Một số nguyên n, 0 ≤ n < 86400.')
scalar('Căn bậc hai làm tròn lên','Tìm số nguyên nhỏ nhất x ≥ 0 sao cho x² ≥ n.','math.isqrt(n)+(math.isqrt(n)**2<n)',[10,16,1,999,1000])
scalar('Căn bậc ba nguyên','Tìm số nguyên lớn nhất x ≥ 0 sao cho x³ ≤ n.','x',[27,28,1,999,1000],code='x=0\nwhile (x+1)**3<=n:x+=1')
scalar('Đường chéo đa giác','Một đa giác lồi có n đỉnh. Đếm các đoạn nối hai đỉnh không kề nhau.','n*(n-3)//2',[5,4,3,6,1000],contract='Số đỉnh n, 3 ≤ n ≤ 1000.')
scalar('Tổng bình phương liên tiếp','Tính 1² + 2² + … + n².','n*(n+1)*(2*n+1)//6',[3,2,1,1000,37])
scalar('Tổng lập phương liên tiếp','Tính 1³ + 2³ + … + n³.','(n*(n+1)//2)**2',[3,2,1,1000,57])
scalar('Chữ số thứ k','Viết liền các số 123456789101112… In chữ số ở vị trí n, đánh số từ 1.','s[n-1]',[10,11,1,1000,189],code="s=''.join(map(str,range(1,n+1)))",method='Sinh các số đến khi đủ độ dài rồi truy cập vị trí.')
scalar('Mã Gray','In giá trị thập phân của mã Gray nhị phân phản xạ ứng với n.','n^(n>>1)',[7,2,0,1023,341],contract='Số nguyên n, 0 ≤ n ≤ 1023.',method='XOR số ban đầu với số dịch phải một bit.')
scalar('Giải mã Gray','n là giá trị thập phân của một mã Gray. Khôi phục số nguyên ban đầu.','x',[4,3,0,1023,511],code='x=0\nwhile n:x^=n;n>>=1',contract='Số nguyên n, 0 ≤ n ≤ 1023.',method='XOR các tiền tố dịch phải của mã Gray.')
scalar('Số que diêm','Một chữ số thập phân dùng số que 6,2,5,5,4,5,6,3,7,6 tương ứng 0..9. Đếm que để viết n.','sum([6,2,5,5,4,5,6,3,7,6][int(c)] for c in str(n))',[123,888,0,1000,907],contract='Số nguyên n, 0 ≤ n ≤ 1000.')
scalar('Đổi sang cơ số âm hai','In biểu diễn của n trong cơ số −2, dùng chữ số 0 và 1, không có số 0 thừa ở đầu.','out or "0"',[6,2,0,1000,47],code="out=''\nwhile n:\n n,r=divmod(n,-2)\n if r<0:n+=1;r+=2\n out=str(r)+out",contract='Số nguyên n, 0 ≤ n ≤ 1000.',method='Chia lấy dư cho −2, điều chỉnh phần dư âm.')
scalar('Tách tích tối ưu','Tách n thành tổng ít nhất hai số nguyên dương. In tích lớn nhất của các số hạng.','dp[n]',[10,4,2,58,17],code='dp=list(range(n+1))\nfor i in range(2,n+1):dp[i]=max(max(j,dp[j])*max(i-j,dp[i-j]) for j in range(1,i))\ndp[n]=max(j*dp[n-j] for j in range(1,n))',contract='Số nguyên n, 2 ≤ n ≤ 58.',method='Quy hoạch động theo số hạng đầu tiên.')
scalar('Tháp Hà Nội','Tính số bước tối thiểu chuyển n đĩa giữa ba cọc, modulo 1 000 000 007.','(pow(2,n,1000000007)-1)%1000000007',[3,2,1,1000,99],method='Dùng công thức 2^n−1 và lũy thừa modulo.')
scalar('Góc trong đa giác','In tổng các góc trong của đa giác lồi n đỉnh, đơn vị độ.','180*(n-2)',[5,4,3,1000,19],contract='Số đỉnh n, 3 ≤ n ≤ 1000.')
scalar('Tổng bit của đoạn đầu','Đếm tổng số bit 1 trong biểu diễn nhị phân của tất cả số từ 0 đến n.','sum(i.bit_count() for i in range(n+1))',[5,2,1,1000,255],method='Cộng số bit 1 của từng số.')
scalar('Tổng chữ số của đoạn đầu','Tính tổng chữ số thập phân của tất cả số nguyên từ 1 đến n.','sum(sum(map(int,str(i))) for i in range(1,n+1))',[12,9,1,1000,999],method='Duyệt các số và tách chữ số.')
def nums(title,desc,code,cases,contract,level=2,method='Tính toán số nguyên theo mô tả.'):
    add('Arithmetic',title,level,desc,contract,'a=list(map(int,input().split()))\n'+code,cases,method,'O(n) hoặc O(log n)')
nums('Số nghiệm bậc hai','Cho ax²+bx+c=0 với a khác 0. In số nghiệm thực phân biệt (0, 1 hoặc 2).','a,b,c=a\nd=b*b-4*a*c\nprint(0 if d<0 else 1 if d==0 else 2)',['1 -3 2\n','1 2 1\n','1 0 1\n','1000 0 -1000\n','-2 5 3\n'],'Ba số a b c, |a|,|b|,|c| ≤ 1000 và a ≠ 0.')
nums('Số ngày trong tháng','In số ngày của tháng m trong năm y theo lịch Gregory.','m,y=a\nprint([31,29 if y%400==0 or y%4==0 and y%100!=0 else 28,31,30,31,30,31,31,30,31,30,31][m-1])',['2 2024\n','4 2023\n','1 1\n','2 1900\n','2 2000\n'],'Hai số m y, 1 ≤ m ≤ 12, 1 ≤ y ≤ 9999.')
nums('Phân loại tam giác','In INVALID nếu ba cạnh không tạo tam giác; ngược lại in RIGHT, ACUTE hoặc OBTUSE theo góc lớn nhất.','x,y,z=sorted(a)\nprint("INVALID" if x+y<=z else "RIGHT" if x*x+y*y==z*z else "ACUTE" if x*x+y*y>z*z else "OBTUSE")',['3 4 5\n','2 3 4\n','1 1 1\n','1 2 3\n','999 999 1000\n'],'Ba cạnh nguyên dương không quá 1000.',3,'Sắp xếp cạnh, kiểm tra bất đẳng thức tam giác và bình phương cạnh.')
nums('Hướng rẽ trên mặt phẳng','Cho ba điểm A,B,C. In 1 nếu A→B→C rẽ trái, −1 nếu rẽ phải, 0 nếu thẳng hàng.','x,y,u,v,p,q=a\nd=(u-x)*(q-y)-(v-y)*(p-x)\nprint((d>0)-(d<0))',['0 0 1 0 1 1\n','0 0 0 1 1 1\n','0 0 0 0 1 1\n','-1000 -1000 1000 1000 0 0\n','1 2 5 3 7 10\n'],'Sáu số xA yA xB yB xC yC, trị tuyệt đối ≤ 1000.',3,'Tính dấu tích có hướng.')
nums('Diện tích tam giác nguyên','Cho ba điểm A,B,C. In hai lần diện tích tam giác, kể cả khi suy biến.','x,y,u,v,p,q=a\nprint(abs((u-x)*(q-y)-(v-y)*(p-x)))',['0 0 3 0 0 2\n','1 1 2 2 3 3\n','0 0 0 0 0 0\n','-1000 -1000 1000 -1000 0 1000\n','2 3 8 5 -1 7\n'],'Sáu tọa độ nguyên, trị tuyệt đối ≤ 1000.',3,'Định thức tọa độ.')
nums('Độ dài giao hai đoạn','Cho hai đoạn đóng [a,b] và [c,d] trên trục số. In độ dài phần giao, bằng 0 nếu không giao.','x,y,u,v=a\nprint(max(0,min(y,v)-max(x,u)))',['1 5 3 7\n','1 2 3 4\n','0 0 0 0\n','-1000 1000 -999 999\n','1 8 8 9\n'],'Bốn số a b c d, −1000 ≤ a ≤ b ≤ 1000, −1000 ≤ c ≤ d ≤ 1000.')
nums('Đếm bội trong khoảng','Đếm số nguyên x thuộc [a,b] chia hết cho k.','x,y,k=a\nprint(y//k-(x-1)//k)',['3 20 4\n','1 10 3\n','1 1 1\n','-1000 1000 7\n','-9 -1 3\n'],'Ba số a b k, −1000 ≤ a ≤ b ≤ 1000, 1 ≤ k ≤ 1000.')
nums('Josephus vòng tròn','n người đánh số 1..n đứng vòng tròn. Bắt đầu tại 1, liên tiếp loại người thứ k, đếm lại từ người kế tiếp. In người sống cuối.','n,k=a\nr=0\nfor i in range(1,n+1):r=(r+k)%i\nprint(r+1)',['7 3\n','5 2\n','1 1\n','1000 997\n','8 1\n'],'Hai số n k, 1 ≤ n,k ≤ 1000.',3,'Truy hồi Josephus theo kích thước vòng.')
nums('Lũy thừa không modulo','In a^b chính xác bằng hệ thập phân; quy ước 0^0=1.','x,y=a\nprint(x**y)',['2 10\n','3 3\n','0 0\n','100 100\n','-2 9\n'],'Hai số a b, −100 ≤ a ≤ 100, 0 ≤ b ≤ 100.')
nums('Chữ số cuối của tháp mũ','In chữ số cuối của a^(b^c); các số đều dương.','x,y,z=a\nprint(pow(x,pow(y,z),10))',['3 2 3\n','7 3 2\n','1 1 1\n','1000 10 10\n','6 7 8\n'],'Ba số a b c, 1 ≤ a ≤ 1000, 1 ≤ b,c ≤ 10.',3,'Lũy thừa modulo với số mũ nguyên lớn.')
nums('Đổi cơ số dương','In biểu diễn của n trong cơ số b, dùng 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ.','n,b=a\ns=""\nwhile n:n,r=divmod(n,b);s="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[r]+s\nprint(s or "0")',['31 16\n','7 2\n','0 36\n','1000 3\n','999 36\n'],'Hai số n b, 0 ≤ n ≤ 1000, 2 ≤ b ≤ 36.',2,'Chia lấy dư liên tiếp.')
nums('XOR một khoảng','Tính XOR của mọi số nguyên từ l đến r, kể cả hai đầu.','l,r=a\nx=0\nfor i in range(l,r+1):x^=i\nprint(x)',['3 7\n','0 2\n','0 0\n','1 1000\n','255 256\n'],'Hai số l r, 0 ≤ l ≤ r ≤ 1000.',2,'Duyệt hoặc dùng chu kỳ XOR tiền tố.')
nums('AND một khoảng','Tính AND bit của mọi số từ l đến r, kể cả hai đầu.','l,r=a\nx=l\nfor i in range(l+1,r+1):x&=i\nprint(x)',['5 7\n','8 9\n','0 0\n','1 1000\n','255 256\n'],'Hai số l r, 0 ≤ l ≤ r ≤ 1000.',3,'Tìm tiền tố bit chung hoặc duyệt đoạn.')
nums('Thuế lũy tiến nguyên','Thu nhập n đồng: 100 đồng đầu không thuế, 400 đồng tiếp theo chịu 10%, phần còn lại 20%. In tiền thuế, làm tròn xuống tổng cuối.','n=a[0]\nprint((min(max(n-100,0),400)+2*max(n-500,0))//10)',['600\n','200\n','0\n','1000\n','509\n'],'Một số nguyên n, 0 ≤ n ≤ 1000.')
nums('Lát hình chữ nhật','Một hình a×b cần phủ bằng các viên vuông cạnh k, cạnh viên song song cạnh hình. Cho phép phần viên thừa ở ngoài. In số viên ít nhất.','x,y,k=a\nprint(((x+k-1)//k)*((y+k-1)//k))',['6 6 4\n','3 5 2\n','1 1 1\n','1000 999 7\n','2 2 5\n'],'Ba số a b k, 1 ≤ a,b,k ≤ 1000.')
nums('Đồng hồ gặp nhau','Hai đèn nháy lần đầu sau a và b giây rồi lặp chu kỳ tương ứng. Trong [1,t], có bao nhiêu thời điểm cả hai cùng nháy?','x,y,t=a\nprint(t//math.lcm(x,y))',['3 5 100\n','2 4 20\n','1 1 1\n','997 991 1000\n','6 9 100\n'],'Ba số a b t, 1 ≤ a,b,t ≤ 1000.',2,'Đếm bội chung theo chu kỳ LCM.')
nums('Chia kẹo công bằng','Có n kẹo giống nhau và k người phân biệt. Đếm cách chia sao cho mỗi người có ít nhất một kẹo.','n,k=a\nprint(math.comb(n-1,k-1) if n>=k else 0)',['7 3\n','5 2\n','1 1\n','30 15\n','3 5\n'],'Hai số n k, 1 ≤ n,k ≤ 30.',3,'Phương pháp vách ngăn cho các phần dương.')

ARR_CASES=['5 3\n2 1 4 1 3\n','4 2\n1 2 3 4\n','1 1\n0\n','6 4\n-3 -1 0 2 -1 4\n','12 5\n9 0 3 3 -2 7 1 -4 8 8 2 5\n']
ARR_READ='n,k=map(int,input().split())\na=list(map(int,input().split()))\n'
def array(title,desc,code,level=3,cases=None,contract=None,method='Duyệt mảng với cấu trúc phụ theo mô tả.',helpers=''):
    add('Arrays',title,level,desc,contract or 'Dòng đầu n k (1 ≤ n ≤ 100, 1 ≤ k ≤ n). Dòng sau n số nguyên a[i], |a[i]| ≤ 1000. k chỉ sử dụng khi mô tả yêu cầu.',ARR_READ+code,cases or ARR_CASES,method,'O(n²) hoặc tốt hơn',helpers)
array('Dãy tổng tiền tố','In n tổng a[1], a[1]+a[2], …, a[1]+…+a[n], cách nhau một dấu cách.','print(*itertools.accumulate(a))',2,method='Cộng dồn từ trái sang phải.')
array('Cực đại hậu tố','Với mỗi i, in giá trị lớn nhất trong a[i..n]. In n kết quả.','print(*(max(a[i:]) for i in range(n)))',2,method='Quét từ phải sang trái, giữ cực đại.')
array('Xoay phải k bước','Dịch vòng mảng sang phải k lần, in mảng sau khi dịch.','k%=n\nprint(*(a[-k:]+a[:-k] if k else a))',2,method='Tách tại vị trí n−k và ghép hai đoạn.')
array('Đưa số không về cuối','Chuyển mọi số 0 về cuối, giữ thứ tự tương đối của phần tử khác 0. In mảng kết quả.','print(*([x for x in a if x]+[0]*a.count(0)))',2,method='Lọc ổn định rồi bổ sung các số 0.')
array('Phần tử lớn hơn kế tiếp','Với mỗi vị trí i, in giá trị ở vị trí gần nhất bên phải lớn hơn a[i]. Nếu không có in NONE.','print(*(next((str(x) for x in a[i+1:] if x>a[i]),"NONE") for i in range(n)))',3,method='Ngăn xếp đơn điệu hoặc tìm kiếm bên phải.')
array('Chỉ số nhỏ hơn trước đó','Với mỗi vị trí i, in chỉ số gần nhất bên trái có giá trị nhỏ hơn a[i], đánh số 1; không có in 0.','print(*(next((j+1 for j in range(i-1,-1,-1) if a[j]<a[i]),0) for i in range(n)))',3,method='Ngăn xếp đơn điệu.')
array('Cực đại cửa sổ','In cực đại của từng cửa sổ liên tiếp có đúng k phần tử theo thứ tự từ trái sang phải.','print(*(max(a[i:i+k]) for i in range(n-k+1)))',3,method='Deque đơn điệu hoặc duyệt cửa sổ.')
array('Phân biệt trong cửa sổ','In số giá trị phân biệt trong từng cửa sổ liên tiếp dài k.','print(*(len(set(a[i:i+k])) for i in range(n-k+1)))',3,method='Bảng tần suất trượt.')
array('Tổng cửa sổ cố định','Tìm tổng lớn nhất trong các đoạn liên tiếp có đúng k phần tử.','print(max(sum(a[i:i+k]) for i in range(n-k+1)))',2,method='Tổng trượt hoặc tiền tố.')
array('Cặp có tổng đích','Đếm các cặp chỉ số i<j thỏa a[i]+a[j]=k.','print(sum(a[i]+a[j]==k for i in range(n) for j in range(i+1,n)))',3,method='Bảng tần suất số bù.')
array('Bộ ba tổng không','Đếm các bộ chỉ số i<j<t thỏa a[i]+a[j]+a[t]=0.','print(sum(sum(v)==0 for v in itertools.combinations(a,3)))',3,method='Duyệt bộ ba chỉ số.')
array('Số dương còn thiếu','Tìm số nguyên dương nhỏ nhất không xuất hiện trong mảng.','s=set(a)\nprint(next(i for i in range(1,n+2) if i not in s))',3,method='Đánh dấu các số 1..n+1.')
array('Điểm cân bằng','In mọi chỉ số i (đánh số 1) có tổng phần tử bên trái bằng tổng bên phải; không có in NONE.','v=[i+1 for i in range(n) if sum(a[:i])==sum(a[i+1:])]\nprint(" ".join(map(str,v)) or "NONE")',3,method='Tổng toàn mảng và tổng tiền tố.')
POS_CASES=['5 3\n2 1 4 1 3\n','4 2\n1 2 3 4\n','1 1\n0\n','6 4\n3 0 0 2 0 4\n','12 5\n9 0 3 3 2 7 1 4 8 8 2 5\n']
array('Nước mưa bị giữ','Các phần tử là độ cao các cột rộng 1. Tính tổng nước giữ lại sau mưa.','print(sum(max(0,min(max(a[:i+1]),max(a[i:]))-a[i]) for i in range(n)))',4,POS_CASES,'Dòng đầu n k, 1 ≤ k ≤ n ≤ 100; k không dùng. Dòng sau n độ cao 0..1000.',method='Cực đại tiền tố và hậu tố.')
array('Hai thành bình chứa','Chọn hai cột i<j làm thành bình. Tìm max((j−i)×min(a[i],a[j])); n=1 in 0.','print(max(((j-i)*min(a[i],a[j]) for i in range(n) for j in range(i+1,n)),default=0))',4,POS_CASES,'Dòng đầu n k, 1 ≤ k ≤ n ≤ 100; k không dùng. Dòng sau n độ cao 0..1000.',method='Hai con trỏ hoặc duyệt cặp.')
array('Mua bán cổ phiếu một lần','Mua rồi bán ở ngày sau, tối đa một giao dịch. In lợi nhuận lớn nhất, có thể không giao dịch.','print(max((a[j]-a[i] for i in range(n) for j in range(i+1,n)),default=0) if n==1 else max(0,max(a[j]-a[i] for i in range(n) for j in range(i+1,n))))',3,POS_CASES,method='Giữ giá thấp nhất trước ngày bán.')
array('Mua bán không giới hạn','Tối đa giữ một cổ phiếu, không phí và không bán khống. In tổng lợi nhuận lớn nhất qua nhiều giao dịch.','print(sum(max(0,y-x) for x,y in zip(a,a[1:])))',3,POS_CASES,method='Cộng mọi chênh lệch dương giữa hai ngày kề nhau.')
array('Tổng vòng tròn','Mảng nối vòng. Tìm tổng lớn nhất của đoạn không rỗng dài không quá n, cho phép đi qua cuối mảng.','print(max(sum((a+a)[i:i+l]) for i in range(n) for l in range(1,n+1)))',4,method='Kadane trên vòng hoặc duyệt điểm đầu và độ dài.')
array('XOR lớn nhất của cặp','Tìm XOR lớn nhất giữa hai phần tử ở hai chỉ số khác nhau; n=1 in 0.','print(max((x^y for x,y in itertools.combinations(a,2)),default=0))',4,POS_CASES,'Dòng đầu n k, 1 ≤ k ≤ n ≤ 100; k không dùng. Dòng sau n số nguyên 0..1000.',method='Trie bit hoặc duyệt cặp.')
array('Đoạn không lặp dài nhất','Tìm độ dài lớn nhất của đoạn liên tiếp có các giá trị đôi một khác nhau.','print(max(j-i for i in range(n) for j in range(i+1,n+1) if len(set(a[i:j]))==j-i))',3,method='Cửa sổ trượt và vị trí cuối của mỗi giá trị.')
array('Đoạn ngắn đạt ngưỡng','Tìm độ dài nhỏ nhất của đoạn liên tiếp có tổng ≥ k. Không có in 0.','print(min((j-i for i in range(n) for j in range(i+1,n+1) if sum(a[i:j])>=k),default=0))',3,POS_CASES,method='Hai con trỏ trên mảng không âm.')
array('Hạng ổn định','Với mỗi a[i], in hạng của nó trong thứ tự tăng dần ổn định, đánh số từ 1. Giá trị bằng nhau ưu tiên chỉ số cũ nhỏ hơn.','order=sorted(range(n),key=lambda i:(a[i],i))\nr=[0]*n\nfor j,i in enumerate(order,1):r[i]=j\nprint(*r)',3,method='Sắp xếp các cặp giá trị và chỉ số.')
array('Nén tọa độ','In mã nén của mỗi phần tử: các giá trị phân biệt tăng dần nhận mã 1,2,… Giá trị bằng nhau chung mã.','d={x:i+1 for i,x in enumerate(sorted(set(a)))}\nprint(*(d[x] for x in a))',3,method='Sắp xếp tập giá trị, ánh xạ về thứ hạng.')
array('Số bước tăng thành không giảm','Mỗi bước tăng một phần tử lên 1. In số bước ít nhất để mảng không giảm.','ans=0\nfor i in range(1,n):\n if a[i]<a[i-1]:ans+=a[i-1]-a[i];a[i]=a[i-1]\nprint(ans)',3,method='Tham lam nâng phần tử lên cực đại trước đó.')
PERM=['5 3\n2 1 4 5 3\n','4 2\n1 2 3 4\n','1 1\n1\n','6 4\n6 5 4 3 2 1\n','12 5\n2 3 4 5 6 7 8 9 10 11 12 1\n']
CYCLES='seen=set();cycles=0\nfor i in range(n):\n if i in seen:continue\n cycles+=1;j=i\n while j not in seen:seen.add(j);j=a[j]-1\n'
array('Chu trình hoán vị','Xem a là ánh xạ i→a[i] trên 1..n. In số chu trình trong hoán vị. ',CYCLES+'print(cycles)',3,PERM,'Dòng đầu n k, 1 ≤ k ≤ n ≤ 100; k không dùng. Dòng sau là hoán vị 1..n.',method='Duyệt các chu trình chưa thăm.')
array('Đổi chỗ để sắp hoán vị','Mỗi bước đổi hai vị trí bất kỳ của hoán vị. In số bước ít nhất để đưa về 1,2,…,n.',CYCLES+'print(n-cycles)',4,PERM,'Dòng đầu n k, 1 ≤ k ≤ n ≤ 100; k không dùng. Dòng sau hoán vị 1..n.',method='Mỗi chu trình dài c cần c−1 đổi chỗ.')
array('Tích trừ chính mình','In n tích, phần tử thứ i là tích của tất cả a[j] với j≠i; tích tập rỗng bằng 1.','print(*(math.prod(a[:i]+a[i+1:]) for i in range(n)))',3,method='Tích tiền tố và hậu tố, xử lý số 0 tự nhiên.')
array('Giao đa tập với dãy đầu','In giao đa tập giữa a và [1,2,…,k], tăng dần, mỗi số lấy tối đa một lần; rỗng in NONE.','v=sorted(set(a)&set(range(1,k+1)))\nprint(" ".join(map(str,v)) or "NONE")',2,method='Giao hai tập hợp.')
def intervals(title,desc,code,method):
    cases=['3\n1 3\n2 5\n7 9\n','2\n1 2\n4 5\n','1\n0 0\n','4\n1 10\n2 3\n4 6\n6 8\n','6\n0 3\n1 4\n3 5\n5 7\n6 8\n8 9\n']
    add('Arrays',title,4,desc,'Dòng đầu n (1 ≤ n ≤ 100), sau đó n dòng l r với 0 ≤ l ≤ r ≤ 1000. Các khoảng được xem là nửa mở [l,r), trừ bài gộp dùng đoạn đóng.', 'n=int(input())\na=[tuple(map(int,input().split())) for _ in range(n)]\n'+code,cases,method)
intervals('Gộp đoạn giao nhau','Gộp các đoạn đóng giao nhau thành đoạn cực đại. In số đoạn rồi mỗi đoạn l r trên một dòng.','a.sort();out=[]\nfor l,r in a:\n if out and l<=out[-1][1]:out[-1][1]=max(out[-1][1],r)\n else:out.append([l,r])\nprint(len(out))\nfor v in out:print(*v)','Sắp xếp đầu trái, mở rộng đoạn hiện tại.')
intervals('Phòng họp tối thiểu','Các cuộc họp chiếm [l,r), cuộc họp r=l không chiếm phòng. In số phòng ít nhất để xếp mọi cuộc họp.','print(max((sum(l<=t<r for l,r in a) for t in range(1001)),default=0))','Quét các thời điểm bắt đầu và kết thúc.')
intervals('Lịch họp nhiều nhất','Chọn nhiều cuộc họp nhất không chồng lấn. Cuộc họp r=l có thể chọn và không chiếm thời gian. In số cuộc họp tối đa.','empty=sum(l==r for l,r in a);last=-1;ans=empty\nfor l,r in sorted((v for v in a if v[0]<v[1]),key=lambda v:v[1]):\n if l>=last:ans+=1;last=r\nprint(ans)','Tham lam theo thời điểm kết thúc; đếm riêng khoảng rỗng.')
MATRIX_CASES=['2 3\n1 2 3\n4 5 6\n','2 2\n1 0\n0 1\n','1 1\n0\n','1 5\n5 4 3 2 1\n','4 4\n9 1 8 2\n3 7 4 6\n5 0 2 1\n1 3 9 4\n']
def matrix(title,desc,code,method):
    add('Arrays',title,3,desc,'Dòng đầu n m (1 ≤ n,m ≤ 20). Sau đó n dòng, mỗi dòng m số nguyên 0..1000.','n,m=map(int,input().split())\na=[list(map(int,input().split())) for _ in range(n)]\n'+code,MATRIX_CASES,method,'O(nm)')
matrix('Chuyển vị ma trận','In ma trận chuyển vị: m dòng, mỗi dòng n số.','for row in zip(*a):print(*row)','Đổi hàng thành cột.')
matrix('Duyệt ma trận xoắn ốc','In các phần tử theo chiều kim đồng hồ, bắt đầu góc trên trái, trên một dòng.','out=[]\nwhile a:\n out+=a.pop(0)\n a=[list(r) for r in zip(*a)][::-1] if a else []\nprint(*out)','Bóc lớp ngoài rồi quay ma trận còn lại.')
matrix('Đường đi ít chi phí','Từ ô trên trái đến ô dưới phải, chỉ đi phải hoặc xuống. Chi phí là tổng giá trị ô đã qua, kể cả hai đầu. In chi phí nhỏ nhất.','for i in range(n):\n for j in range(m):\n  if i or j:a[i][j]+=min(a[i-1][j] if i else 10**30,a[i][j-1] if j else 10**30)\nprint(a[-1][-1])','DP theo hàng và cột.')

# String tasks have a strict ASCII contract, so byte/codepoint behavior agrees in all languages.
STR_CASES=['ababa\n','abc\n','a\n','aaaaaa\n','cabbaacabc\n']
def string(title,desc,code,level=3,cases=None,contract='Một dòng s gồm 1..100 chữ cái thường a..z.',method='Duyệt và xử lý chuỗi theo mô tả.'):
    add('Strings',title,level,desc,contract,code,cases or STR_CASES,method,'O(n³) hoặc tốt hơn')
TWO=['ababa\naba\n','abc\nbcd\n','a\na\n','aaaaaa\naa\n','cabbaacabc\nacba\n']
string('Hai chuỗi đảo chữ','In 1 nếu hai dòng s,t là hoán vị ký tự của nhau, ngược lại 0.','s=input();t=input()\nprint(int(sorted(s)==sorted(t)))',2,TWO,'Hai dòng s,t, mỗi dòng 1..100 chữ a..z.', 'So sánh bảng tần suất.')
string('Đếm mẫu chồng lấn','Đếm vị trí bắt đầu của mẫu t trong s, cho phép các lần xuất hiện chồng nhau.','s=input();t=input()\nprint(sum(s.startswith(t,i) for i in range(len(s))))',3,TWO,'Hai dòng s,t, mỗi dòng 1..100 chữ a..z.','So khớp tại từng vị trí hoặc KMP.')
string('Hàm tiền tố KMP','Với mỗi tiền tố kết thúc tại i, in độ dài tiền tố thực sự dài nhất cũng là hậu tố của đoạn đó. In n số.','s=input();p=[0]*len(s)\nfor i in range(1,len(s)):\n j=p[i-1]\n while j and s[i]!=s[j]:j=p[j-1]\n if s[i]==s[j]:j+=1\n p[i]=j\nprint(*p)',4,method='Truy hồi qua các biên của tiền tố.')
string('Mảng Z','In Z[i]: độ dài tiền tố chung dài nhất của s và hậu tố bắt đầu tại i. Quy ước Z[0]=n.','s=input();z=[]\nfor i in range(len(s)):\n j=0\n while i+j<len(s) and s[j]==s[i+j]:j+=1\n z.append(j)\nprint(*z)',4,method='So khớp tiền tố với từng hậu tố.')
string('Chu kỳ ngắn nhất','Tìm độ dài nhỏ nhất p sao cho s là phép lặp nguyên lần của một chuỗi dài p.','s=input();n=len(s)\nprint(next(p for p in range(1,n+1) if n%p==0 and s==s[:p]*(n//p)))',3,method='Thử các ước của độ dài.')
string('Mọi biên của chuỗi','In tăng dần độ dài các tiền tố thực sự đồng thời là hậu tố, rỗng in NONE.','s=input();v=[i for i in range(1,len(s)) if s[:i]==s[-i:]]\nprint(" ".join(map(str,v)) or "NONE")',3,method='Kiểm tra các biên hoặc chuỗi liên kết KMP.')
string('Tương đương phép quay','In 1 nếu t là một phép quay vòng của s, ngược lại 0.','s=input();t=input()\nprint(int(len(s)==len(t) and t in s+s))',3,TWO,'Hai dòng s,t, mỗi dòng 1..100 chữ a..z.','Tìm t trong s+s và kiểm tra độ dài.')
string('Phép quay nhỏ nhất','In phép quay vòng nhỏ nhất theo thứ tự từ điển của s.','s=input()\nprint(min(s[i:]+s[:i] for i in range(len(s))))',4,method='So sánh mọi phép quay.')
string('Khoảng cách sửa chuỗi','Mỗi bước thêm, xóa hoặc thay một ký tự tốn 1. In số bước ít nhất biến s thành t.','s=input();t=input();d=list(range(len(t)+1))\nfor i,x in enumerate(s,1):\n nd=[i]+[0]*len(t)\n for j,y in enumerate(t,1):nd[j]=min(d[j]+1,nd[j-1]+1,d[j-1]+(x!=y))\n d=nd\nprint(d[-1])',4,TWO,'Hai dòng s,t, mỗi dòng 1..100 chữ a..z.','DP theo hai tiền tố.')
string('Dãy con chung hai chuỗi','In độ dài dãy con chung dài nhất của s và t; dãy con không cần liên tiếp.','s=input();t=input();d=[0]*(len(t)+1)\nfor x in s:\n nd=[0]*(len(t)+1)\n for j,y in enumerate(t,1):nd[j]=d[j-1]+1 if x==y else max(d[j],nd[j-1])\n d=nd\nprint(d[-1])',4,TWO,'Hai dòng s,t, mỗi dòng 1..100 chữ a..z.','DP LCS.')
string('Mẫu dấu hỏi và sao','Mẫu p gồm a..z, ? khớp đúng một ký tự, * khớp chuỗi bất kỳ kể cả rỗng. In 1 nếu p khớp toàn bộ s.','s=input();p=input();d=[True]+[False]*len(s)\nfor c in p:\n nd=[False]*(len(s)+1);nd[0]=d[0] and c=="*"\n for j in range(1,len(s)+1):nd[j]=(d[j] or nd[j-1]) if c=="*" else d[j-1] and (c=="?" or c==s[j-1])\n d=nd\nprint(int(d[-1]))',4,['abc\na*c\n','abc\n?b?\n','a\n*\n','aaaa\na?b*\n','cabbaacabc\n*c?bc\n'],'Dòng đầu s gồm 1..100 chữ thường. Dòng hai mẫu p dài 1..100.','DP khớp mẫu theo tiền tố.')
BRACK=['(()())\n','()\n','(\n',')()(\n','())(()(()))\n']
string('Ngoặc đúng nhiều loại','In 1 nếu chuỗi ngoặc (),[],{} lồng nhau đúng và đóng đủ, ngược lại 0.','s=input();st=[];ok=True\npairs={")":"(","]":"[","}":"{"}\nfor c in s:\n if c in "([{":st.append(c)\n elif not st or st.pop()!=pairs[c]:ok=False;break\nprint(int(ok and not st))',3,['([]){}\n','()\n','[\n','([)]\n','{[()()]}[]\n'],'Một dòng dài 1..100 chỉ gồm ()[]{}.', 'Ngăn xếp ký tự mở.')
string('Bổ sung ngoặc tối thiểu','Chỉ chèn dấu ( hoặc ) vào s để chuỗi ngoặc đúng. In số ký tự cần chèn ít nhất.','s=input();bal=ans=0\nfor c in s:\n if c=="(":bal+=1\n elif bal:bal-=1\n else:ans+=1\nprint(ans+bal)',3,BRACK,'Một dòng dài 1..100 chỉ gồm ( và ).','Đếm ngoặc đóng thiếu và ngoặc mở còn dư.')
string('Đoạn ngoặc đúng dài nhất','In độ dài đoạn con liên tiếp là chuỗi ngoặc đúng dài nhất, không có in 0.','s=input();st=[-1];ans=0\nfor i,c in enumerate(s):\n if c=="(":st.append(i)\n else:\n  st.pop()\n  if not st:st.append(i)\n  else:ans=max(ans,i-st[-1])\nprint(ans)',4,BRACK,'Một dòng dài 1..100 chỉ gồm ( và ).','Ngăn xếp các chỉ số chưa ghép.')
string('Mã hóa độ dài chạy','Chia s thành các nhóm ký tự liên tiếp bằng nhau. In mỗi nhóm dạng ký_tự:số_lần, cách nhau một dấu cách.','s=input()\nprint(" ".join(c+":"+str(len(list(g))) for c,g in itertools.groupby(s)))',2,method='Nhóm các ký tự kề nhau bằng nhau.')
string('Giải mã độ dài chạy','Đầu vào gồm các nhóm c:k cách nhau dấu cách. In chuỗi sau giải nén.','print("".join(c*int(k) for c,k in (v.split(":") for v in input().split())))',2,['a:2 b:3\n','c:1 d:1\n','z:1\n','a:100\n','a:3 c:2 b:5 a:1\n'],'Một dòng gồm 1..100 nhóm c:k, c là chữ a..z, 1 ≤ k ≤ 100; tổng k ≤ 10000.','Lặp ký tự theo số lần xuất hiện.')
string('Xóa cặp kề nhau','Liên tục xóa cặp ký tự kề nhau bằng nhau cho đến khi không còn. In kết quả, hoặc EMPTY nếu rỗng.','s=input();st=[]\nfor c in s:\n if st and st[-1]==c:st.pop()\n else:st.append(c)\nprint("".join(st) or "EMPTY")',3,method='Ngăn xếp rút gọn các cặp.')
string('Dãy con ký tự duy nhất','Chọn dãy con chứa mỗi ký tự phân biệt trong s đúng một lần. In dãy nhỏ nhất từ điển.','s=input();left=collections.Counter(s);st=[];used=set()\nfor c in s:\n left[c]-=1\n if c in used:continue\n while st and st[-1]>c and left[st[-1]]:used.remove(st.pop())\n st.append(c);used.add(c)\nprint("".join(st))',4,method='Ngăn xếp tham lam với số lần xuất hiện còn lại.')
string('Ghép số lớn nhất','Sắp các số thập phân để chuỗi ghép có giá trị lớn nhất. Chỉ in 0 nếu tất cả số bằng 0.','a=input().split();a.sort(key=functools.cmp_to_key(lambda x,y:(x+y<y+x)-(x+y>y+x)))\nprint("".join(a).lstrip("0") or "0")',4,['3 30 34 5 9\n','10 2\n','0\n','0 0 0\n','121 12 9 91 90\n'],'Một dòng gồm 1..100 số nguyên 0..1000, không có số 0 thừa ở đầu.','So sánh x+y và y+x.')
string('Đọc số La Mã','Cho một số La Mã chuẩn trong 1..3999, in giá trị thập phân.','s=input();d=dict(I=1,V=5,X=10,L=50,C=100,D=500,M=1000)\nprint(sum(-d[c] if i+1<len(s) and d[c]<d[s[i+1]] else d[c] for i,c in enumerate(s)))',3,['XIV\n','IX\n','I\n','MMMCMXCIX\n','MCMXLIV\n'],'Một dòng là biểu diễn La Mã chuẩn, 1..3999.','Trừ chữ số đứng trước một chữ số lớn hơn.')
string('Tên cột bảng tính','A=1, Z=26, AA=27,… Cho tên cột, in chỉ số.','s=input();n=0\nfor c in s:n=n*26+ord(c)-64\nprint(n)',2,['AA\n','Z\n','A\n','ZZZZ\n','CODE\n'],'Một dòng 1..4 chữ A..Z.','Tích lũy cơ số 26 không có chữ số 0.')
string('Cộng số nguyên lớn','Cho hai số nguyên không âm dạng thập phân, in tổng chính xác không có số 0 thừa.','print(int(input())+int(input()))',2,['123\n456\n','99\n1\n','0\n0\n','999999999999999999999999999999\n1\n','120034005600\n998877665544\n'],'Hai dòng, mỗi dòng 1..100 chữ số, cho phép số 0 ở đầu.','Cộng từng cột hoặc số nguyên đa độ chính xác.')
string('Nhân số nguyên lớn','Cho hai số nguyên không âm dạng thập phân, in tích chính xác không có số 0 thừa.','print(int(input())*int(input()))',3,['123\n456\n','99\n99\n','0\n1\n','999999999999999999999999\n999999999999999999999999\n','123456789\n987654321\n'],'Hai dòng, mỗi dòng 1..100 chữ số.','Nhân dài hoặc số nguyên đa độ chính xác.')
string('So sánh phiên bản','Phiên bản gồm các số nguyên phân cách bằng dấu chấm. Bỏ số 0 thừa và coi thành phần thiếu là 0. In −1,0,1 khi phiên bản dòng đầu nhỏ hơn,bằng,lớn hơn dòng sau.','a=list(map(int,input().split(".")));b=list(map(int,input().split(".")));n=max(len(a),len(b));a+=[0]*(n-len(a));b+=[0]*(n-len(b))\nprint((a>b)-(a<b))',3,['1.2\n1.10\n','2.0\n1.9\n','0\n0.0\n','01.002.000\n1.2\n','3.0.1.9\n3.0.1.8\n'],'Hai dòng phiên bản, mỗi dòng 1..20 thành phần, mỗi thành phần 1..4 chữ số.','So sánh từ điển danh sách số đã thêm đuôi 0.')
string('Kiểm tra IPv4','In 1 nếu s là IPv4 gồm đúng bốn số 0..255 phân cách dấu chấm, không có số 0 ở đầu trừ chính số 0. Ngược lại 0.','p=input().split(".")\nprint(int(len(p)==4 and all(v.isascii() and v.isdigit() and len(v)<=3 and str(int(v))==v and int(v)<=255 for v in p)))',3,['192.168.1.1\n','255.255.255.255\n','0.0.0.0\n','01.2.3.4\n','256.7.8.9\n'],'Một dòng 1..100 ký tự ASCII không chứa khoảng trắng.','Tách chuỗi và kiểm tra từng thành phần.')
string('Chuẩn hóa đường dẫn','Cho đường dẫn tuyệt đối Unix. Rút gọn / lặp, . và ..; .. tại gốc giữ ở gốc. In đường dẫn chuẩn.','s=input();st=[]\nfor p in s.split("/"):\n if p=="..":\n  if st:st.pop()\n elif p and p!=".":st.append(p)\nprint("/"+"/".join(st))',3,['/a/./b/../c\n','/a//b/\n','/\n','/../../a\n','/x/y/../z/./../w\n'],'Một đường dẫn tuyệt đối dài 1..100, tên thư mục gồm chữ thường.','Ngăn xếp thành phần đường dẫn.')
string('Tiền tố chung nhiều từ','Cho các từ trên một dòng. In tiền tố chung dài nhất, rỗng in EMPTY.','a=input().split();p=a[0]\nfor s in a[1:]:\n while not s.startswith(p):p=p[:-1]\nprint(p or "EMPTY")',3,['flower flow flight\n','abc abd\n','a\n','abc xyz\n','interview interval internal internet\n'],'Một dòng 1..100 từ, mỗi từ 1..100 chữ a..z.','Thu hẹp tiền tố chung qua từng từ.')
string('Tần suất từ','Tách các từ bằng dấu cách, phân biệt hoa thường. In mỗi từ và số lần trên một dòng theo thứ tự từ điển.','d=collections.Counter(input().split())\nfor w in sorted(d):print(w,d[w])',2,['red blue red\n','a b\n','a\n','z z z z\n','code grade code network grade Code\n'],'Một dòng có 1..100 từ, mỗi từ gồm chữ ASCII.','Bảng đếm và sắp xếp khóa.')
string('Dịch Caesar','Giải mã Caesar dịch tiến k chữ: lùi mỗi chữ thường của s đi k vị trí theo vòng alphabet.','k=int(input());s=input()\nprint("".join(chr((ord(c)-97-k)%26+97) for c in s))',2,['3\nkhoor\n','1\nbcd\n','0\na\n','25\nzaaz\n','13\npbqrtenqr\n'],'Dòng đầu k (0..25), dòng sau s dài 1..100 chữ a..z.','Số học modulo 26.')
string('Giải mã bàn phím T9','Mỗi chữ a..z ánh xạ tới phím điện thoại 2..9: abc→2, def→3,…,wxyz→9. In dãy phím cho s.','s=input();d={c:str(i+2) for i,g in enumerate(["abc","def","ghi","jkl","mno","pqrs","tuv","wxyz"]) for c in g}\nprint("".join(d[c] for c in s))',2,method='Bảng ánh xạ chữ sang phím.')
string('Chuỗi con chung liên tiếp','In độ dài chuỗi con liên tiếp dài nhất xuất hiện trong cả s và t.','s=input();t=input();ans=0\nfor i in range(len(s)):\n for j in range(i+1,len(s)+1):\n  if s[i:j] in t:ans=max(ans,j-i)\nprint(ans)',4,TWO,'Hai dòng s,t, mỗi dòng 1..100 chữ a..z.','DP hậu tố chung hoặc duyệt các chuỗi con.')
string('Vị trí ký tự duy nhất đầu tiên','In chỉ số 1-based đầu tiên của ký tự xuất hiện đúng một lần, không có in 0.','s=input();d=collections.Counter(s)\nprint(next((i+1 for i,c in enumerate(s) if d[c]==1),0))',2,method='Đếm tần suất rồi quét lại chuỗi.')
string('Xen kẽ hai chuỗi','Cho s,t cùng độ dài. In s[1]t[1]s[2]t[2]…','s=input();t=input()\nprint("".join(x+y for x,y in zip(s,t)))',2,['abc\nxyz\n','ab\ncd\n','a\nz\n','aaaa\nbbbb\n','network\ngrading\n'],'Hai dòng s,t cùng độ dài 1..100, gồm chữ a..z.','Ghép xen kẽ theo chỉ số.')

NT_HELP='''
def factor(n):
 d={};p=2
 while p*p<=n:
  while n%p==0:d[p]=d.get(p,0)+1;n//=p
  p+=1
 if n>1:d[n]=d.get(n,0)+1
 return d
def prime(n):return n>=2 and all(n%i for i in range(2,math.isqrt(n)+1))
def divisors(n):return [i for i in range(1,n+1) if n%i==0]
def phi(n):
 r=n
 for p in factor(n):r=r//p*(p-1)
 return r
def order(a,m):
 x=1
 for k in range(1,m+1):
  x=x*a%m
  if x==1:return k
 return 0
'''
def nt(title,desc,code,level=3,cases=None,contract='Một số nguyên n, 1 ≤ n ≤ 1000.',method='Phân tích thừa số hoặc duyệt các ước.'):
    add('NumberTheory',title,level,desc,contract,'v=list(map(int,input().split()))\nn=v[0]\n'+code,cases or ['12\n','7\n','1\n','1000\n','360\n'],method,'O(n²) hoặc tốt hơn',NT_HELP)
nt('Phân tích thừa số nguyên tố','In p e trên từng dòng với n=∏p^e, p tăng dần. n=1 in NONE.','d=factor(n)\nif not d:print("NONE")\nfor p,e in d.items():print(p,e)',method='Chia thử đến căn bậc hai.')
nt('Ước nguyên tố lớn nhất','In ước nguyên tố lớn nhất của n, n=1 in 0.','print(max(factor(n),default=0))')
nt('Số thừa số phân biệt','Đếm số nguyên tố phân biệt chia hết n, n=1 cho kết quả 0.','print(len(factor(n)))')
nt('Tổng số mũ nguyên tố','Nếu n=∏p^e, in tổng các số mũ e. n=1 cho kết quả 0.','print(sum(factor(n).values()))')
nt('Số không chứa bình phương','In 1 nếu không có số nguyên d>1 sao cho d² chia hết n, ngược lại 0.','print(int(all(e==1 for e in factor(n).values())))')
nt('Hàm Möbius','In μ(n): bằng 0 nếu n có thừa số bình phương >1; ngược lại bằng (−1)^k với k là số nguyên tố phân biệt. μ(1)=1.','d=factor(n)\nprint(0 if any(e>1 for e in d.values()) else (-1)**len(d))',4)
nt('Tích nguyên tố phân biệt','In tích mọi ước nguyên tố phân biệt của n; tích rỗng bằng 1.','print(math.prod(factor(n)))')
nt('Ước nguyên tố nhỏ nhất','In ước nguyên tố nhỏ nhất của n; n=1 in 0.','print(min(factor(n),default=0))',2)
nt('Ước thứ k','Sắp các ước dương của n tăng dần. In ước thứ k, không đủ k ước in −1.','n,k=v\nd=divisors(n)\nprint(d[k-1] if k<=len(d) else -1)',3,['12 4\n','7 2\n','1 1\n','1000 30\n','360 12\n'],'Hai số n k, 1 ≤ n,k ≤ 1000.')
nt('Tổng GCD với một số','Tính gcd(1,n)+gcd(2,n)+…+gcd(n,n).','print(sum(math.gcd(i,n) for i in range(1,n+1)))',3,method='Duyệt i và Euclid.')
nt('LCM của đoạn đầu','In bội chung nhỏ nhất dương của mọi số từ 1 đến n.','print(math.lcm(*range(1,n+1)))',3,['10\n','7\n','1\n','100\n','37\n'],'Một số nguyên n, 1 ≤ n ≤ 100.',method='Tích lũy LCM bằng GCD.')
nt('Số mũ nguyên tố trong giai thừa','Cho n và nguyên tố p. In số mũ lớn nhất e sao cho p^e chia hết n!.','n,p=v\nr=0\nwhile n:n//=p;r+=n\nprint(r)',3,['10 2\n','7 3\n','1 2\n','1000 997\n','1000 5\n'],'Hai số n p, 1 ≤ n ≤ 1000, p nguyên tố 2..1000.',method='Công thức Legendre.')
nt('Tổ hợp theo modulo bất kỳ','In C(n,k) modulo m; m không bắt buộc nguyên tố.','n,k,m=v\nprint(math.comb(n,k)%m)',4,['10 3 12\n','7 2 5\n','0 0 2\n','100 50 1000\n','37 18 97\n'],'Ba số n k m, 0 ≤ k ≤ n ≤ 100, 2 ≤ m ≤ 1000.',method='Pascal hoặc tổ hợp nguyên chính xác trước khi lấy dư.')
nt('Nghịch đảo modulo','In x nhỏ nhất trong [0,m−1] sao cho a×x≡1 (mod m), không có in −1.','a,m=v\nprint(next((x for x in range(m) if a*x%m==1),-1))',4,['3 7\n','2 4\n','1 2\n','997 1000\n','17 43\n'],'Hai số a m, 1 ≤ a ≤ 1000, 2 ≤ m ≤ 1000.',method='Euclid mở rộng hoặc duyệt phần dư.')
nt('Phương trình đồng dư tuyến tính','In tất cả nghiệm x thuộc [0,m−1] thỏa a×x≡b (mod m), tăng dần; không có in NONE.','a,b,m=v\ns=[x for x in range(m) if (a*x-b)%m==0]\nprint(" ".join(map(str,s)) or "NONE")',4,['6 4 8\n','3 1 7\n','1 0 2\n','1000 999 1000\n','12 0 36\n'],'Ba số a b m, 1 ≤ a ≤ 1000, 0 ≤ b ≤ 1000, 2 ≤ m ≤ 1000.',method='Kiểm tra GCD và các nghiệm cách nhau m/g.')
nt('Ghép hai đồng dư','In số nguyên x≥0 nhỏ nhất thỏa x≡a (mod m), x≡b (mod k); không có in −1.','a,m,b,k=v\nprint(next((x for x in range(a,math.lcm(m,k),m) if x%k==b),-1))',4,['2 3 3 5\n','1 4 3 6\n','0 2 0 3\n','1 4 2 6\n','12 97 21 89\n'],'Bốn số a m b k, 2 ≤ m,k ≤ 100, 0 ≤ a<m, 0 ≤ b<k.',method='Định lý số dư Trung Hoa tổng quát.')
nt('Bậc nhân modulo','Cho gcd(a,m)=1. In k dương nhỏ nhất sao cho a^k≡1 (mod m).','a,m=v\nprint(order(a,m))',4,['2 7\n','3 10\n','1 2\n','2 997\n','17 100\n'],'Hai số a m, 1 ≤ a<m ≤ 1000 và gcd(a,m)=1.',method='Duyệt lũy thừa trong nhóm nhân.')
nt('Căn nguyên thủy nhỏ nhất','Cho nguyên tố p. In g nhỏ nhất trong [1,p−1] có bậc nhân bằng p−1.','print(next(g for g in range(1,n) if order(g,n)==n-1))',5,['7\n','5\n','2\n','997\n','101\n'],'Một nguyên tố p, 2 ≤ p ≤ 1000.',method='Kiểm tra bậc nhân bằng các ước của p−1.')
nt('Số căn nguyên thủy','Cho nguyên tố p. Đếm g thuộc [1,p−1] có bậc nhân p−1.','print(phi(n-1))',4,['7\n','5\n','2\n','997\n','101\n'],'Một nguyên tố p, 2 ≤ p ≤ 1000.',method='Số phần tử sinh của nhóm cyclic bằng φ(p−1).')
nt('Nguyên tố tiếp theo','In số nguyên tố nhỏ nhất lớn hơn n.','p=n+1\nwhile not prime(p):p+=1\nprint(p)',3,method='Tăng dần và thử chia.')
nt('Cặp nguyên tố sinh đôi','Đếm cặp (p,p+2) với cả hai nguyên tố và p+2≤n.','print(sum(prime(p) and prime(p+2) for p in range(2,n-1)))',3,method='Sàng hoặc kiểm tra nguyên tố.')
nt('Phân tích Goldbach','Với n chẵn, đếm cặp nguyên tố p≤q thỏa p+q=n.','print(sum(prime(p) and prime(n-p) for p in range(2,n//2+1)))',3,['10\n','8\n','4\n','1000\n','100\n'],'Một số chẵn n, 4 ≤ n ≤ 1000.',method='Kiểm tra nguyên tố và chỉ xét p≤n/2.')
nt('Cặp bạn bè','Đặt s(x) là tổng ước dương nhỏ hơn x. In s(n) nếu s(n)≠n, s(n)>0 và s(s(n))=n; ngược lại in 0.','s=lambda x:sum(divisors(x)[:-1])\na=s(n)\nprint(a if a>0 and a!=n and s(a)==n else 0)',4,['220\n','284\n','1\n','1000\n','6\n'],method='Tính tổng ước của n và đối tác, kiểm tra hai chiều.')
nt('Hàm Carmichael','In số nguyên dương nhỏ nhất k sao cho a^k≡1 (mod n) với mọi a nguyên tố cùng nhau với n. Quy ước λ(1)=1.','v=[]\nfor p,e in factor(n).items():v.append(2**(e-2) if p==2 and e>=3 else (p-1)*p**(e-1))\nprint(math.lcm(*v))',5,method='LCM chu kỳ nhóm nhân của từng lũy thừa nguyên tố.')
nt('Biểu diễn thành hai bình phương','Đếm cặp số nguyên 0≤a≤b thỏa a²+b²=n.','print(sum(a*a+b*b==n for a in range(math.isqrt(n)+1) for b in range(a,math.isqrt(n)+1)))',3,method='Duyệt a và kiểm tra bình phương còn lại.')
nt('Tổng hai lập phương','Đếm cặp nguyên không âm a≤b thỏa a³+b³=n.','print(sum(a**3+b**3==n for a in range(11) for b in range(a,11)))',3,method='Duyệt a, tìm căn bậc ba phần còn lại.')
nt('Bộ ba Pythagore nguyên thủy','Đếm bộ a<b<c≤n thỏa a²+b²=c² và gcd(a,b,c)=1.','ans=0\nfor a in range(1,n+1):\n for b in range(a+1,n+1):\n  c=math.isqrt(a*a+b*b)\n  ans+=c<=n and c*c==a*a+b*b and math.gcd(a,b)==1\nprint(ans)',4,['10\n','5\n','1\n','100\n','65\n'],'Một số nguyên n, 1 ≤ n ≤ 100.',method='Duyệt hai cạnh, kiểm tra căn và GCD.')
nt('Tổng cấp số nhân modulo','Tính 1+a+a²+…+a^n modulo m, không dùng chia modulo khi a−1 không khả nghịch.','a,n,m=v\nr=0;x=1\nfor _ in range(n+1):r=(r+x)%m;x=x*a%m\nprint(r)',4,['2 10 1000\n','3 5 8\n','1 0 2\n','999 1000 1000\n','4 25 21\n'],'Ba số a n m, 1 ≤ a ≤ 1000, 0 ≤ n ≤ 1000, 2 ≤ m ≤ 1000.',method='Tích lũy tổng và lũy thừa trong modulo.')
nt('Chữ số cuối khác không của giai thừa','Xóa mọi chữ số 0 ở cuối n!. In chữ số cuối còn lại.','x=math.factorial(n)\nwhile x%10==0:x//=10\nprint(x%10)',4,['10\n','7\n','1\n','1000\n','125\n'],method='Tách thừa số 10 hoặc dùng số nguyên lớn.')
nt('Ký hiệu Legendre','Cho nguyên tố lẻ p và a. In 0 nếu p chia a, 1 nếu a là bình phương khác 0 modulo p, −1 nếu không.','a,p=v\nx=pow(a%p,(p-1)//2,p)\nprint(-1 if x==p-1 else x)',4,['2 7\n','3 7\n','0 3\n','998 997\n','17 101\n'],'Hai số a p, 0 ≤ a ≤ 1000, p nguyên tố lẻ ≤1000.',method='Tiêu chuẩn Euler.')
nt('Căn bậc hai modulo','In mọi x trong [0,m−1] thỏa x²≡a (mod m), tăng dần; không có in NONE.','a,m=v\ns=[x for x in range(m) if (x*x-a)%m==0]\nprint(" ".join(map(str,s)) or "NONE")',4,['4 7\n','3 7\n','0 2\n','0 1000\n','1 120\n'],'Hai số a m, 0 ≤ a ≤ 1000, 2 ≤ m ≤ 1000.',method='Duyệt lớp dư, áp dụng được modulo hợp số.')
nt('Tổ hợp Lucas','Tính C(n,k) modulo nguyên tố p khi n lớn. Nếu k>n, kết quả 0.','n,k,p=v\nr=1\nwhile n or k:\n a,b=n%p,k%p\n if b>a:r=0;break\n r=r*math.comb(a,b)%p;n//=p;k//=p\nprint(r)',5,['100 20 7\n','10 3 3\n','0 0 2\n','1000000000000 500000000000 97\n','5 9 11\n'],'Ba số n k p, 0 ≤ n,k ≤ 10^12, p nguyên tố 2..100.',method='Định lý Lucas theo chữ số cơ số p.')
nt('Chu kỳ thập phân','In độ dài phần tuần hoàn của phân số 1/n. Thập phân hữu hạn có chu kỳ 0.','r=1%n;seen={};i=0\nwhile r and r not in seen:seen[r]=i;i+=1;r=r*10%n\nprint(i-seen[r] if r else 0)',4,method='Theo dõi phần dư khi chia dài.')

SEQ_CASES=['5 3\n2 1 4 1 3\n','4 2\n1 2 3 4\n','1 1\n1\n','6 4\n3 1 1 2 1 4\n','12 5\n9 1 3 3 2 7 1 4 8 8 2 5\n']
def seq(title,desc,code,level=4,cases=None,contract=None,method='Quy hoạch động theo tiền tố và trạng thái.'):
    add('Sequences',title,level,desc,contract or 'Dòng đầu n k, 1 ≤ k ≤ n ≤ 16. Dòng sau n số nguyên dương a[i] ≤ 100.',ARR_READ+code,cases or SEQ_CASES,method,'O(n³) hoặc O(2^n n) với n≤16')
seq('Ít đồng xu nhất','Các a[i] là mệnh giá, mỗi loại dùng vô hạn. In số đồng ít nhất tạo tổng k, không có in −1.','d=[0]+[10**9]*k\nfor x in range(1,k+1):\n for c in set(a):\n  if c<=x:d[x]=min(d[x],d[x-c]+1)\nprint(d[k] if d[k]<10**9 else -1)',3,method='DP tổng nhỏ đến lớn.')
seq('Đổi tiền không xét thứ tự','Đếm cách dùng các mệnh giá phân biệt trong a, dùng vô hạn, tạo tổng k. Thứ tự đồng xu không quan trọng.','d=[1]+[0]*k\nfor c in sorted(set(a)):\n for x in range(c,k+1):d[x]+=d[x-c]\nprint(d[k])',4,method='Duyệt loại đồng trước, tổng sau.')
seq('Ghép tiền có thứ tự','Đếm dãy mệnh giá có tổng k, dùng vô hạn các giá trị phân biệt trong a. Hai thứ tự khác nhau tính riêng.','d=[1]+[0]*k\nfor x in range(1,k+1):d[x]=sum(d[x-c] for c in set(a) if c<=x)\nprint(d[k])',4,method='Duyệt tổng trước, chọn đồng cuối.')
seq('Số tập con đạt tổng','Mỗi chỉ số chỉ chọn một lần. Đếm tập con chỉ số có tổng k.','d=[1]+[0]*k\nfor c in a:\n for x in range(k,c-1,-1):d[x]+=d[x-c]\nprint(d[k])',4,method='DP tổng giảm dần để không dùng lại chỉ số.')
seq('Ba lô trọng lượng','Mỗi a[i] vừa là trọng lượng vừa là giá trị, chọn mỗi chỉ số tối đa một lần. In tổng lớn nhất không vượt k.','s={0}\nfor c in a:s|={x+c for x in s if x+c<=k}\nprint(max(s))',3,method='Tập tổng khả đạt của ba lô 0/1.')
seq('Ếch nhảy trên cột','Ếch bắt đầu ở cột 1, mỗi bước nhảy 1 hoặc 2 cột. Chi phí nhảy i→j là |a[i]−a[j]|. In chi phí đến cột n nhỏ nhất.','d=[0]*n\nfor i in range(1,n):d[i]=min(d[j]+abs(a[i]-a[j]) for j in range(max(0,i-2),i))\nprint(d[-1])',3)
seq('Ít lần nhảy nhất','Từ chỉ số i được tiến 1..a[i] vị trí. In ít bước nhất từ 1 đến n, không đến được in −1.','d=[10**9]*n;d[0]=0\nfor i in range(n):\n for j in range(i+1,min(n,i+a[i]+1)):d[j]=min(d[j],d[i]+1)\nprint(d[-1] if d[-1]<10**9 else -1)',3)
seq('Dãy tăng có tổng lớn nhất','Chọn dãy con tăng nghiêm ngặt không rỗng sao cho tổng lớn nhất. In tổng.','d=a.copy()\nfor i in range(n):\n for j in range(i):\n  if a[j]<a[i]:d[i]=max(d[i],d[j]+a[i])\nprint(max(d))',4)
seq('Đếm dãy tăng dài nhất','Đếm dãy con chỉ số có độ dài bằng LIS của a; chỉ in số lượng, không phải độ dài.','d=[1]*n;c=[1]*n\nfor i in range(n):\n for j in range(i):\n  if a[j]<a[i]:\n   if d[j]+1>d[i]:d[i]=d[j]+1;c[i]=c[j]\n   elif d[j]+1==d[i]:c[i]+=c[j]\nprint(sum(c[i] for i in range(n) if d[i]==max(d)))',5)
seq('Dãy tăng rồi giảm','In độ dài dãy con bitonic dài nhất: tăng nghiêm ngặt rồi giảm nghiêm ngặt. Một phía được phép rỗng.','l=[1]*n;r=[1]*n\nfor i in range(n):\n for j in range(i):\n  if a[j]<a[i]:l[i]=max(l[i],l[j]+1)\nfor i in range(n-1,-1,-1):\n for j in range(i+1,n):\n  if a[j]<a[i]:r[i]=max(r[i],r[j]+1)\nprint(max(l[i]+r[i]-1 for i in range(n)))',4)
seq('Dãy nhấp nhô dài nhất','Chọn dãy con có hiệu hai phần tử liên tiếp khác 0 và đổi dấu luân phiên. In độ dài lớn nhất.','up=down=1\nfor x,y in zip(a,a[1:]):\n if x<y:up=down+1\n elif x>y:down=up+1\nprint(max(up,down))',4,method='Hai trạng thái kết thúc bằng tăng hoặc giảm.')
seq('Dãy con cấp số cộng','Chọn dãy con dài nhất có hiệu giữa mọi cặp liên tiếp bằng nhau. Dãy dài 1 hoặc 2 luôn hợp lệ. In độ dài.','d=[{} for _ in a];ans=1\nfor i in range(n):\n for j in range(i):\n  v=a[i]-a[j];d[i][v]=max(d[i].get(v,1),d[j].get(v,1)+1);ans=max(ans,d[i][v])\nprint(ans)',5,method='DP theo vị trí cuối và công sai.')
seq('Tập chia hết lớn nhất','Chọn nhiều chỉ số nhất sao cho mọi cặp giá trị trong tập có một số chia hết số kia. In số phần tử.','a.sort();d=[1]*n\nfor i in range(n):\n for j in range(i):\n  if a[i]%a[j]==0:d[i]=max(d[i],d[j]+1)\nprint(max(d))',4,method='Sắp xếp và DP chuỗi chia hết.')
seq('Dãy con lặp lại','Tìm độ dài lớn nhất của hai dãy con bằng nhau theo giá trị, trong đó tại mỗi vị trí ghép, hai chỉ số gốc phải khác nhau. Các dãy được phép dùng chung chỉ số ở các vị trí ghép khác.','d=[[0]*(n+1) for _ in range(n+1)]\nfor i in range(1,n+1):\n for j in range(1,n+1):d[i][j]=d[i-1][j-1]+1 if i!=j and a[i-1]==a[j-1] else max(d[i-1][j],d[i][j-1])\nprint(d[n][n])',5,method='LCS của dãy với chính nó, cấm ghép cùng chỉ số.')
seq('Chia đoạn đối xứng','Chia toàn bộ dãy thành ít đoạn liên tiếp nhất, mỗi đoạn đối xứng theo giá trị. In số đoạn.','d=[0]+[n+1]*n\nfor i in range(1,n+1):\n for j in range(i):\n  if a[j:i]==a[j:i][::-1]:d[i]=min(d[i],d[j]+1)\nprint(d[n])',4)
seq('Gộp tệp liền kề','Mỗi lần gộp hai nhóm kề nhau tốn tổng kích thước hai nhóm. In chi phí nhỏ nhất gộp cả dãy thành một.','d=[[0]*n for _ in a]\nfor length in range(2,n+1):\n for l in range(n-length+1):\n  r=l+length-1;d[l][r]=min(d[l][m]+d[m+1][r] for m in range(l,r))+sum(a[l:r+1])\nprint(d[0][n-1])',5,method='DP trên khoảng với điểm chia cuối.')
seq('Nhân chuỗi ma trận','a chứa n kích thước. Có n−1 ma trận lần lượt a[i]×a[i+1]. In số phép nhân vô hướng nhỏ nhất; n=1 in 0.','d=[[0]*n for _ in a]\nfor length in range(2,n):\n for l in range(n-length):\n  r=l+length;d[l][r]=min(d[l][m]+d[m][r]+a[l]*a[m]*a[r] for m in range(l+1,r))\nprint(d[0][n-1])',5,method='DP thứ tự đặt ngoặc chuỗi ma trận.')
seq('Bắn bóng tối ưu','Bắn các bóng có giá trị a. Bắn bóng i nhận tích giá trị hai hàng xóm hiện tại với a[i], ngoài hai biên là 1. In tổng thưởng lớn nhất khi bắn hết.','b=[1]+a+[1];d=[[0]*(n+2) for _ in b]\nfor length in range(1,n+1):\n for l in range(1,n-length+2):\n  r=l+length-1;d[l][r]=max(d[l][m-1]+d[m+1][r]+b[l-1]*b[m]*b[r+1] for m in range(l,r+1))\nprint(d[1][n])',6,method='DP trên khoảng, chọn bóng bắn cuối.')
seq('Cắt thanh tối ưu','a[i] là giá bán thanh dài i, 1≤i≤n. In doanh thu lớn nhất khi cắt thanh dài n thành các đoạn nguyên dương.','d=[0]*(n+1)\nfor x in range(1,n+1):d[x]=max(a[i-1]+d[x-i] for i in range(1,x+1))\nprint(d[n])',4,method='Ba lô vô hạn theo độ dài.')
seq('Chia thành k đoạn tối ưu','Chia dãy thành đúng k đoạn liên tiếp không rỗng. In giá trị nhỏ nhất có thể của tổng đoạn lớn nhất.','p=[0]+list(itertools.accumulate(a));d=[[10**9]*(n+1) for _ in range(k+1)];d[0][0]=0\nfor t in range(1,k+1):\n for i in range(t,n+1):d[t][i]=min(max(d[t-1][j],p[i]-p[j]) for j in range(t-1,i))\nprint(d[k][n])',5)
seq('Dãy con tổng chia hết','Đếm tập con chỉ số có tổng chia hết k, kể cả tập rỗng.','d=[0]*k;d[0]=1\nfor c in a:\n nd=d.copy()\n for r,x in enumerate(d):nd[(r+c)%k]+=x\n d=nd\nprint(d[0])',4,method='DP theo lớp dư của tổng.')
def seqnum(title,desc,code,cases,contract='Một số nguyên n, 0 ≤ n ≤ 30.',level=4,method='Quy hoạch động hoặc truy hồi.'):
    add('Sequences',title,level,desc,contract,'n=int(input())\n'+code,[str(x)+'\n' for x in cases],method,'O(n³) hoặc tốt hơn')
seqnum('Số Catalan','Đếm chuỗi ngoặc đúng có n cặp dấu ngoặc.','print(math.comb(2*n,n)//(n+1))',[3,2,0,30,17],method='Công thức Catalan.')
seqnum('Hoán vị không điểm cố định','Đếm hoán vị của 1..n mà không có a[i]=i. Quy ước n=0 có một hoán vị.','a,b=1,0\nfor i in range(2,n+1):a,b=b,(i-1)*(a+b)\nprint(1 if n==0 else b)',[4,2,0,30,9],method='D(n)=(n−1)(D(n−1)+D(n−2)).')
seqnum('Lát bảng ba hàng','Đếm cách lát bảng 3×n bằng domino 1×2 hoặc 2×1, không chồng lấn.','d=[0]*(n+1);d[0]=1\nfor i in range(2,n+1,2):d[i]=3*d[i-2]+2*sum(d[:i-2:2])\nprint(d[n])',[4,2,0,30,7],method='Phân loại phần ghép trái nhất của bảng 3 hàng.')
seqnum('Số Tribonacci','T(0)=0,T(1)=0,T(2)=1; T(n)=T(n−1)+T(n−2)+T(n−3). In T(n).','d=[0,0,1]\nfor i in range(3,n+1):d.append(sum(d[-3:]))\nprint(d[n])',[5,3,0,30,17])
seqnum('Phân hoạch tập hợp','Đếm cách chia tập n phần tử phân biệt thành các nhóm không rỗng không có thứ tự, kể cả phân hoạch rỗng khi n=0.','s=[[0]*(n+1) for _ in range(n+1)];s[0][0]=1\nfor i in range(1,n+1):\n for j in range(1,i+1):s[i][j]=s[i-1][j-1]+j*s[i-1][j]\nprint(sum(s[n]))',[4,3,0,30,12],method='Số Bell từ tam giác Stirling.')
seqnum('Phân hoạch số nguyên','Đếm cách viết n thành tổng các số nguyên dương không giảm. n=0 có một cách rỗng.','d=[1]+[0]*n\nfor c in range(1,n+1):\n for x in range(c,n+1):d[x]+=d[x-c]\nprint(d[n])',[5,3,0,30,17],method='Đổi tiền bằng các số nguyên 1..n.')
seqnum('Phân hoạch thành phần phân biệt','Đếm cách viết n thành tổng các số nguyên dương đôi một khác nhau, không xét thứ tự. n=0 có một cách rỗng.','d=[1]+[0]*n\nfor c in range(1,n+1):\n for x in range(n,c-1,-1):d[x]+=d[x-c]\nprint(d[n])',[5,3,0,30,17],method='DP tổng giảm dần theo từng số hạng.')
seqnum('Chuỗi nhị phân không kề nhau','Đếm chuỗi nhị phân dài n không chứa 11. Có một chuỗi rỗng dài 0.','a,b=1,0\nfor _ in range(n):a,b=a+b,a\nprint(a+b)',[4,2,0,30,15],method='Hai trạng thái theo bit kết thúc.')
seqnum('Chuỗi nhị phân tránh ba bit','Đếm chuỗi nhị phân dài n không chứa 000 và không chứa 111. Chuỗi rỗng được tính.','d={("",0):1}\nfor _ in range(n):\n nd=collections.defaultdict(int)\n for (last,run),v in d.items():\n  for c in "01":\n   r=run+1 if c==last else 1\n   if r<3:nd[c,r]+=v\n d=nd\nprint(sum(d.values()))',[4,2,0,30,15],method='DP ký tự cuối và độ dài đoạn cùng bit.')
seqnum('Đi bộ về gốc','Đếm đường đi đúng n bước trên trục số, mỗi bước ±1, bắt đầu và kết thúc tại 0, không đi xuống số âm.','d={0:1}\nfor _ in range(n):\n nd=collections.defaultdict(int)\n for p,v in d.items():\n  nd[p+1]+=v\n  if p:nd[p-1]+=v\n d=nd\nprint(d.get(0,0))',[6,2,0,30,7],method='DP số bước và độ cao.')
seqnum('Xếp quân hậu','Đếm cách đặt n quân hậu trên bảng n×n sao cho không tấn công nhau. n=0 có một cách rỗng.','def solve(row,cols,d1,d2):\n if row==n:return 1\n return sum(solve(row+1,cols|{c},d1|{row-c},d2|{row+c}) for c in range(n) if c not in cols and row-c not in d1 and row+c not in d2)\nprint(solve(0,set(),set(),set()))',[4,3,0,8,6],'Một số nguyên n, 0 ≤ n ≤ 8.',5,'Quay lui theo hàng, đánh dấu cột và đường chéo.')
seqnum('Cây nhị phân có nhãn','Đếm cây nhị phân có thứ tự, n nút mang các nhãn phân biệt 1..n. n=0 có một cây rỗng.','print(math.comb(2*n,n)//(n+1)*math.factorial(n))',[4,2,0,30,17],method='Catalan dạng cây nhân n! cách gán nhãn.')

GRAPH_HELP='''
def context(n,edges,directed=False):
 g=[[] for _ in range(n)]
 for u,v,w in edges:
  g[u].append((v,w))
  if not directed:g[v].append((u,w))
 return g
def distances(n,edges,directed=False):
 d=[[10**12]*n for _ in range(n)]
 for i in range(n):d[i][i]=0
 for u,v,w in edges:
  d[u][v]=min(d[u][v],w)
  if not directed:d[v][u]=min(d[v][u],w)
 for k in range(n):
  for i in range(n):
   for j in range(n):d[i][j]=min(d[i][j],d[i][k]+d[k][j])
 return d
def connected(n,edges,removed_vertex=-1):
 g=context(n,edges);seen={removed_vertex};count=0
 for start in range(n):
  if start in seen:continue
  count+=1;stack=[start];seen.add(start)
  while stack:
   u=stack.pop()
   for v,w in g[u]:
    if v not in seen:seen.add(v);stack.append(v)
 return count
def spanning(n,edges):
 out=[]
 for chosen in itertools.combinations(edges,n-1):
  if connected(n,chosen)==1:out.append(sum(w for u,v,w in chosen))
 return out
def tree_parent(n,g):
 parent=[-1]*n;order=[0];parent[0]=0
 for u in order:
  for v,w in g[u]:
   if parent[v]<0:parent[v]=u;order.append(v)
 return parent,order
def maxflow(n,edges,s,t):
 if s==t:return 0
 c=[[0]*n for _ in range(n)]
 for u,v,w in edges:c[u][v]+=w
 total=0
 while True:
  p=[-1]*n;p[s]=s;q=[s]
  for u in q:
   for v in range(n):
    if p[v]<0 and c[u][v]>0:p[v]=u;q.append(v)
  if p[t]<0:return total
  x=t;amount=10**12
  while x!=s:amount=min(amount,c[p[x]][x]);x=p[x]
  x=t
  while x!=s:c[p[x]][x]-=amount;c[x][p[x]]+=amount;x=p[x]
  total+=amount
'''
def graph_input(n,edges):return f'{n} {len(edges)}\n'+''.join(f'{u} {v} {w}\n' for u,v,w in edges)
GC=[graph_input(4,[(1,2,2),(2,3,3),(3,4,1),(1,4,9)]),graph_input(3,[(1,2,4),(2,3,2)]),graph_input(1,[]),graph_input(4,[(1,2,1),(3,4,2)]),graph_input(7,[(1,2,3),(1,3,2),(2,3,1),(2,4,4),(3,5,7),(4,5,2),(4,6,3),(5,6,1),(6,7,2),(5,7,9),(3,7,12),(1,7,20)])]
DAG=GC
CYCLIC=[GC[0],graph_input(3,[(1,2,1),(2,3,1),(3,1,1)]),GC[2],GC[3],graph_input(5,[(1,2,2),(2,1,1),(2,3,3),(3,4,1),(4,3,1),(4,5,5)])]
TREES=[graph_input(4,[(1,2,2),(1,3,3),(3,4,4)]),GC[1],GC[2],graph_input(7,[(i,i+1,i) for i in range(1,7)]),graph_input(7,[(1,2,2),(1,3,4),(2,4,1),(2,5,3),(3,6,5),(3,7,2)])]
GRAPH_READ='n,m=map(int,input().split())\nedges=[]\nfor _ in range(m):\n u,v,w=map(int,input().split());edges.append((u-1,v-1,w))\n'
def graph(title,desc,code,level=4,cases=None,directed=False,tree=False,method='Duyệt đồ thị và quy hoạch động theo cấu trúc.'):
    contract=('Đồ thị có hướng' if directed else 'Đồ thị vô hướng')+' đơn, đỉnh 1..n. Dòng đầu n m, 1 ≤ n ≤ 7, 0 ≤ m ≤ min(12,n(n−1)'+('' if directed else '/2')+'). Sau đó m dòng u v w, 1 ≤ w ≤ 20.'
    if tree:contract+=' Đầu vào bảo đảm là cây.'
    if title=='Chu trình âm ở bất kỳ đâu':contract=contract.replace('1 ≤ w ≤ 20','−20 ≤ w ≤ 20')
    if title=='Ghép cặp hai phía':contract='Hai phía, mỗi phía n đỉnh đánh số 1..n. Dòng đầu n m, 1 ≤ n ≤ 7, 0 ≤ m ≤ 12; m dòng u v w là cạnh trái u, phải v, 1 ≤ w ≤ 20 (không dùng w). Không có cạnh trùng.'
    add('Graphs',title,level,desc,contract,GRAPH_READ+f'g=context(n,edges,{directed})\n'+code,cases or (TREES if tree else GC),method,'Theo thuật toán; n≤7, m≤12',GRAPH_HELP)
graph('Đường ngắn có trọng số','In khoảng cách ngắn nhất từ đỉnh 1 tới từng đỉnh, theo thứ tự 1..n; không tới được in −1.','d=[10**12]*n;d[0]=0;h=[(0,0)]\nwhile h:\n cost,u=heapq.heappop(h)\n if cost!=d[u]:continue\n for v,w in g[u]:\n  if cost+w<d[v]:d[v]=cost+w;heapq.heappush(h,(d[v],v))\nprint(*(x if x<10**12 else -1 for x in d))',method='Dijkstra với hàng đợi ưu tiên.')
graph('Chu trình âm ở bất kỳ đâu','Trọng số có thể âm. In 1 nếu tồn tại chu trình có tổng trọng số âm, ngược lại 0.','d=[0]*n;changed=False\nfor _ in range(n):\n changed=False\n for u,v,w in edges:\n  if d[v]>d[u]+w:d[v]=d[u]+w;changed=True\nprint(int(changed))',5,[graph_input(3,[(1,2,2),(2,3,-5),(3,1,1)]),graph_input(3,[(1,2,-2),(2,3,3)]),GC[2],graph_input(4,[(1,2,1),(3,4,-2),(4,3,1)]),CYCLIC[-1]],True,method='Bellman–Ford với siêu nguồn, kiểm tra lần n.')
graph('Ma trận đường ngắn','In n dòng khoảng cách ngắn nhất giữa mọi cặp đỉnh; không có đường đi in −1.','d=distances(n,edges)\nfor row in d:print(*(x if x<10**12 else -1 for x in row))',4,method='Floyd–Warshall.')
graph('Đếm cầu của đồ thị','Một cạnh là cầu nếu xóa nó làm tăng số thành phần liên thông. In số cầu.','base=connected(n,edges)\nprint(sum(connected(n,edges[:i]+edges[i+1:])>base for i in range(m)))',4,method='Tarjan hoặc xóa từng cạnh và đếm thành phần.')
graph('Liệt kê đỉnh khớp','In tăng dần các đỉnh mà xóa đỉnh cùng cạnh kề làm tăng số thành phần liên thông; không có in NONE.','base=connected(n,edges)\nout=[i+1 for i in range(n) if connected(n,[(u,v,w) for u,v,w in edges if u!=i and v!=i],i)>base]\nprint(" ".join(map(str,out)) or "NONE")',4,method='Tarjan hoặc xóa từng đỉnh.')
graph('Thành phần liên thông mạnh','In số thành phần liên thông mạnh của đồ thị có hướng.','d=distances(n,[(u,v,1) for u,v,w in edges],True);seen=set();ans=0\nfor i in range(n):\n if i not in seen:\n  ans+=1;seen|={j for j in range(n) if d[i][j]<10**12 and d[j][i]<10**12}\nprint(ans)',5,CYCLIC,True,method='Bao đóng đạt được và nhóm các đỉnh đạt nhau hai chiều.')
TOPO='ind=[0]*n\nfor u,v,w in edges:ind[v]+=1\nq=[i for i in range(n) if not ind[i]];heapq.heapify(q);order=[]\nwhile q:\n u=heapq.heappop(q);order.append(u)\n for v,w in g[u]:\n  ind[v]-=1\n  if not ind[v]:heapq.heappush(q,v)\n'
graph('Thứ tự topo nhỏ nhất','In thứ tự topo nhỏ nhất từ điển, đánh số đỉnh từ 1; nếu có chu trình in NONE.',''+TOPO+'print(" ".join(str(v+1) for v in order) if len(order)==n else "NONE")',4,CYCLIC,True,method='Kahn với heap đỉnh vào bằng 0.')
graph('Phát hiện chu trình có hướng','In 1 nếu đồ thị chứa chu trình có hướng, ngược lại 0.',TOPO+'print(int(len(order)<n))',4,CYCLIC,True,method='Kahn: tồn tại đỉnh không thể loại bỏ.')
graph('Đường dài nhất trên DAG','Đầu vào bảo đảm không có chu trình có hướng. In tổng trọng số lớn nhất của đường đi từ 1 đến n, không có in −1.',''+TOPO+'d=[-10**12]*n;d[0]=0\nfor u in order:\n if d[u]<0:continue\n for v,w in g[u]:d[v]=max(d[v],d[u]+w)\nprint(d[-1] if d[-1]>=0 else -1)',4,DAG,True,method='DP trên thứ tự topo.')
graph('Đếm đường trên DAG','Đầu vào là DAG. Đếm đường đi từ 1 đến n. Nếu n=1, tính cả đường dài 0.',''+TOPO+'d=[0]*n;d[0]=1\nfor u in order:\n for v,w in g[u]:d[v]+=d[u]\nprint(d[-1])',4,DAG,True,method='Cộng số đường theo thứ tự topo.')
graph('Cây khung nhỏ nhất','In tổng trọng số nhỏ nhất của cây khung; đồ thị không liên thông in −1.','v=spanning(n,edges)\nprint(min(v) if v else -1)',4,method='Kruskal hoặc duyệt các tập n−1 cạnh trong giới hạn nhỏ.')
graph('Cây khung có trọng số kế tiếp','Trong các tổng trọng số của cây khung, tìm giá trị nhỏ nhất lớn hơn trọng số tối ưu. Không có in −1.','v=sorted(set(spanning(n,edges)))\nprint(v[1] if len(v)>1 else -1)',6,method='Liệt kê cây khung và lấy tổng phân biệt nhỏ thứ hai.')
graph('Luồng cực đại','w là sức chứa của cung u→v. In luồng cực đại từ 1 đến n; n=1 in 0.','print(maxflow(n,edges,0,n-1))',5,GC,True,method='Edmonds–Karp trên mạng dư.')
graph('Ghép cặp hai phía','Có n đỉnh trái và n đỉnh phải. Mỗi dòng u v w là cạnh từ trái u đến phải v; w không sử dụng. In kích thước ghép cặp lớn nhất.','adj=[[] for _ in range(n)]\nfor u,v,w in edges:adj[u].append(v)\nmatch=[-1]*n\ndef dfs(u,seen):\n for v in adj[u]:\n  if v in seen:continue\n  seen.add(v)\n  if match[v]<0 or dfs(match[v],seen):match[v]=u;return True\n return False\nprint(sum(dfs(u,set()) for u in range(n)))',5,method='Tìm đường tăng trong ghép cặp hai phía.')
graph('Đường kính cây có trọng số','In độ dài đường đi lớn nhất giữa hai đỉnh của cây, n=1 in 0.','d=distances(n,edges)\nprint(max(map(max,d)))',4,tree=True,method='Hai lần duyệt cây hoặc khoảng cách mọi cặp.')
graph('Tổ tiên chung trên cây','Gốc là đỉnh 1. In tổ tiên chung thấp nhất của đỉnh n và đỉnh max(1,n−1).','p,order=tree_parent(n,g);u=n-1;v=max(0,n-2);anc=set()\nwhile True:\n anc.add(u)\n if u==0:break\n u=p[u]\nwhile v not in anc:v=p[v]\nprint(v+1)',4,tree=True,method='Lưu cha và leo tổ tiên.')
graph('Kích thước cây con','Gốc là đỉnh 1. In số đỉnh trong cây con của từng đỉnh theo thứ tự 1..n.','p,order=tree_parent(n,g);size=[1]*n\nfor u in order[:0:-1]:size[p[u]]+=size[u]\nprint(*size)',4,tree=True,method='DP cây theo thứ tự duyệt ngược.')
graph('Trọng tâm cây','In tăng dần các đỉnh mà khi xóa chúng, mọi thành phần còn lại có không quá n/2 đỉnh.','out=[]\nfor removed in range(n):\n seen={removed};largest=0\n for start in range(n):\n  if start in seen:continue\n  q=[start];seen.add(start)\n  for u in q:\n   for v,w in g[u]:\n    if v not in seen:seen.add(v);q.append(v)\n  largest=max(largest,len(q))\n if largest*2<=n:out.append(removed+1)\nprint(*out)',4,tree=True,method='Kích thước các thành phần sau khi bỏ một đỉnh.')
graph('Tổng khoảng cách trên cây','In tổng khoảng cách có trọng số giữa mọi cặp đỉnh không thứ tự i<j.','d=distances(n,edges)\nprint(sum(d[i][j] for i in range(n) for j in range(i+1,n)))',4,tree=True,method='Mỗi cạnh đóng góp w×s×(n−s).')
EULER=[graph_input(3,[(1,2,1),(2,3,1),(3,1,1)]),GC[1],GC[2],GC[3],graph_input(5,[(1,2,1),(2,3,1),(3,1,1),(1,4,1),(4,5,1),(5,1,1)])]
graph('Chu trình Euler từ đỉnh một','In một chu trình Euler bắt đầu tại 1, đi qua mỗi cạnh đúng một lần, bằng thuật toán luôn chọn cạnh chưa dùng có đỉnh kề nhỏ nhất khi mở rộng ngăn xếp Hierholzer. Không có in NONE; không có cạnh in 1.','adj=[[] for _ in range(n)]\nfor i,(u,v,w) in enumerate(edges):adj[u].append((v,i));adj[v].append((u,i))\nfor a in adj:a.sort(reverse=True)\nused=set();st=[0];out=[]\nwhile st:\n u=st[-1]\n while adj[u] and adj[u][-1][1] in used:adj[u].pop()\n if not adj[u]:out.append(st.pop())\n else:v,i=adj[u].pop();used.add(i);st.append(v)\nok=len(used)==m and all(len(g[i])%2==0 for i in range(n))\nprint(" ".join(str(x+1) for x in out[::-1]) if ok else "NONE")',5,EULER,method='Hierholzer với thứ tự cạnh xác định.')
graph('Đếm cây khung','In số tập cạnh tạo thành cây khung của đồ thị; n=1 có một cây rỗng.','print(len(spanning(n,edges)))',5,method='Duyệt tổ hợp cạnh và kiểm tra liên thông.')
graph('Số màu ít nhất','Tô màu các đỉnh sao cho hai đầu mỗi cạnh khác màu. In số màu ít nhất.','def feasible(k):\n color=[-1]*n\n def dfs(u):\n  if u==n:return True\n  for c in range(k):\n   if all(color[v]!=c for v,w in g[u]):\n    color[u]=c\n    if dfs(u+1):return True\n    color[u]=-1\n  return False\n return dfs(0)\nprint(next(k for k in range(1,n+1) if feasible(k)))',6,method='Quay lui tô màu, thử số màu tăng dần.')
graph('Tập độc lập lớn nhất','Chọn nhiều đỉnh nhất sao cho không có cạnh nối hai đỉnh đã chọn. In kích thước lớn nhất.','print(max(mask.bit_count() for mask in range(1<<n) if all(not(mask>>u&1 and mask>>v&1) for u,v,w in edges)))',5,method='Duyệt tập con đỉnh bằng bitmask.')
graph('Clique lớn nhất','Tìm nhiều đỉnh nhất sao cho mọi cặp trong tập đều có cạnh nối. In kích thước.','e={tuple(sorted((u,v))) for u,v,w in edges}\nprint(max(mask.bit_count() for mask in range(1<<n) if all((u,v) in e for u,v in itertools.combinations([i for i in range(n) if mask>>i&1],2))))',5,method='Duyệt tập con và kiểm tra mọi cặp.')
graph('Đếm đường Hamilton','Đếm đường đi từ 1 đến n đi qua mỗi đỉnh đúng một lần. n=1 có một đường dài 0.','e={(u,v) for u,v,w in edges}\nif n==1:print(1)\nelse:\n ans=0\n for mid in itertools.permutations(range(1,n-1)):\n  path=(0,)+mid+(n-1,);ans+=all((u,v) in e for u,v in zip(path,path[1:]))\n print(ans)',6,CYCLIC,True,method='Hoán vị hoặc DP bitmask theo tập đỉnh đã đi.')
graph('Người du lịch','Tìm chu trình có hướng bắt đầu tại 1, thăm mỗi đỉnh khác đúng một lần rồi về 1, tổng trọng số nhỏ nhất. Không có in −1; n=1 in 0.','d={(u,v):w for u,v,w in edges};ans=10**12\nfor mid in itertools.permutations(range(1,n)):\n path=(0,)+mid+(0,)\n if all((u,v) in d for u,v in zip(path,path[1:])):ans=min(ans,sum(d[u,v] for u,v in zip(path,path[1:])))\nprint(0 if n==1 else ans if ans<10**12 else -1)',6,CYCLIC,True,method='DP tập con hoặc liệt kê hoán vị trong giới hạn nhỏ.')
graph('Bao đóng đạt được','In ma trận n×n gồm 0,1: ô i,j bằng 1 nếu có đường có hướng từ i tới j; tính cả đường dài 0.','d=distances(n,edges,True)\nfor row in d:print(*(int(x<10**12) for x in row))',4,CYCLIC,True,method='Warshall theo quan hệ đạt được.')
graph('Cạnh thừa của DAG','Đồ thị đầu vào là DAG. Đếm cạnh u→v mà sau khi xóa cạnh đó vẫn có đường từ u đến v.','ans=0\nfor i,(u,v,w) in enumerate(edges):\n d=distances(n,edges[:i]+edges[i+1:],True);ans+=d[u][v]<10**12\nprint(ans)',5,DAG,True,method='Kiểm tra đường thay thế cho mỗi cạnh.')
graph('Đường có cạnh nặng nhất nhỏ nhất','Trong các đường từ 1 đến n, tối thiểu hóa trọng số cạnh lớn nhất trên đường. Không có in −1, n=1 in 0.','d=[[10**12]*n for _ in range(n)]\nfor i in range(n):d[i][i]=0\nfor u,v,w in edges:d[u][v]=d[v][u]=w\nfor k in range(n):\n for i in range(n):\n  for j in range(n):d[i][j]=min(d[i][j],max(d[i][k],d[k][j]))\nprint(d[0][-1] if d[0][-1]<10**12 else -1)',5,method='Floyd với phép kết hợp max thay cho cộng.')
GRID=['3 3\n...\n.#.\n...\n','2 2\n..\n..\n','1 1\n.\n','3 3\n.#.\n###\n.#.\n','5 5\n..#..\n..#..\n.....\n.###.\n.....\n']
add('Graphs','Mê cung ô vuông',4,'Từ ô trên trái đến ô dưới phải, đi bốn hướng qua ô dấu chấm. In số bước ngắn nhất, không tới được in −1.','Dòng đầu n m (1..20). n dòng m ký tự . hoặc #. Hai góc đầu cuối luôn là . .','n,m=map(int,input().split());a=[input() for _ in range(n)];d={(0,0):0};q=collections.deque([(0,0)])\nwhile q:\n x,y=q.popleft()\n for u,v in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:\n  if 0<=u<n and 0<=v<m and a[u][v]=="." and (u,v) not in d:d[u,v]=d[x,y]+1;q.append((u,v))\nprint(d.get((n-1,m-1),-1))',GRID,'BFS các ô đi được.','O(nm)')
add('Graphs','Nước đi quân mã',4,'Trên bàn cờ n×n, quân mã đi theo (±1,±2) hoặc (±2,±1). In ít nước nhất đi từ (1,1) đến (n,n), không tới được in −1.','Một số n, 1 ≤ n ≤ 20.','n=int(input());q=collections.deque([(0,0)]);d={(0,0):0}\nwhile q:\n x,y=q.popleft()\n for dx,dy in [(1,2),(1,-2),(-1,2),(-1,-2),(2,1),(2,-1),(-2,1),(-2,-1)]:\n  u,v=x+dx,y+dy\n  if 0<=u<n and 0<=v<n and (u,v) not in d:d[u,v]=d[x,y]+1;q.append((u,v))\nprint(d.get((n-1,n-1),-1))',['8\n','4\n','1\n','2\n','20\n'],'BFS trên đồ thị các ô.','O(n²)')
add('Graphs','Kết nối tăng dần',4,'Ban đầu n đỉnh cô lập. Thêm các cạnh theo thứ tự; sau mỗi lần thêm in số thành phần liên thông. Cạnh trùng hoặc khuyên được phép.','Dòng đầu n m, 1 ≤ n ≤ 100, 1 ≤ m ≤ 100. m dòng u v, đỉnh 1..n.','n,m=map(int,input().split());p=list(range(n));count=n\ndef find(x):\n while p[x]!=x:p[x]=p[p[x]];x=p[x]\n return x\nfor _ in range(m):\n u,v=map(int,input().split());u,v=find(u-1),find(v-1)\n if u!=v:p[u]=v;count-=1\n print(count)',['4 3\n1 2\n2 3\n3 4\n','3 2\n1 2\n1 2\n','1 1\n1 1\n','5 4\n1 2\n3 4\n2 1\n4 5\n','7 8\n1 2\n3 4\n5 6\n2 3\n4 5\n6 7\n1 7\n2 2\n'],'Disjoint Set Union với nén đường đi.','O((n+m)α(n))')
graph('Tâm đồ thị có trọng số','Với mỗi đỉnh, độ lệch tâm là khoảng cách lớn nhất đến các đỉnh khác. In tăng dần các đỉnh có độ lệch tâm nhỏ nhất; không liên thông in NONE.','d=distances(n,edges);e=list(map(max,d))\nprint("NONE" if max(e)>=10**12 else " ".join(str(i+1) for i in range(n) if e[i]==min(e)))',4,method='Khoảng cách mọi cặp, lấy bán kính đồ thị.')
