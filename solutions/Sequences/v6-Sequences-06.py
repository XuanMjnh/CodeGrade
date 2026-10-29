import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
d=[0]*n
for i in range(1,n):d[i]=min(d[j]+abs(a[i]-a[j]) for j in range(max(0,i-2),i))
print(d[-1])
