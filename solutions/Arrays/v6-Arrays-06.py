import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(*(next((j+1 for j in range(i-1,-1,-1) if a[j]<a[i]),0) for i in range(n)))
