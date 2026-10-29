import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
a=[tuple(map(int,input().split())) for _ in range(n)]
empty=sum(l==r for l,r in a);last=-1;ans=empty
for l,r in sorted((v for v in a if v[0]<v[1]),key=lambda v:v[1]):
 if l>=last:ans+=1;last=r
print(ans)
