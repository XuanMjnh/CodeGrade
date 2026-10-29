#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long a,b; cin >> a >> b;
    while(b){ long long t=a%b; a=b; b=t; }
    cout << (a) << "\n";
    return 0;
}
