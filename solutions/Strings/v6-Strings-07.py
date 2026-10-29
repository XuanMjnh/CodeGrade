import sys, math, itertools, collections, functools, heapq, bisect

s=input();t=input()
print(int(len(s)==len(t) and t in s+s))
