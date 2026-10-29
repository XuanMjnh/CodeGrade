#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    vector<vector<int>>d(n,vector<int>(n));for(int l=n-1;l>=0;l--){d[l][l]=1;for(int r=l+1;r<n;r++)d[l][r]=v[l]==v[r]?2+(r>l+1?d[l+1][r-1]:0):max(d[l+1][r],d[l][r-1]);}long long ans=d[0][n-1];
    cout << (ans) << "\n";
    return 0;
}
