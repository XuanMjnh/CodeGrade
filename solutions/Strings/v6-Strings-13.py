import sys, math, itertools, collections, functools, heapq, bisect

s=input();bal=ans=0
for c in s:
 if c=="(":bal+=1
 elif bal:bal-=1
 else:ans+=1
print(ans+bal)
