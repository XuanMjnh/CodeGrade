#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    map<long long,int> f; int ans=0; for(auto x:v)ans=max(ans,++f[x]);
    cout << (ans) << "\n";
    return 0;
}
