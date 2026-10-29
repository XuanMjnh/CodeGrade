import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
print(*(next((str(x) for x in a[i+1:] if x>a[i]),"NONE") for i in range(n)))
