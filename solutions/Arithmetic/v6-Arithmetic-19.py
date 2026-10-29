import sys, math, itertools, collections, functools, heapq, bisect

a=list(map(int,input().split()))
m,y=a
print([31,29 if y%400==0 or y%4==0 and y%100!=0 else 28,31,30,31,30,31,31,30,31,30,31][m-1])
