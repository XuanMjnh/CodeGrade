import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
v=sorted(set(a)&set(range(1,k+1)))
print(" ".join(map(str,v)) or "NONE")
