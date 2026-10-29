import sys, math, itertools, collections, functools, heapq, bisect

s=input();left=collections.Counter(s);st=[];used=set()
for c in s:
 left[c]-=1
 if c in used:continue
 while st and st[-1]>c and left[st[-1]]:used.remove(st.pop())
 st.append(c);used.add(c)
print("".join(st))
