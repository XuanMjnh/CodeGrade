import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[0]+[n+1]*n
for i in range(1,n+1):
 for j in range(i):
  if a[j:i]==a[j:i][::-1]:d[i]=min(d[i],d[j]+1)
print(d[n])
