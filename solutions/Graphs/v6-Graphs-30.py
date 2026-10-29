import sys, math, itertools, collections, functools, heapq, bisect

n,m=map(int,input().split());a=[input() for _ in range(n)];d={(0,0):0};q=collections.deque([(0,0)])
while q:
 x,y=q.popleft()
 for u,v in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
  if 0<=u<n and 0<=v<m and a[u][v]=="." and (u,v) not in d:d[u,v]=d[x,y]+1;q.append((u,v))
print(d.get((n-1,m-1),-1))
