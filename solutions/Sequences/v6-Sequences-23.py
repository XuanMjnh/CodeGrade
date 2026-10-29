import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
a,b=1,0
for i in range(2,n+1):a,b=b,(i-1)*(a+b)
print(1 if n==0 else b)
