import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
n=a[0]
print((min(max(n-100,0),400)+2*max(n-500,0))//10)
