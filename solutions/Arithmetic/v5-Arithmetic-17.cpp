#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long a,b; cin >> a >> b;
    long long c[61][61]={}; for(int n=0;n<=a+b;n++){c[n][0]=1;for(int k=1;k<=n;k++)c[n][k]=c[n-1][k-1]+c[n-1][k];}
    cout << (c[a+b][a]) << "\n";
    return 0;
}
