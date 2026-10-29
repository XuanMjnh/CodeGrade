import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
a=[tuple(map(int,input().split())) for _ in range(n)]
print(max((sum(l<=t<r for l,r in a) for t in range(1001)),default=0))
