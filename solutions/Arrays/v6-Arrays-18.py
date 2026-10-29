import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(max(sum((a+a)[i:i+l]) for i in range(n) for l in range(1,n+1)))
