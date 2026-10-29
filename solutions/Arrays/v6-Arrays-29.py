import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
a=[tuple(map(int,input().split())) for _ in range(n)]
a.sort();out=[]
for l,r in a:
 if out and l<=out[-1][1]:out[-1][1]=max(out[-1][1],r)
 else:out.append([l,r])
print(len(out))
for v in out:print(*v)
