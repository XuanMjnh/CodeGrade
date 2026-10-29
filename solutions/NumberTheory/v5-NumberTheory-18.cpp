#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    vector<long long> p(n+1);iota(p.begin(),p.end(),0);for(long long i=2;i<=n;i++)if(p[i]==i)for(long long j=i;j<=n;j+=i)p[j]-=p[j]/i;long long ans=accumulate(p.begin()+2,p.end(),0LL);
    cout << (ans) << "\n";
    return 0;
}
