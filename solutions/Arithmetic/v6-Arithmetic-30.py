import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
l,r=a
x=l
for i in range(l+1,r+1):x&=i
print(x)
