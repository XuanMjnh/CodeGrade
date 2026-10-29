import sys, math, itertools, collections, functools, heapq, bisect

n,m=map(int,input().split())
a=[list(map(int,input().split())) for _ in range(n)]
for i in range(n):
 for j in range(m):
  if i or j:a[i][j]+=min(a[i-1][j] if i else 10**30,a[i][j-1] if j else 10**30)
print(a[-1][-1])
