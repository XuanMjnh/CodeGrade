import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
out=''
while n:
 n,r=divmod(n,-2)
 if r<0:n+=1;r+=2
 out=str(r)+out
print(out or "0")
