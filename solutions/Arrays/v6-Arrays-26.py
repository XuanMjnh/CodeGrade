import sys, math, itertools, collections, functools, heapq, bisect

n,k=map(int,input().split())
a=list(map(int,input().split()))
seen=set();cycles=0
for i in range(n):
 if i in seen:continue
 cycles+=1;j=i
 while j not in seen:seen.add(j);j=a[j]-1
print(n-cycles)
