#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    long long cur=v[0],ans=cur;for(int j=1;j<n;j++){cur=min(v[j],cur+v[j]);ans=min(ans,cur);}
    cout << (ans) << "\n";
    return 0;
}
