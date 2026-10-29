import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
a.sort();d=[1]*n
for i in range(n):
 for j in range(i):
  if a[i]%a[j]==0:d[i]=max(d[i],d[j]+1)
print(max(d))
