#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    auto s=v; sort(s.begin(),s.end());s.erase(unique(s.begin(),s.end()),s.end()); vector<int> bit(s.size()+1);long long ans=0;int seen=0; for(auto x:v){int k=lower_bound(s.begin(),s.end(),x)-s.begin()+1,at=k,c=0;for(;at;at-=at&-at)c+=bit[at];ans+=seen-c;for(at=k;at<(int)bit.size();at+=at&-at)++bit[at];++seen;}
    cout << (ans) << "\n";
    return 0;
}
