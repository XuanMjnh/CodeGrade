#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    int ans=0,cur=0;for(char c:s){cur=c==' '?0:cur+1;ans=max(ans,cur);}
    cout << (ans) << "\n";
    return 0;
}
