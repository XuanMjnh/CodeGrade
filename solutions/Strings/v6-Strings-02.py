import sys, math, itertools, collections, functools, heapq, bisect

s=input();t=input()
print(sum(s.startswith(t,i) for i in range(len(s))))
