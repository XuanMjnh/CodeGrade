#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    cout << (count_if(v.begin(),v.end(),[](long long x){return x%2!=0;})) << "\n";
    return 0;
}
