import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(sum(max(0,min(max(a[:i+1]),max(a[i:]))-a[i]) for i in range(n)))
