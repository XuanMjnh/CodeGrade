#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    string r=s;reverse(r.begin(),r.end());
    cout << (s==r) << "\n";
    return 0;
}
