import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[[0]*n for _ in a]
for length in range(2,n+1):
 for l in range(n-length+1):
  r=l+length-1;d[l][r]=min(d[l][m]+d[m+1][r] for m in range(l,r))+sum(a[l:r+1])
print(d[0][n-1])
