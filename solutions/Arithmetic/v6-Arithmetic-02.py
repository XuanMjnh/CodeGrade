import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())

print(f"{n//3600:02}:{n//60%60:02}:{n%60:02}")
