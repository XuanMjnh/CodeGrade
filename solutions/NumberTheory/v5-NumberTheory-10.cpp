#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    long long l=0,r=1000000001;while(l+1<r){long long m=(l+r)/2;if(m<=n/m)l=m;else r=m;}long long ans=l*l==n;
    cout << (ans) << "\n";
    return 0;
}
