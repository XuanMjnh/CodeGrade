import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[1]+[0]*k
for c in sorted(set(a)):
 for x in range(c,k+1):d[x]+=d[x-c]
print(d[k])
