#include <bits/stdc++.h>
using namespace std;
vector<long long> sums(const vector<long long>& v,int l,int r){vector<long long>s(1,0);for(int i=l;i<r;i++){int n=s.size();for(int j=0;j<n;j++)s.push_back(s[j]+v[i]);}return s;}

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    auto a=sums(v,0,n/2),b=sums(v,n/2,n);sort(b.begin(),b.end());long long ans=0;
    for(auto x:a)ans+=b.end()-upper_bound(b.begin(),b.end(),-x);
    cout << (ans) << "\n";
    return 0;
}
