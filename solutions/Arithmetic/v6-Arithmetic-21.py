import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
x,y,u,v,p,q=a
d=(u-x)*(q-y)-(v-y)*(p-x)
print((d>0)-(d<0))
