import sys, math, itertools, collections, functools, heapq, bisect

a=input().split();a.sort(key=functools.cmp_to_key(lambda x,y:(x+y<y+x)-(x+y>y+x)))
print("".join(a).lstrip("0") or "0")
