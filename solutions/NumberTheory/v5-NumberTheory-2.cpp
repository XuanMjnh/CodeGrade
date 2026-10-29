#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    long long ans=-n;for(long long d=1;d*d<=n;d++)if(n%d==0){ans+=d;if(d*d!=n)ans+=n/d;}
    cout << (ans) << "\n";
    return 0;
}
