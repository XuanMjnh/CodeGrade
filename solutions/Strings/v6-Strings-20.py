import sys, math, itertools, collections, functools, heapq, bisect

s=input();d=dict(I=1,V=5,X=10,L=50,C=100,D=500,M=1000)
print(sum(-d[c] if i+1<len(s) and d[c]<d[s[i+1]] else d[c] for i,c in enumerate(s)))
