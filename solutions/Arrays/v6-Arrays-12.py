import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
s=set(a)
print(next(i for i in range(1,n+2) if i not in s))
