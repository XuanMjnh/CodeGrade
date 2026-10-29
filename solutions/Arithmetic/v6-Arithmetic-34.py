import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
n,k=a
print(math.comb(n-1,k-1) if n>=k else 0)
