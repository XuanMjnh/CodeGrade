#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    int ans=(n&(n-1))==0;
    cout << (ans) << "\n";
    return 0;
}
