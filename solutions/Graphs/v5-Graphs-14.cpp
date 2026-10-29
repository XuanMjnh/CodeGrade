#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,m;cin>>n>>m;vector<vector<int>>g(n);vector<pair<int,int>>edges;
    for(int i=0;i<m;i++){int a,b;cin>>a>>b;--a;--b;g[a].push_back(b);g[b].push_back(a);edges.push_back({a,b});}
    vector<int>d(n,-1),q(1,0);d[0]=0;for(int at=0;at<(int)q.size();at++){int u=q[at];for(int v:g[u])if(d[v]<0){d[v]=d[u]+1;q.push_back(v);}}
    cout << (*max_element(d.begin(),d.end())) << "\n";
    return 0;
}
