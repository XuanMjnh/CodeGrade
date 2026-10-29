import sys, math, itertools, collections, functools, heapq, bisect

s=input();st=[]
for p in s.split("/"):
 if p=="..":
  if st:st.pop()
 elif p and p!=".":st.append(p)
print("/"+"/".join(st))
