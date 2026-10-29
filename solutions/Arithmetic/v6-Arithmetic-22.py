import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
x,y,u,v,p,q=a
print(abs((u-x)*(q-y)-(v-y)*(p-x)))
