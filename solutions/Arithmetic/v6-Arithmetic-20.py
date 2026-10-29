import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
x,y,z=sorted(a)
print("INVALID" if x+y<=z else "RIGHT" if x*x+y*y==z*z else "ACUTE" if x*x+y*y>z*z else "OBTUSE")
