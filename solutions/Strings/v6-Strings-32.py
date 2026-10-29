import sys, math, itertools, collections, functools, heapq, bisect

s=input();d=collections.Counter(s)
print(next((i+1 for i,c in enumerate(s) if d[c]==1),0))
