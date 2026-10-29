#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    auto s=v;sort(s.begin(),s.end());s.erase(unique(s.begin(),s.end()),s.end());vector<long long>bit(s.size()+1);long long ans=0;const long long M=1000000007;for(auto x:v){int at=lower_bound(s.begin(),s.end(),x)-s.begin()+1;long long count=1;for(int j=at-1;j;j-=j&-j)count=(count+bit[j])%M;ans=(ans+count)%M;for(int j=at;j<(int)bit.size();j+=j&-j)bit[j]=(bit[j]+count)%M;}
    cout << (ans) << "\n";
    return 0;
}
