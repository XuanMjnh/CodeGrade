#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    int cur=1,ans=1;for(int j=1;j<n;j++){cur=((v[j]>0&&v[j-1]<0)||(v[j]<0&&v[j-1]>0))?cur+1:1;ans=max(ans,cur);}
    cout << (ans) << "\n";
    return 0;
}
