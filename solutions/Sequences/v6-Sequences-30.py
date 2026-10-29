import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
d={("",0):1}
for _ in range(n):
 nd=collections.defaultdict(int)
 for (last,run),v in d.items():
  for c in "01":
   r=run+1 if c==last else 1
   if r<3:nd[c,r]+=v
 d=nd
print(sum(d.values()))
