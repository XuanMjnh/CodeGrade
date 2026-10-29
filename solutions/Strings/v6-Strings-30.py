import sys, math, itertools, collections, functools, heapq, bisect

s=input();d={c:str(i+2) for i,g in enumerate(["abc","def","ghi","jkl","mno","pqrs","tuv","wxyz"]) for c in g}
print("".join(d[c] for c in s))
