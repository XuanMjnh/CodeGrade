import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
d=[0]*(n+1);d[0]=1
for i in range(2,n+1,2):d[i]=3*d[i-2]+2*sum(d[:i-2:2])
print(d[n])
