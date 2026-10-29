import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[1]*n;c=[1]*n
for i in range(n):
 for j in range(i):
  if a[j]<a[i]:
   if d[j]+1>d[i]:d[i]=d[j]+1;c[i]=c[j]
   elif d[j]+1==d[i]:c[i]+=c[j]
print(sum(c[i] for i in range(n) if d[i]==max(d)))
