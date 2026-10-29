import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
dp=list(range(n+1))
for i in range(2,n+1):dp[i]=max(max(j,dp[j])*max(i-j,dp[i-j]) for j in range(1,i))
dp[n]=max(j*dp[n-j] for j in range(1,n))
print(dp[n])
