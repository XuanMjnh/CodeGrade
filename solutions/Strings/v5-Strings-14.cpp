#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    s.erase(remove(s.begin(),s.end(),' '),s.end());
    cout << (s) << "\n";
    return 0;
}
