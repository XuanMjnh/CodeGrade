import sys, math, itertools, collections, functools, heapq, bisect

s=input();v=[i for i in range(1,len(s)) if s[:i]==s[-i:]]
print(" ".join(map(str,v)) or "NONE")
