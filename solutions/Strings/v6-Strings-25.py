import sys, math, itertools, collections, functools, heapq, bisect

p=input().split(".")
print(int(len(p)==4 and all(v.isascii() and v.isdigit() and len(v)<=3 and str(int(v))==v and int(v)<=255 for v in p)))
