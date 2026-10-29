#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    int f[128]={},ans=0;for(unsigned char c:s)ans=max(ans,++f[c]);
    cout << (ans) << "\n";
    return 0;
}
