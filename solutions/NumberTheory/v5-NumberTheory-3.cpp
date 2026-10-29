#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    int ans=n>1;for(long long d=2;d*d<=n;d++)if(n%d==0){ans=0;break;}
    cout << (ans) << "\n";
    return 0;
}
