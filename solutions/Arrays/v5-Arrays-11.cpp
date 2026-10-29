#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    sort(v.begin(),v.end());
    cout << (v[n/2]) << "\n";
    return 0;
}
