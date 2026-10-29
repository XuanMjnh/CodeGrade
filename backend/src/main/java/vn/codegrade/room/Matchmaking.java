package vn.codegrade.room;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import vn.codegrade.auth.Identity;
import vn.codegrade.auth.Identity.User;
import vn.codegrade.db.Store;
import java.util.*;
import static vn.codegrade.db.Store.require;

/** Durable queue; the shared DB lock serializes selection across server instances. */
@Service
public class Matchmaking {
    private final Store db; private final Survival survival; private final Progression progression; private final Identity identity;
    @Value("${app.survival.rating-ranges:150,250,350,400}") int[] ranges={150,250,350,400};
    @Value("${app.survival.accept-seconds:20}") int acceptSeconds=20;
    public Matchmaking(Store db,Survival survival,Progression progression,Identity identity) {
        this.db=db;this.survival=survival;this.progression=progression;this.identity=identity;
    }
    @jakarta.annotation.PostConstruct public void validateConfiguration() {
        require(ranges.length==4,"Cần 4 phạm vi rating cho các mốc 0/10/20/30 giây");
        for(int i=0;i<4;i++)require(ranges[i]>=0&&ranges[i]<=400&&(i==0||ranges[i]>=ranges[i-1]),"Phạm vi rating tăng dần, tối đa 400");
        require(acceptSeconds>=5&&acceptSeconds<=60,"Thời gian nhận trận 5–60 giây");
    }
    public void available(String uid,String exceptRoom) {
        require(db.sql.queryForObject("SELECT COUNT(*) FROM match_queue WHERE user_id=? AND state IN ('WAITING','MATCH_FOUND','ACCEPTED','STARTED')",Integer.class,uid)==0,"Bạn đang trong hàng đợi hoặc trận khác");
        for(var row:db.sql.queryForList("SELECT id,document FROM rooms WHERE state NOT IN ('FINISHED','CLOSED','UNRESOLVED')")) {
            if(row.get("id").equals(exceptRoom))continue;
            for(var p:db.read((String)row.get("document")).path("players"))
                require(!p.path("id").asText().equals(uid)||!p.path("status").asText().equals("ALIVE"),"Bạn đang ở phòng khác");
        }
    }
    public Object command(User u,String type,JsonNode p) {
        require(u.coder(),"Chỉ CODER được ghép trận");
        if(type.equals("MATCH_QUEUE_JOIN")) {
            String mode=p.path("mode").asText();require(Set.of("NORMAL","RANKED").contains(mode),"Chọn NORMAL hoặc RANKED");
            available(u.id(),"");
            var stats=progression.get(u.id());
            db.sql.update("DELETE FROM match_queue WHERE user_id=?",u.id());
            db.sql.update("INSERT INTO match_queue(user_id,mode,state,joined_at,last_seen,rating,player_level) VALUES(?,?,?,?,?,?,?)",u.id(),mode,"WAITING",db.now(),db.now(),stats.path("rating").asInt(),stats.path("level").asInt());
            pair();return snapshot(u.id());
        }
        if(type.equals("MATCH_QUEUE_STATUS")||type.equals("MATCH_SNAPSHOT")) {
            db.sql.update("UPDATE match_queue SET last_seen=? WHERE user_id=?",db.now(),u.id());return snapshot(u.id());
        }
        var rows=db.sql.queryForList("SELECT * FROM match_queue WHERE user_id=?",u.id());
        require(!rows.isEmpty(),"Bạn không ở hàng đợi");var entry=rows.getFirst();
        String state=(String)entry.get("state");
        if(type.equals("MATCH_QUEUE_CANCEL")||type.equals("MATCH_DECLINE")) {
            if(entry.get("room_id")!=null && Set.of("MATCH_FOUND","ACCEPTED","STARTED").contains(state)) {
                var room=survival.load((String)entry.get("room_id"));
                require(Set.of("LOBBY","COUNTDOWN").contains(room.path("state").asText()),"Trận đã bắt đầu; dùng bỏ cuộc trong phòng");
                cancel(room,Set.of(u.id()),"CANCELLED");
            } else db.sql.update("UPDATE match_queue SET state='CANCELLED' WHERE user_id=?",u.id());
            pair();return snapshot(u.id());
        }
        if(type.equals("MATCH_ACCEPT")) {
            require(Set.of("MATCH_FOUND","ACCEPTED").contains(state),"Không có trận chờ xác nhận");
            var r=survival.load((String)entry.get("room_id"));
            require(p.path("roomId").asText().equals(r.path("id").asText()),"Mã trận đã cũ");
            require(r.path("acceptDeadline").asLong()>=db.now(),"Hết thời gian nhận trận");
            db.sql.update("UPDATE match_queue SET state='ACCEPTED',last_seen=? WHERE user_id=?",db.now(),u.id());
            int accepted=db.sql.queryForObject("SELECT COUNT(*) FROM match_queue WHERE room_id=? AND state='ACCEPTED' AND last_seen>=?",Integer.class,r.path("id").asText(),db.now()-30_000);
            if(accepted==5) {
                survival.begin(r);
                db.sql.update("UPDATE match_queue SET state='STARTED' WHERE room_id=?",r.path("id").asText());
            }
            return snapshot(u.id());
        }
        throw new Store.Fault("TYPE","Lệnh ghép trận không hợp lệ");
    }
    public ObjectNode snapshot(String uid) {
        var rows=db.sql.queryForList("SELECT * FROM match_queue WHERE user_id=?",uid);
        if(rows.isEmpty())return db.obj().put("state","IDLE");
        var e=rows.getFirst();String state=(String)e.get("state"),mode=(String)e.get("mode");long waited=Math.max(0,db.now()-((Number)e.get("joined_at")).longValue());
        var out=db.obj().put("state",state).put("mode",mode).put("joinedAt",((Number)e.get("joined_at")).longValue()).put("waitSeconds",waited/1000)
            .put("target",5).put("ratingRange",range(waited));
        out.put("waiting",db.sql.queryForObject("SELECT COUNT(*) FROM match_queue WHERE mode=? AND state='WAITING' AND last_seen>=?",Integer.class,mode,db.now()-90_000));
        if(e.get("room_id")!=null && Set.of("MATCH_FOUND","ACCEPTED","STARTED").contains(state)) {
            String id=(String)e.get("room_id");var room=survival.load(id);
            out.put("roomId",id).put("acceptDeadline",room.path("acceptDeadline").asLong());
            out.put("accepted",db.sql.queryForObject("SELECT COUNT(*) FROM match_queue WHERE room_id=? AND state IN ('ACCEPTED','STARTED')",Integer.class,id));
            out.set("room",survival.publicState(room));
        }
        return out;
    }
    private int range(long waited) { return Math.min(400,ranges[(int)Math.min(3,waited/10_000)]); }
    public void pair() {
        for(String mode:List.of("NORMAL","RANKED")) {
            while(true) {
                var waiting=db.sql.queryForList("SELECT q.* FROM match_queue q JOIN users u ON u.id=q.user_id WHERE q.mode=? AND q.state='WAITING' AND q.last_seen>=? AND u.role='CODER' AND u.enabled=TRUE ORDER BY q.joined_at,q.user_id",mode,db.now()-90_000);
                if(waiting.size()<5)break;
                List<Map<String,Object>> group=null;
                // Try anchors FIFO, so an isolated rating does not block other valid groups.
                for(var anchor:waiting) {
                    long waited=db.now()-((Number)anchor.get("joined_at")).longValue();
                    List<Map<String,Object>> candidates=new ArrayList<>(waiting);
                    if(mode.equals("NORMAL")) {
                        if(waited<10_000) candidates.sort(Comparator.comparingInt((Map<String,Object> e)->Math.abs(((Number)e.get("player_level")).intValue()-((Number)anchor.get("player_level")).intValue())).thenComparingLong(e->((Number)e.get("joined_at")).longValue()));
                        group=new ArrayList<>(candidates.subList(0,5));break;
                    }
                    candidates.sort(Comparator.comparingInt(e->((Number)e.get("rating")).intValue()));
                    for(int i=0;i+5<=candidates.size();i++) {
                        var slice=candidates.subList(i,i+5);
                        if(!slice.contains(anchor))continue;
                        int spread=((Number)slice.getLast().get("rating")).intValue()-((Number)slice.getFirst().get("rating")).intValue();
                        if(spread<=range(waited)) {
                            // Within a valid rating window select the oldest five, not the lowest five.
                            int low=((Number)slice.getFirst().get("rating")).intValue();
                            var window=waiting.stream().filter(e->{int rating=((Number)e.get("rating")).intValue();return rating>=low&&rating<=low+range(waited);}).limit(5).toList();
                            group=new ArrayList<>(window);break;
                        }
                    }
                    if(group!=null)break;
                }
                if(group==null)break;
                List<User> users=new ArrayList<>();for(var e:group)users.add(identity.user((String)e.get("user_id")));
                var room=survival.createMatched(mode,users,db.now()+acceptSeconds*1000L);
                for(var e:group) {
                    db.sql.update("UPDATE match_queue SET state='MATCH_FOUND',room_id=? WHERE user_id=? AND state='WAITING'",room.path("id").asText(),e.get("user_id"));
                    db.event((String)e.get("user_id"),"MATCH_FOUND",snapshot((String)e.get("user_id")));
                }
            }
        }
    }
    private void cancel(ObjectNode r,Set<String> excluded,String reason) {
        String rid=r.path("id").asText();
        for(var e:db.sql.queryForList("SELECT user_id,last_seen FROM match_queue WHERE room_id=?",rid)) {
            String uid=(String)e.get("user_id");
            String state=excluded.contains(uid)||((Number)e.get("last_seen")).longValue()<db.now()-90_000?reason:"WAITING";
            db.sql.update("UPDATE match_queue SET state=?,room_id=NULL WHERE user_id=?",state,uid);
            db.event(uid,"match_cancelled",Map.of("roomId",rid,"state",state));
        }
        survival.cancelMatched(r);
    }
    @Scheduled(fixedDelay=500)
    public void tick() {
        db.atomic(()->{
            db.sql.update("UPDATE match_queue SET state='EXPIRED' WHERE state='WAITING' AND last_seen<?",db.now()-90_000);
            for(var row:db.sql.queryForList("SELECT document FROM rooms WHERE state IN ('LOBBY','COUNTDOWN')")) {
                ObjectNode r=(ObjectNode)db.read((String)row.get("document"));if(r.path("mode").asText("PRACTICE").equals("PRACTICE"))continue;
                if(r.path("state").asText().equals("LOBBY") && db.now()>r.path("acceptDeadline").asLong()) {
                    Set<String> expired=new HashSet<>();for(var e:db.sql.queryForList("SELECT user_id FROM match_queue WHERE room_id=? AND state<>'ACCEPTED'",r.path("id").asText()))expired.add((String)e.get("user_id"));
                    cancel(r,expired,"EXPIRED");
                }
            }
            pair();return null;
        });
    }
}
