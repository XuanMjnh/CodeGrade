import sys, math, itertools, collections, functools, heapq, bisect

s=input();st=[-1];ans=0
for i,c in enumerate(s):
 if c=="(":st.append(i)
 else:
  st.pop()
  if not st:st.append(i)
  else:ans=max(ans,i-st[-1])
print(ans)
