import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[1]+[0]*k
for c in a:
 for x in range(k,c-1,-1):d[x]+=d[x-c]
print(d[k])
