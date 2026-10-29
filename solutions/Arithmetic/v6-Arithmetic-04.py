import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
x=0
while (x+1)**3<=n:x+=1
print(x)
