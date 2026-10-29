import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
d=[0,0,1]
for i in range(3,n+1):d.append(sum(d[-3:]))
print(d[n])
