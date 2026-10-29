import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(max(sum(a[i:i+k]) for i in range(n-k+1)))
