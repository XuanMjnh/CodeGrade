#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long a,b; cin >> a >> b;
    const long long M=1000000007; long long r=1; while(b){if(b&1)r=r*a%M; a=a*a%M; b>>=1;}
    cout << (r) << "\n";
    return 0;
}
