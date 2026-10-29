import sys, math, itertools, collections, functools, heapq, bisect

s=input()
print(" ".join(c+":"+str(len(list(g))) for c,g in itertools.groupby(s)))
