#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    long long ans=0;while(n){n/=5;ans+=n;}
    cout << (ans) << "\n";
    return 0;
}
