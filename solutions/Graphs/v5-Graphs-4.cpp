#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,m;cin>>n>>m;vector<vector<int>>g(n);vector<pair<int,int>>edges;
    for(int i=0;i<m;i++){int a,b;cin>>a>>b;--a;--b;g[a].push_back(b);g[b].push_back(a);edges.push_back({a,b});}
    int ans=n;for(auto &v:g)ans=min(ans,(int)v.size());
    cout << (ans) << "\n";
    return 0;
}
