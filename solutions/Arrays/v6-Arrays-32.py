import sys, math, itertools, collections, functools, heapq, bisect

n,m=map(int,input().split())
a=[list(map(int,input().split())) for _ in range(n)]
for row in zip(*a):print(*row)
