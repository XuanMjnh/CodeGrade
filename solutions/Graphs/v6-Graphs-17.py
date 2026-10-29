import sys, math, itertools, collections, functools, heapq, bisect

def context(n,edges,directed=False):
 g=[[] for _ in range(n)]
 for u,v,w in edges:
  g[u].append((v,w))
  if not directed:g[v].append((u,w))
 return g
def distances(n,edges,directed=False):
 d=[[10**12]*n for _ in range(n)]
 for i in range(n):d[i][i]=0
 for u,v,w in edges:
  d[u][v]=min(d[u][v],w)
  if not directed:d[v][u]=min(d[v][u],w)
 for k in range(n):
  for i in range(n):
   for j in range(n):d[i][j]=min(d[i][j],d[i][k]+d[k][j])
 return d
def connected(n,edges,removed_vertex=-1):
 g=context(n,edges);seen={removed_vertex};count=0
 for start in range(n):
  if start in seen:continue
  count+=1;stack=[start];seen.add(start)
  while stack:
   u=stack.pop()
   for v,w in g[u]:
    if v not in seen:seen.add(v);stack.append(v)
 return count
def spanning(n,edges):
 out=[]
 for chosen in itertools.combinations(edges,n-1):
  if connected(n,chosen)==1:out.append(sum(w for u,v,w in chosen))
 return out
def tree_parent(n,g):
 parent=[-1]*n;order=[0];parent[0]=0
 for u in order:
  for v,w in g[u]:
   if parent[v]<0:parent[v]=u;order.append(v)
 return parent,order
def maxflow(n,edges,s,t):
 if s==t:return 0
 c=[[0]*n for _ in range(n)]
 for u,v,w in edges:c[u][v]+=w
 total=0
 while True:
  p=[-1]*n;p[s]=s;q=[s]
  for u in q:
   for v in range(n):
    if p[v]<0 and c[u][v]>0:p[v]=u;q.append(v)
  if p[t]<0:return total
  x=t;amount=10**12
  while x!=s:amount=min(amount,c[p[x]][x]);x=p[x]
  x=t
  while x!=s:c[p[x]][x]-=amount;c[x][p[x]]+=amount;x=p[x]
  total+=amount

n,m=map(int,input().split())
edges=[]
for _ in range(m):
 u,v,w=map(int,input().split());edges.append((u-1,v-1,w))
g=context(n,edges,False)
p,order=tree_parent(n,g);size=[1]*n
for u in order[:0:-1]:size[p[u]]+=size[u]
print(*size)
