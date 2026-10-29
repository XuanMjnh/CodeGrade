import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(*([x for x in a if x]+[0]*a.count(0)))
