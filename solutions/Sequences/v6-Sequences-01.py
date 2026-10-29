import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[0]+[10**9]*k
for x in range(1,k+1):
 for c in set(a):
  if c<=x:d[x]=min(d[x],d[x-c]+1)
print(d[k] if d[k]<10**9 else -1)
