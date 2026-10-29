import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[[0]*n for _ in a]
for length in range(2,n):
 for l in range(n-length):
  r=l+length;d[l][r]=min(d[l][m]+d[m][r]+a[l]*a[m]*a[r] for m in range(l+1,r))
print(d[0][n-1])
