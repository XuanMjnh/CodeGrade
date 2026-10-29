import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d={x:i+1 for i,x in enumerate(sorted(set(a)))}
print(*(d[x] for x in a))
