#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    vector<bool> p(n+1,true);p[0]=p[1]=false;for(long long i=2;i*i<=n;i++)if(p[i])for(long long j=i*i;j<=n;j+=i)p[j]=false;long long ans=count(p.begin(),p.end(),true);
    cout << (ans) << "\n";
    return 0;
}
