import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split(".")));b=list(map(int,input().split(".")));n=max(len(a),len(b));a+=[0]*(n-len(a));b+=[0]*(n-len(b))
print((a>b)-(a<b))
