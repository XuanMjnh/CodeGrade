import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
p=[0]+list(itertools.accumulate(a));d=[[10**9]*(n+1) for _ in range(k+1)];d[0][0]=0
for t in range(1,k+1):
 for i in range(t,n+1):d[t][i]=min(max(d[t-1][j],p[i]-p[j]) for j in range(t-1,i))
print(d[k][n])
