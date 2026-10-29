#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    int S=0;for(auto x:v)S+=llabs(x);vector<bool>d(2*S+1);d[S]=true;for(auto x:v){auto next=d;for(int j=0;j<=2*S;j++)if(d[j]&&j+x>=0&&j+x<=2*S)next[j+x]=true;d.swap(next);}long long ans=count(d.begin(),d.end(),true);
    cout << (ans) << "\n";
    return 0;
}
