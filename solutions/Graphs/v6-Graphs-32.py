import sys, math, itertools, collections, functools, heapq, bisect

n,m=map(int,input().split());p=list(range(n));count=n
def find(x):
 while p[x]!=x:p[x]=p[p[x]];x=p[x]
 return x
for _ in range(m):
 u,v=map(int,input().split());u,v=find(u-1),find(v-1)
 if u!=v:p[u]=v;count-=1
 print(count)
