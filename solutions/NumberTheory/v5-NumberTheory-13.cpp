#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    long long x=n,p=n;for(long long d=2;d*d<=x;d++)if(x%d==0){p-=p/d;while(x%d==0)x/=d;}if(x>1)p-=p/x;long long ans=n==1?1:n*p/2;
    cout << (ans) << "\n";
    return 0;
}
