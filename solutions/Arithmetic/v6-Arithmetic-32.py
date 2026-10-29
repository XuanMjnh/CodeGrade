import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
x,y,k=a
print(((x+k-1)//k)*((y+k-1)//k))
