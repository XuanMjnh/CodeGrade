import sys, math, itertools, collections, functools, heapq, bisect

s=input();st=[];ok=True
pairs={")":"(","]":"[","}":"{"}
for c in s:
 if c in "([{":st.append(c)
 elif not st or st.pop()!=pairs[c]:ok=False;break
print(int(ok and not st))
