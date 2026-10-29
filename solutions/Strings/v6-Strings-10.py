import sys, math, itertools, collections, functools, heapq, bisect

s=input();t=input();d=[0]*(len(t)+1)
for x in s:
 nd=[0]*(len(t)+1)
 for j,y in enumerate(t,1):nd[j]=d[j-1]+1 if x==y else max(d[j],nd[j-1])
 d=nd
print(d[-1])
