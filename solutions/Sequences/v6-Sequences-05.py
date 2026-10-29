import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
s={0}
for c in a:s|={x+c for x in s if x+c<=k}
print(max(s))
