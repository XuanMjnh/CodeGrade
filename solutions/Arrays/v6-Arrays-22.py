import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
order=sorted(range(n),key=lambda i:(a[i],i))
r=[0]*n
for j,i in enumerate(order,1):r[i]=j
print(*r)
