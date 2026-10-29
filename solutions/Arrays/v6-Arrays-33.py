import sys, math, itertools, collections, functools, heapq, bisect

n,m=map(int,input().split())
a=[list(map(int,input().split())) for _ in range(n)]
out=[]
while a:
 out+=a.pop(0)
 a=[list(r) for r in zip(*a)][::-1] if a else []
print(*out)
