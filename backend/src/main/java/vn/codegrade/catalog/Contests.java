package vn.codegrade.catalog;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import vn.codegrade.db.Store;
import vn.codegrade.auth.Identity;
import vn.codegrade.auth.Identity.User;
import java.util.*;
import static vn.codegrade.db.Store.require;

@Service
public class Contests {
    private final Store db; private final Catalog catalog; private final Identity identity;
    public Contests(Store db,Catalog catalog,Identity identity) { this.db=db; this.catalog=catalog; this.identity=identity; }
    public Object command(User u,String type,JsonNode p) {
        if(type.equals("CONTEST_LIST")) return db.sql.queryForList("SELECT document FROM contests").stream().map(r->projection(u,(ObjectNode)db.read((String)r.get("document")))).toList();
        if(type.equals("CONTEST_CREATE")) {
            require(u.author(),"Chỉ người tạo đề/admin tạo contest");
            require(!p.path("title").asText().isBlank() && p.path("title").asText().length()<=200,"Tên contest cần 1–200 ký tự");
            require(p.path("startsAt").isIntegralNumber() && p.path("endsAt").isIntegralNumber(),"Thời gian contest phải là timestamp nguyên");
            require(p.path("startsAt").asLong()>=db.now()-1000 && p.path("endsAt").asLong()>p.path("startsAt").asLong(),"Thời gian contest không hợp lệ");
            require(p.path("problemIds").isArray() && !p.path("problemIds").isEmpty() && p.path("problemIds").size()<=100,"Chọn 1–100 đề");
            Set<String> unique=new HashSet<>();
            for(var pid:p.path("problemIds")) require(pid.isTextual() && unique.add(pid.asText()),"Danh sách đề không được trùng");
            for(var pid:p.path("problemIds")) {require(catalog.canEdit(u,pid.asText())||catalog.document(pid.asText()).path("general").path("status").asText().equals("ready"),"Problem access denied");QuestionRules.executable(catalog.document(pid.asText()));}
            ObjectNode c=(ObjectNode)p.deepCopy(); String id=db.id();
            c.put("id",id).put("authorId",u.id()).put("settled",false); c.putArray("participants");c.putArray("pending");c.put("approvalRequired",p.path("approvalRequired").asBoolean());
            db.sql.update("INSERT INTO contests(id,author_id,document) VALUES(?,?,?)",id,u.id(),db.write(c));
            db.event(null,"contest_changed",Map.of("id",id)); return c;
        }
        require(Set.of("CONTEST_GET","CONTEST_JOIN","CONTEST_APPROVE").contains(type),"Lệnh contest không hợp lệ");
        ObjectNode c=(ObjectNode)db.read((String)db.one("SELECT document FROM contests WHERE id=?",p.path("contestId").asText()).get("document"));
        if(type.equals("CONTEST_JOIN")) {
            require(u.coder(),"Chỉ Coder đăng ký thi xếp hạng");
            require(db.now()<c.path("endsAt").asLong(),"Contest đã kết thúc");
            boolean joined=false; for(var uid:c.path("participants")) if(uid.asText().equals(u.id())) joined=true;
            if(!joined){String key=c.path("approvalRequired").asBoolean()?"pending":"participants";boolean exists=false;for(var x:c.path(key))if(x.asText().equals(u.id()))exists=true;if(!exists)c.withArray(key).add(u.id());}
            db.sql.update("UPDATE contests SET document=? WHERE id=?",db.write(c),c.path("id").asText());
            db.event(null,"contest_changed",Map.of("id",c.path("id").asText()));
        }
        if(type.equals("CONTEST_APPROVE")){require(u.admin()||c.path("authorId").asText().equals(u.id()),"Organizer only");String uid=p.path("userId").asText();boolean pending=false;for(var x:c.path("pending"))if(x.asText().equals(uid))pending=true;require(pending,"Not pending");var remaining=db.json.createArrayNode();for(var x:c.path("pending"))if(!x.asText().equals(uid))remaining.add(x);c.set("pending",remaining);if(p.path("approve").asBoolean())c.withArray("participants").add(uid);db.sql.update("UPDATE contests SET document=? WHERE id=?",db.write(c),c.path("id").asText());db.event(uid,"contest_changed",Map.of("id",c.path("id").asText()));}
        var result=db.obj(); result.set("contest",projection(u,c)); result.set("standings",c.path("settled").asBoolean()?c.path("finalStandings"):db.tree(standings(c))); return result;
    }
    private ObjectNode projection(User u,ObjectNode c){ObjectNode out=c.deepCopy();out.put("problemCount",c.path("problemIds").size());boolean owner=u.admin()||c.path("authorId").asText().equals(u.id());boolean joined=false;for(var id:c.path("participants"))if(id.asText().equals(u.id()))joined=true;
      if(!owner && (!joined||db.now()<c.path("startsAt").asLong()||db.now()>c.path("endsAt").asLong()))out.putArray("problemIds");
      var titles=db.obj();for(var pid:out.path("problemIds"))titles.put(pid.asText(),catalog.document(pid.asText()).path("general").path("questionName").asText());out.set("problemTitles",titles);
      if(!owner){var pending=db.json.createArrayNode();for(var id:c.path("pending"))if(id.asText().equals(u.id()))pending.add(id);out.set("pending",pending);}return out;}
    public List<Map<String,Object>> standings(JsonNode c) {
        var ranks=new ArrayList<Map<String,Object>>();
        for(var uid:c.path("participants")) {
            User user=identity.historicalUser(uid.asText());
            if(!user.coder()) continue;
            double total=0; int ac=0; long penalty=0;
            for(var pid:c.path("problemIds")) {
                var submissions=db.sql.queryForList("SELECT score,status,received_at FROM submissions WHERE contest_id=? AND user_id=? AND problem_id=? AND mode='OFFICIAL' AND status NOT IN ('QUEUED','RUNNING','SE') ORDER BY received_at,admission_order",
                    c.path("id").asText(),uid.asText(),pid.asText());
                double best=0; int wrong=0;
                for(var s:submissions) {
                    best=Math.max(best,((Number)s.get("score")).doubleValue());
                    if(s.get("status").equals("AC")) { ac++; penalty+=(((Number)s.get("received_at")).longValue()-c.path("startsAt").asLong())/1000+wrong*600L; break; }
                    wrong++;
                }
                total+=best;
            }
            var row=new LinkedHashMap<String,Object>(); row.put("userId",uid.asText()); row.put("name",user.displayName()); row.put("score",total); row.put("ac",ac); row.put("penalty",penalty); ranks.add(row);
        }
        ranks.sort(Comparator.<Map<String,Object>>comparingDouble(x->((Number)x.get("score")).doubleValue()).reversed().thenComparingLong(x->((Number)x.get("penalty")).longValue()));
        return ranks;
    }
    @Scheduled(fixedDelay=2000)
    public void settle() {
        db.atomic(()->{
            for(var row:db.sql.queryForList("SELECT document FROM contests")) {
                ObjectNode c=(ObjectNode)db.read((String)row.get("document"));
                if(c.path("settled").asBoolean() || db.now()<=c.path("endsAt").asLong()) continue;
                if(db.sql.queryForObject("SELECT COUNT(*) FROM submissions WHERE contest_id=? AND status IN ('QUEUED','RUNNING')",Integer.class,c.path("id").asText())>0) continue;
                var ranks=standings(c); Map<String,Integer> ratings=new HashMap<>();
                for(var r:ranks) ratings.put((String)r.get("userId"),identity.historicalUser((String)r.get("userId")).elo());
                if(c.path("rated").asBoolean() && ranks.size()>1) {
                    for(var a:ranks) {
                        String id=(String)a.get("userId"); double delta=0;
                        for(var b:ranks) if(a!=b) {
                            String other=(String)b.get("userId");
                            double as=((Number)a.get("score")).doubleValue(),bs=((Number)b.get("score")).doubleValue();
                            long ap=((Number)a.get("penalty")).longValue(),bp=((Number)b.get("penalty")).longValue();
                            double actual=as==bs&&ap==bp?0.5:as>bs||(as==bs&&ap<bp)?1:0;
                            delta+=actual-1/(1+Math.pow(10,(ratings.get(other)-ratings.get(id))/400.0));
                        }
                        db.sql.update("UPDATE users SET elo=GREATEST(100,elo+?) WHERE id=? AND role='CODER'",(int)Math.round(32*delta/(ranks.size()-1)),id);
                    }
                }
                c.put("settled",true); c.set("finalStandings",db.tree(ranks));
                db.sql.update("UPDATE contests SET document=? WHERE id=?",db.write(c),c.path("id").asText());
                db.event(null,"contest_changed",Map.of("id",c.path("id").asText()));
                db.event(null,"leaderboard_changed",Map.of("metric","elo"));
            }
            return null;
        });
    }
}
