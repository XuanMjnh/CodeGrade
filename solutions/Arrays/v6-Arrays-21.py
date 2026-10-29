import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(min((j-i for i in range(n) for j in range(i+1,n+1) if sum(a[i:j])>=k),default=0))
