import sys, math, itertools, collections, functools, heapq, bisect

s=input();n=0
for c in s:n=n*26+ord(c)-64
print(n)
