#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long a,b; cin >> a >> b;
    long long x=a,y=b; while(y){long long t=x%y;x=y;y=t;} long long g=x;
    cout << (a/g*b) << "\n";
    return 0;
}
