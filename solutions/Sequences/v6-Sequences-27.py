import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
d=[1]+[0]*n
for c in range(1,n+1):
 for x in range(c,n+1):d[x]+=d[x-c]
print(d[n])
