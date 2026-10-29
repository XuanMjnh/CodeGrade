#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,m;cin>>n>>m;vector<vector<int>>g(n);vector<pair<int,int>>edges;
    for(int i=0;i<m;i++){int a,b;cin>>a>>b;--a;--b;g[a].push_back(b);g[b].push_back(a);edges.push_back({a,b});}
    vector<vector<int>> out(n);for(auto e:edges){int a=e.first,b=e.second;if(make_pair(g[a].size(),a)>make_pair(g[b].size(),b))swap(a,b);out[a].push_back(b);}
    vector<int> mark(n,-1);long long ans=0;for(int u=0;u<n;u++){for(int v:out[u])mark[v]=u;for(int v:out[u])for(int w:out[v])ans+=mark[w]==u;}
    cout << (ans) << "\n";
    return 0;
}
