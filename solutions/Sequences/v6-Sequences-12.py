import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[{} for _ in a];ans=1
for i in range(n):
 for j in range(i):
  v=a[i]-a[j];d[i][v]=max(d[i].get(v,1),d[j].get(v,1)+1);ans=max(ans,d[i][v])
print(ans)
