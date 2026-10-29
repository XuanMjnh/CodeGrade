#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    vector<long long>d;for(auto x:v){auto it=lower_bound(d.begin(),d.end(),x);if(it==d.end())d.push_back(x);else *it=x;} long long ans=d.size();
    cout << (ans) << "\n";
    return 0;
}
