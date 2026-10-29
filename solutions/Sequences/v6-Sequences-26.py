import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
s=[[0]*(n+1) for _ in range(n+1)];s[0][0]=1
for i in range(1,n+1):
 for j in range(1,i+1):s[i][j]=s[i-1][j-1]+j*s[i-1][j]
print(sum(s[n]))
