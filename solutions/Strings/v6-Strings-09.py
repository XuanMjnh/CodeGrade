import sys, math, itertools, collections, functools, heapq, bisect

s=input();t=input();d=list(range(len(t)+1))
for i,x in enumerate(s,1):
 nd=[i]+[0]*len(t)
 for j,y in enumerate(t,1):nd[j]=min(d[j]+1,nd[j-1]+1,d[j-1]+(x!=y))
 d=nd
print(d[-1])
