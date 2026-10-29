#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    int ans=0;for(char c:s)ans+=((c>='a'&&c<='z')||(c>='A'&&c<='Z'));
    cout << (ans) << "\n";
    return 0;
}
