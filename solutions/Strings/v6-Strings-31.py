import sys, math, itertools, collections, functools, heapq, bisect

s=input();t=input();ans=0
for i in range(len(s)):
 for j in range(i+1,len(s)+1):
  if s[i:j] in t:ans=max(ans,j-i)
print(ans)
