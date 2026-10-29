#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    long long ans=n,x=n;for(long long p=2;p*p<=x;p++)if(x%p==0){ans-=ans/p;while(x%p==0)x/=p;}if(x>1)ans-=ans/x;
    cout << (ans) << "\n";
    return 0;
}
