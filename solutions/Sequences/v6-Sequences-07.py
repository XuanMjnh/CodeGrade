import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[10**9]*n;d[0]=0
for i in range(n):
 for j in range(i+1,min(n,i+a[i]+1)):d[j]=min(d[j],d[i]+1)
print(d[-1] if d[-1]<10**9 else -1)
