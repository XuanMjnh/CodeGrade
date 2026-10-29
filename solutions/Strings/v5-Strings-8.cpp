#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    int ans=0;for(int j=0;j<(int)s.size();j++)ans+=s[j]!=' '&&(j==0||s[j-1]==' ');
    cout << (ans) << "\n";
    return 0;
}
