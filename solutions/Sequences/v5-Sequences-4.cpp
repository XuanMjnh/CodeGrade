#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    long long a=0,b=0;for(auto x:v){long long next=max(b,a+x);a=b;b=next;}long long ans=b;
    cout << (ans) << "\n";
    return 0;
}
