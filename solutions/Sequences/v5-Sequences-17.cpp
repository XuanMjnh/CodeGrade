#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    map<long long,int>first;first[0]=0;long long s=0;int ans=0;for(int j=0;j<n;j++){s+=v[j];if(first.count(s))ans=max(ans,j+1-first[s]);else first[s]=j+1;}
    cout << (ans) << "\n";
    return 0;
}
