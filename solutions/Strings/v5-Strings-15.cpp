#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    for(char &c:s){if(c>='a'&&c<='z')c=c-'a'+'A';else if(c>='A'&&c<='Z')c=c-'A'+'a';}
    cout << (s) << "\n";
    return 0;
}
