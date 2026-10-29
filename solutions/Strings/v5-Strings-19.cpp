#include <bits/stdc++.h>
using namespace std;
struct State { int len=0,link=-1; array<int,26> next; State(){next.fill(-1);} };

int main() {
    ios::sync_with_stdio(false); cin.tie(nullptr);
    string s; getline(cin,s);
    vector<State> st(1);int last=0;
    for(char ch:s){int c=ch-'a',cur=st.size();st.push_back(State());st[cur].len=st[last].len+1;int p=last;
        while(p!=-1&&st[p].next[c]==-1){st[p].next[c]=cur;p=st[p].link;}
        if(p==-1)st[cur].link=0;
        else {int q=st[p].next[c];if(st[p].len+1==st[q].len)st[cur].link=q;
            else {int clone=st.size();st.push_back(st[q]);st[clone].len=st[p].len+1;
                while(p!=-1&&st[p].next[c]==q){st[p].next[c]=clone;p=st[p].link;}
                st[q].link=st[cur].link=clone;}}
        last=cur;
    }
    long long ans=0;for(int j=1;j<(int)st.size();j++)ans+=st[j].len-st[st[j].link].len;
    cout << (ans) << "\n";
    return 0;
}
