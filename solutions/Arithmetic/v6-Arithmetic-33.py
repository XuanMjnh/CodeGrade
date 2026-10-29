import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
x,y,t=a
print(t//math.lcm(x,y))
