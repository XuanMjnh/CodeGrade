import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
n,k=a
r=0
for i in range(1,n+1):r=(r+k)%i
print(r+1)
