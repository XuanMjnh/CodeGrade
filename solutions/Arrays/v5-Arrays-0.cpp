#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    cout << (accumulate(v.begin(),v.end(),0LL)) << "\n";
    return 0;
}
