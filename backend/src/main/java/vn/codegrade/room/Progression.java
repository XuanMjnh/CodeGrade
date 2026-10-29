package vn.codegrade.room;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.codegrade.db.Store;
import java.util.*;
import static vn.codegrade.db.Store.require;

/** All callers hold Store.atomic's database lock, including worker settlement. */
@Service
public class Progression {
    private final Store db;
    @Value("${app.survival.k-factor:32}") double k=32;
    @Value("${app.survival.rank-thresholds:1100,1300,1500,1700,1900}") int[] thresholds={1100,1300,1500,1700,1900};
    private static final String[] TIERS={"Đồng","Bạc","Vàng","Bạch Kim","Kim Cương","Cao Thủ"};
    public Progression(Store db) { this.db=db; }
    @jakarta.annotation.PostConstruct public void validateConfiguration() {
        require(k>0&&k<=128&&Double.isFinite(k),"K-factor phải trong (0,128]");
        require(thresholds.length==5,"Cần 5 ngưỡng cho 6 bậc Rank");
        for(int i=1;i<5;i++)require(thresholds[i]>thresholds[i-1],"Ngưỡng Rank phải tăng nghiêm ngặt");
    }
    public static int level(long exp) { return 1+(int)Math.sqrt(Math.max(0,exp)/100.0); }
    public String tier(int rating) { int n=0; for(int t:thresholds) if(rating>=t)n++; return TIERS[Math.min(n,5)]; }
    public ObjectNode get(String uid) {
        if(db.sql.queryForObject("SELECT COUNT(*) FROM progression WHERE user_id=?",Integer.class,uid)==0)
            db.sql.update("INSERT INTO progression(user_id) VALUES(?)",uid);
        var row=db.one("SELECT * FROM progression WHERE user_id=?",uid);
        long exp=((Number)row.get("exp")).longValue(); int rating=((Number)row.get("rating")).intValue(),l=level(exp);
        var p=db.obj().put("exp",exp).put("level",l).put("rating",rating).put("rank",tier(rating))
            .put("rankedGames",((Number)row.get("ranked_games")).intValue()).put("nextLevelExp",100L*l*l);
        var badges=p.putArray("badges"); if(l>=2)badges.add("Người học chăm chỉ");if(l>=5)badges.add("Bền bỉ");if(l>=10)badges.add("Chinh phục");
        p.put("avatarFrame",l>=10?"gold":l>=5?"silver":"basic"); return p;
    }
    public static double expected(int a,int b) { return 1.0/(1+Math.pow(10,(b-(double)a)/400)); }
    public static Map<String,Integer> elo(Map<String,Integer> ratings,Map<String,Integer> ranks,double k) {
        require(ratings.size()==5 && ratings.keySet().equals(ranks.keySet()),"Elo Survival cần đúng 5 người");
        var deltas=new HashMap<String,Integer>();
        for(String a:ratings.keySet()) {
            double sum=0;
            for(String b:ratings.keySet()) if(!a.equals(b)) {
                double score=ranks.get(a)<ranks.get(b)?1:ranks.get(a).equals(ranks.get(b))?.5:0;
                sum+=score-expected(ratings.get(a),ratings.get(b));
            }
            deltas.put(a,(int)Math.round(k/4*sum));
        }
        return deltas;
    }
    private void reward(String uid,String key,String kind,int exp,int before,int after) {
        if(db.sql.queryForObject("SELECT COUNT(*) FROM reward_events WHERE user_id=? AND event_key=?",Integer.class,uid,key)>0)return;
        get(uid);
        db.sql.update("INSERT INTO reward_events VALUES(?,?,?,?,?,?,?)",uid,key,kind,exp,before,after,db.now());
        db.sql.update("UPDATE progression SET exp=exp+?,rating=?,ranked_games=ranked_games+? WHERE user_id=?",exp,after,kind.equals("RANKED")?1:0,uid);
        db.event(uid,"progression_changed",get(uid));
    }
    public void settle(ObjectNode room) {
        if(!room.path("state").asText().equals("FINISHED"))return;
        String rid=room.path("id").asText(),mode=room.path("mode").asText("PRACTICE");
        if(db.sql.queryForObject("SELECT COUNT(*) FROM match_results WHERE room_id=?",Integer.class,rid)>0)return;
        List<String> ids=new ArrayList<>(); for(var id:room.path("participants"))ids.add(id.asText());
        require(ids.size()>=2 && (mode.equals("PRACTICE")||ids.size()==5),"Kết quả không đủ người chơi");
        Map<String,Integer> ranks=new HashMap<>(),ratings=new HashMap<>(),deltas=Map.of();
        // Each eliminated cohort shares a rank. Explicit forfeits are below players who lasted longer.
        Map<String,Integer> stage=new HashMap<>();
        for(String id:ids) {
            int last=0;
            for(int i=0;i<room.path("history").size();i++) {
                var h=room.path("history").get(i); if(h.has("type"))continue;
                for(var r:h.path("ranks")) if(r.path("userId").asText().equals(id))last=i+1;
            }
            for(var p:room.path("players")) if(p.path("id").asText().equals(id) && p.has("eliminatedStage"))last=p.path("eliminatedStage").asInt();
            stage.put(id,last);
            ratings.put(id,room.path("initialRatings").path(id).asInt(get(id).path("rating").asInt()));
        }
        String winner=room.path("winnerId").asText();stage.put(winner,Integer.MAX_VALUE);
        for(String id:ids)ranks.put(id,1+(int)ids.stream().filter(other->stage.get(other)>stage.get(id)).count());
        if(mode.equals("RANKED"))deltas=elo(ratings,ranks,k);
        var results=room.putArray("results");
        for(String uid:ids) {
            int exp=0;
            if(!mode.equals("PRACTICE")) {
                int rank=ranks.get(uid),tie=(int)ids.stream().filter(id->ranks.get(id)==rank).count();
                int lowestPlacement=rank+tie-1;
                exp=120-20*lowestPlacement;
            }
            int before=ratings.get(uid),after=before+deltas.getOrDefault(uid,0);
            if(!mode.equals("PRACTICE"))reward(uid,"match:"+rid,mode,exp,before,after);
            db.sql.update("INSERT INTO match_results VALUES(?,?,?,?,?,?,?,?)",rid,uid,mode,ranks.get(uid),exp,before,after,db.now());
            results.add(db.obj().put("userId",uid).put("placement",ranks.get(uid)).put("exp",exp).put("ratingBefore",before).put("ratingAfter",after).put("rank",tier(after)));
        }
    }
    public Object leaderboard() {
        var rows=db.sql.queryForList("SELECT p.user_id,u.display_name,p.rating,p.exp,p.ranked_games FROM progression p JOIN users u ON u.id=p.user_id WHERE u.role='CODER' AND u.enabled=TRUE AND p.ranked_games>0 ORDER BY p.rating DESC,u.username LIMIT 200");
        for(var r:rows){r.put("rank",tier(((Number)r.get("rating")).intValue()));r.put("level",level(((Number)r.get("exp")).longValue()));}return rows;
    }
    public Object history(String uid) { return db.sql.queryForList("SELECT * FROM match_results WHERE user_id=? ORDER BY finished_at DESC LIMIT 100",uid); }
    public Object rewards(String uid) { return db.sql.queryForList("SELECT * FROM reward_events WHERE user_id=? ORDER BY created_at DESC LIMIT 100",uid); }
}
