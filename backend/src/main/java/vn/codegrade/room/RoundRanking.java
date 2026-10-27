package vn.codegrade.room;

import java.util.*;

/** Ordering depends only on admission timestamps and verdicts, never worker completion time. */
public final class RoundRanking {
    public record Attempt(String user, String verdict, double score, long receivedAt) {}
    public record Rank(String userId, boolean ac, double score, long effectiveMs, long receivedAt, int wrong, int attempts) {}
    public static final Comparator<Rank> ORDER=Comparator.comparing(Rank::ac).reversed()
        .thenComparingLong(r->r.ac()?r.effectiveMs():0)
        .thenComparing(Comparator.comparingDouble((Rank r)->r.ac()?0:r.score()).reversed())
        .thenComparingLong(Rank::receivedAt)
        .thenComparingInt(r->r.ac()?r.wrong():r.attempts());
    public static List<Rank> rank(List<String> players,List<Attempt> attempts,long start) {
        var out=new ArrayList<Rank>();
        for(String user:players) {
            var a=attempts.stream().filter(t->t.user().equals(user) && !t.verdict().equals("SE"))
                .sorted(Comparator.comparingLong(Attempt::receivedAt)).toList();
            int wrong=0; Attempt ac=null;
            for(var t:a) { if(t.verdict().equals("AC")) { ac=t; break; } wrong++; }
            if(ac!=null) out.add(new Rank(user,true,100,ac.receivedAt()-start+wrong*10_000L,ac.receivedAt(),wrong,a.size()));
            else {
                var best=a.stream().sorted(Comparator.comparingDouble(Attempt::score).reversed().thenComparingLong(Attempt::receivedAt)).findFirst();
                out.add(new Rank(user,false,best.map(Attempt::score).orElse(0.0),Long.MAX_VALUE,
                    best.map(Attempt::receivedAt).orElse(Long.MAX_VALUE),a.size(),a.size()));
            }
        }
        out.sort(ORDER); return out;
    }
    public static int survivors(int n) { return n==2?1:Math.max(2,(int)Math.floor(n*0.7)); }
    public static int mainRounds(int n) { int count=0; while(n>1) { n=survivors(n); count++; } return count; }
    public static boolean tied(Rank a,Rank b) { return ORDER.compare(a,b)==0; }
}
