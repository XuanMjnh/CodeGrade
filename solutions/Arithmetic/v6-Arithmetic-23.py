import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
x,y,u,v=a
print(max(0,min(y,v)-max(x,u)))
