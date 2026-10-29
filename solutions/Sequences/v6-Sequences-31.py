import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
d={0:1}
for _ in range(n):
 nd=collections.defaultdict(int)
 for p,v in d.items():
  nd[p+1]+=v
  if p:nd[p-1]+=v
 d=nd
print(d.get(0,0))
