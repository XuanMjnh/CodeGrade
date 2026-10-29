#include <bits/stdc++.h>
using namespace std;
vector<long long> sums(const vector<long long>& v,int l,int r){vector<long long>s(1,0);for(int i=l;i<r;i++){int n=s.size();for(int j=0;j<n;j++)s.push_back(s[j]+v[i]);}return s;}

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    int n; cin >> n; vector<long long> v(n); for (auto &x:v) cin >> x;
    auto a=sums(v,0,n/2),b=sums(v,n/2,n);sort(b.begin(),b.end());long long ans=0;
    long long total=accumulate(v.begin(),v.end(),0LL);ans=llabs(total);for(auto x:a){long long target=total-2*x;long long need=target/2;if(target>0&&target%2)++need;auto p=lower_bound(b.begin(),b.end(),need);if(p!=b.end())ans=min(ans,llabs(total-2*(x+*p)));if(p!=b.begin()){--p;ans=min(ans,llabs(total-2*(x+*p)));}}
    cout << (ans) << "\n";
    return 0;
}
