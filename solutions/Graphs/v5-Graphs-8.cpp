#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n,m;cin>>n>>m;vector<vector<int>>g(n);vector<pair<int,int>>edges;
    for(int i=0;i<m;i++){int a,b;cin>>a>>b;--a;--b;g[a].push_back(b);g[b].push_back(a);edges.push_back({a,b});}
    vector<int> color(n,-1),sizes;bool bip=true;
    for(int start=0;start<n;start++)if(color[start]<0){vector<int> q(1,start);color[start]=0;for(int at=0;at<(int)q.size();at++){int u=q[at];for(int v:g[u]){if(color[v]<0){color[v]=1-color[u];q.push_back(v);}else if(color[v]==color[u])bip=false;}}sizes.push_back(q.size());}
    cout << (*min_element(sizes.begin(),sizes.end())) << "\n";
    return 0;
}
