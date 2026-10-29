#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    long long ans=1;for(long long i=1;i<=n;i++)ans=ans*i%1000000007;
    cout << (ans) << "\n";
    return 0;
}
