import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(max((x^y for x,y in itertools.combinations(a,2)),default=0))
