import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
l,r=a
x=0
for i in range(l,r+1):x^=i
print(x)
