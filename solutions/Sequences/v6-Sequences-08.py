import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=a.copy()
for i in range(n):
 for j in range(i):
  if a[j]<a[i]:d[i]=max(d[i],d[j]+a[i])
print(max(d))
