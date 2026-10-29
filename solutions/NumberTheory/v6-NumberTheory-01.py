import sys, math, itertools, collections, functools, heapq, bisect

def factor(n):
 d={};p=2
 while p*p<=n:
  while n%p==0:d[p]=d.get(p,0)+1;n//=p
  p+=1
 if n>1:d[n]=d.get(n,0)+1
 return d
def prime(n):return n>=2 and all(n%i for i in range(2,math.isqrt(n)+1))
def divisors(n):return [i for i in range(1,n+1) if n%i==0]
def phi(n):
 r=n
 for p in factor(n):r=r//p*(p-1)
 return r
def order(a,m):
 x=1
 for k in range(1,m+1):
  x=x*a%m
  if x==1:return k
 return 0

v=list(map(int,input().split()))
n=v[0]
d=factor(n)
if not d:print("NONE")
for p,e in d.items():print(p,e)
