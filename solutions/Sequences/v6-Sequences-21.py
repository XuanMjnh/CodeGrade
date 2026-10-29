import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[0]*k;d[0]=1
for c in a:
 nd=d.copy()
 for r,x in enumerate(d):nd[(r+c)%k]+=x
 d=nd
print(d[0])
