#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    sort(v.begin(),v.end());long long ans=n==1?0:max(v[0]*v[1],v[n-1]*v[n-2]);
    cout << (ans) << "\n";
    return 0;
}
