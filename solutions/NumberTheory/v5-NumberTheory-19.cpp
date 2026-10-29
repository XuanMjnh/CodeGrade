#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    long long ans=0;for(long long l=1,r;l<=n;l=r+1){long long q=n/l;r=n/q;ans+=(r-l+1)*q;}
    cout << (ans) << "\n";
    return 0;
}
