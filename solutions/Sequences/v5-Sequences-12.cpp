#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    sort(v.begin(),v.end());long long ans=n==1?0:LLONG_MAX;for(int j=1;j<n;j++)ans=min(ans,v[j]-v[j-1]);
    cout << (ans) << "\n";
    return 0;
}
