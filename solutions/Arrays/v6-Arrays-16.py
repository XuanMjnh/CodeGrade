import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(max((a[j]-a[i] for i in range(n) for j in range(i+1,n)),default=0) if n==1 else max(0,max(a[j]-a[i] for i in range(n) for j in range(i+1,n))))
