import sys, math, itertools, collections, functools, heapq, bisect

a=input().split();p=a[0]
for s in a[1:]:
 while not s.startswith(p):p=p[:-1]
print(p or "EMPTY")
