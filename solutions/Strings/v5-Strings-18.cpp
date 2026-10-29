#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    int n=s.size();vector<vector<bool>> d(n,vector<bool>(n));long long ans=0;for(int len=1;len<=n;len++)for(int l=0;l+len<=n;l++){int r=l+len-1;d[l][r]=s[l]==s[r]&&(len<=2||d[l+1][r-1]);ans+=d[l][r];}
    cout << (ans) << "\n";
    return 0;
}
