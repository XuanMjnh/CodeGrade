import sys, math, itertools, collections, functools, heapq, bisect

k=int(input());s=input()
print("".join(chr((ord(c)-97-k)%26+97) for c in s))
