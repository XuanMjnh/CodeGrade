import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())

print(sum(i.bit_count() for i in range(n+1)))
