import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(sum(sum(v)==0 for v in itertools.combinations(a,3)))
