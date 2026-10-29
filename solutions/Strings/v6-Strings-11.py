import sys, math, itertools, collections, functools, heapq, bisect

s=input();p=input();d=[True]+[False]*len(s)
for c in p:
 nd=[False]*(len(s)+1);nd[0]=d[0] and c=="*"
 for j in range(1,len(s)+1):nd[j]=(d[j] or nd[j-1]) if c=="*" else d[j-1] and (c=="?" or c==s[j-1])
 d=nd
print(int(d[-1]))
