import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())

print(sum(sum(map(int,str(i))) for i in range(1,n+1)))
