import sys, math, itertools, collections, functools, heapq, bisect

s=input();z=[]
for i in range(len(s)):
 j=0
 while i+j<len(s) and s[j]==s[i+j]:j+=1
 z.append(j)
print(*z)
