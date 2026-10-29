import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
up=down=1
for x,y in zip(a,a[1:]):
 if x<y:up=down+1
 elif x>y:down=up+1
print(max(up,down))
