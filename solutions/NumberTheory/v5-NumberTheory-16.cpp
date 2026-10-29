#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    long long n; cin >> n;
    long long a=1,b=0,c=0,d=1,e=1,f=1,g=1,h=0;const long long M=1000000007;while(n){if(n&1){long long A=(a*e+b*g)%M,B=(a*f+b*h)%M,C=(c*e+d*g)%M,D=(c*f+d*h)%M;a=A;b=B;c=C;d=D;}long long E=(e*e+f*g)%M,F=(e*f+f*h)%M,G=(g*e+h*g)%M,H=(g*f+h*h)%M;e=E;f=F;g=G;h=H;n>>=1;}long long ans=b;
    cout << (ans) << "\n";
    return 0;
}
