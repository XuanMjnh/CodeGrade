import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[0]*(n+1)
for x in range(1,n+1):d[x]=max(a[i-1]+d[x-i] for i in range(1,x+1))
print(d[n])
