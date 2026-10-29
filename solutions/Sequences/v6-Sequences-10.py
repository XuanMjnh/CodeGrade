import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
l=[1]*n;r=[1]*n
for i in range(n):
 for j in range(i):
  if a[j]<a[i]:l[i]=max(l[i],l[j]+1)
for i in range(n-1,-1,-1):
 for j in range(i+1,n):
  if a[j]<a[i]:r[i]=max(r[i],r[j]+1)
print(max(l[i]+r[i]-1 for i in range(n)))
