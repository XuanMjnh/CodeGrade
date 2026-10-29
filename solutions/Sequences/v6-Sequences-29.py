import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
a,b=1,0
for _ in range(n):a,b=a+b,a
print(a+b)
