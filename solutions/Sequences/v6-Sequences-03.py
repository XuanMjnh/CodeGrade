import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[1]+[0]*k
for x in range(1,k+1):d[x]=sum(d[x-c] for c in set(a) if c<=x)
print(d[k])
