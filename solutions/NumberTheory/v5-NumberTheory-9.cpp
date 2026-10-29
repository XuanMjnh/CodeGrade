#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    int ans=0;while(n){ans++;n>>=1;}
    cout << (ans) << "\n";
    return 0;
}
