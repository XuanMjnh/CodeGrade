#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    cout << (set<char>(s.begin(),s.end()).size()) << "\n";
    return 0;
}
