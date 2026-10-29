#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    long long top=LLONG_MIN,ans=0;for(auto x:v){top=max(top,x);ans+=x==top;}
    cout << (ans) << "\n";
    return 0;
}
