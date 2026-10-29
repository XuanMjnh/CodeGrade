import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(sum(max(0,y-x) for x,y in zip(a,a[1:])))
