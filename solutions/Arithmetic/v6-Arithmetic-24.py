import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
x,y,k=a
print(y//k-(x-1)//k)
