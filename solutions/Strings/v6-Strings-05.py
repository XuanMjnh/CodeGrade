import sys, math, itertools, collections, functools, heapq, bisect

s=input();n=len(s)
print(next(p for p in range(1,n+1) if n%p==0 and s==s[:p]*(n//p)))
