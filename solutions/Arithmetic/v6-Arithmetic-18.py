import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
a,b,c=a
d=b*b-4*a*c
print(0 if d<0 else 1 if d==0 else 2)
