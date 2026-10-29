import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(*(math.prod(a[:i]+a[i+1:]) for i in range(n)))
