import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[[0]*(n+1) for _ in range(n+1)]
for i in range(1,n+1):
 for j in range(1,n+1):d[i][j]=d[i-1][j-1]+1 if i!=j and a[i-1]==a[j-1] else max(d[i-1][j],d[i][j-1])
print(d[n][n])
