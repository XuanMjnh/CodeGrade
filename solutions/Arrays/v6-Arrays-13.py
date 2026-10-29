import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
v=[i+1 for i in range(n) if sum(a[:i])==sum(a[i+1:])]
print(" ".join(map(str,v)) or "NONE")
