import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())
def solve(row,cols,d1,d2):
 if row==n:return 1
 return sum(solve(row+1,cols|{c},d1|{row-c},d2|{row+c}) for c in range(n) if c not in cols and row-c not in d1 and row+c not in d2)
print(solve(0,set(),set(),set()))
