import sys, math, itertools, collections, functools, heapq, bisect

s=input();p=[0]*len(s)
for i in range(1,len(s)):
 j=p[i-1]
 while j and s[i]!=s[j]:j=p[j-1]
 if s[i]==s[j]:j+=1
 p[i]=j
print(*p)
