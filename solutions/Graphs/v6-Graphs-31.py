import sys, math, itertools, collections, functools, heapq, bisect

n=int(input());q=collections.deque([(0,0)]);d={(0,0):0}
while q:
 x,y=q.popleft()
 for dx,dy in [(1,2),(1,-2),(-1,2),(-1,-2),(2,1),(2,-1),(-2,1),(-2,-1)]:
  u,v=x+dx,y+dy
  if 0<=u<n and 0<=v<n and (u,v) not in d:d[u,v]=d[x,y]+1;q.append((u,v))
print(d.get((n-1,n-1),-1))
