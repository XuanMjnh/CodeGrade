import sys, math, itertools, collections, functools, heapq, bisect

s=input()
print(min(s[i:]+s[:i] for i in range(len(s))))
