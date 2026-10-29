import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
n,b=a
s=""
while n:n,r=divmod(n,b);s="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[r]+s
print(s or "0")
