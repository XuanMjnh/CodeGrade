#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    long long lo=v[0],hi=v[0],ans=v[0];for(int j=1;j<n;j++){long long a=lo*v[j],b=hi*v[j];lo=min(v[j],min(a,b));hi=max(v[j],max(a,b));ans=max(ans,hi);}
    cout << (ans) << "\n";
    return 0;
}
