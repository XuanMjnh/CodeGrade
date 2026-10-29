import sys, math, itertools, collections, functools, heapq, bisect

n=int(input())

print(int(n%400==0 or n%4==0 and n%100!=0))
