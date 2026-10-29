import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(max(((j-i)*min(a[i],a[j]) for i in range(n) for j in range(i+1,n)),default=0))
