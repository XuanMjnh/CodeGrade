import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
b=[1]+a+[1];d=[[0]*(n+2) for _ in b]
for length in range(1,n+1):
 for l in range(1,n-length+2):
  r=l+length-1;d[l][r]=max(d[l][m-1]+d[m+1][r]+b[l-1]*b[m]*b[r+1] for m in range(l,r+1))
print(d[1][n])
