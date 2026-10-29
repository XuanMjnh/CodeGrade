import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(sum(a[i]+a[j]==k for i in range(n) for j in range(i+1,n)))
