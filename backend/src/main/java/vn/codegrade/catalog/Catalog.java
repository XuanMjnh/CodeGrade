package vn.codegrade.catalog;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Service;
import vn.codegrade.db.Store;
import vn.codegrade.auth.Identity.User;
import vn.codegrade.room.Progression;
import static vn.codegrade.db.Store.require;
import java.util.*;

@Service
public class Catalog {
    private final Store db;
    private final Progression progression;
    public Catalog(Store db,Progression progression) { this.db=db; this.progression=progression; }
    public List<Map<String,Object>> categories() { return db.sql.queryForList("SELECT * FROM categories ORDER BY name"); }
    public Object categorySave(User u,JsonNode p) {
        require(u.author(),"Cần role Admin hoặc Người tạo đề");
        String id=p.path("id").asText(db.id()), name=p.path("name").asText().trim(),desc=p.path("description").asText();
        require(!name.isBlank() && name.length()<=100 && desc.length()<=1000,"Tên category 1–100 ký tự, mô tả ≤1000 ký tự");
        if(db.sql.queryForObject("SELECT COUNT(*) FROM categories WHERE id=?",Integer.class,id)>0)
            db.sql.update("UPDATE categories SET name=?,description=? WHERE id=?",name,desc,id);
        else db.sql.update("INSERT INTO categories(id,name,description) VALUES(?,?,?)",id,name,desc);
        db.event(null,"catalog_changed",Map.of("categoryId",id));
        return Map.of("id",id);
    }
    public static String publicId(long number) { return String.format(Locale.ROOT,"CG-%04d",number); }
    private String problemCode(String id) { return publicId(((Number)db.one("SELECT number FROM problem_numbers WHERE problem_id=?",id).get("number")).longValue()); }
    public JsonNode document(String id) { ObjectNode q=(ObjectNode)db.read((String)db.one("SELECT document FROM problems WHERE id=?",id).get("document"));q.put("publicId",problemCode(id));return q; }
    public boolean canEdit(User u,String id) { return u.admin() || (u.author() && db.one("SELECT author_id FROM problems WHERE id=?",id).get("author_id").equals(u.id())); }
    public Object list(User u,JsonNode p) {
        var result=new ArrayList<Object>();
        Set<String> solved=new HashSet<>(db.sql.queryForList("SELECT problem_id FROM solved WHERE user_id=?",String.class,u.id()));
        Set<String> bookmarks=new HashSet<>(db.sql.queryForList("SELECT problem_id FROM bookmarks WHERE user_id=?",String.class,u.id()));
        String search=p.path("search").asText().toLowerCase(Locale.ROOT);
        for(var row:db.sql.queryForList("SELECT p.id,p.author_id,p.title,p.difficulty,p.status,p.survival,p.version,p.category_id,c.name AS category,n.number AS public_number FROM problems p JOIN categories c ON c.id=p.category_id JOIN problem_numbers n ON n.problem_id=p.id ORDER BY p.created_at DESC")) {
            if(!row.get("status").equals("ready") && !u.admin() && !row.get("author_id").equals(u.id())) continue;
            String code=publicId(((Number)row.remove("public_number")).longValue());row.put("publicId",code);
            if(!row.get("title").toString().toLowerCase(Locale.ROOT).contains(search) && !code.toLowerCase(Locale.ROOT).contains(search)) continue;
            if(p.path("difficulty").asInt()>0 && ((Number)row.get("difficulty")).intValue()!=p.path("difficulty").asInt()) continue;
            if(!p.path("categoryId").asText().isBlank() && !row.get("category_id").equals(p.path("categoryId").asText())) continue;
            row.put("starred",bookmarks.contains(row.get("id"))); row.put("solved",solved.contains(row.get("id"))); result.add(row);
        }
        return result;
    }
    public Object get(User u,String id,boolean edit) {
        JsonNode q=document(id);
        if(edit) { require(canEdit(u,id),"Không có quyền sửa đề"); return q; }
        boolean contestAccess=false;
        for(var row:db.sql.queryForList("SELECT document FROM contests")){var c=db.read((String)row.get("document"));if(db.now()<c.path("startsAt").asLong()||db.now()>c.path("endsAt").asLong())continue;boolean joined=false;for(var uid:c.path("participants"))if(uid.asText().equals(u.id()))joined=true;if(joined)for(var pid:c.path("problemIds"))if(pid.asText().equals(id))contestAccess=true;}
        require(q.path("general").path("status").asText().equals("ready") || canEdit(u,id)||contestAccess,"Đề chưa công bố");
        return publicQuestion(q);
    }
    public ObjectNode publicQuestion(JsonNode q) {
        ObjectNode safe=db.obj();
        for(String k:List.of("id","publicId","difficulty","languages","version","answerboxlines","precheck","hidecheck","giveupallowed","displayfeedback")) safe.set(k,q.path(k));
        safe.set("general",db.obj().put("questionName",q.path("general").path("questionName").asText()).put("questionText",q.path("general").path("questionText").asText()));
        safe.put("preloadAnswer",q.path("answer").path("preloadAnswer").asText());
        ArrayNode examples=safe.putArray("examples");
        for(var t:QuestionRules.active(q)) if(t.path("useasexample").asBoolean()) {
            ObjectNode e=db.obj(); for(String k:List.of("testcode","stdin","expected")) e.set(k,t.path(k)); examples.add(e);
        }
        return safe;
    }
    public Object save(User u,JsonNode payload) {
        require(u.author(),"Chỉ người tạo đề/admin được lưu câu hỏi");
        ObjectNode q=(ObjectNode)payload.deepCopy();
        // Validation provenance is server-owned. Import/clients cannot assert a sample was AC.
        q.remove(List.of("publicId","validatedVersion","sampleValidation","validationNotice"));
        QuestionRules.validate(q);
        String category=q.path("general").path("categoryId").asText();
        db.one("SELECT id FROM categories WHERE id=?",category);
        String id=q.path("id").asText(); int version=1;
        if(!id.isBlank()) {
            require(canEdit(u,id),"Không có quyền sửa đề");
            version=((Number)db.one("SELECT version FROM problems WHERE id=?",id).get("version")).intValue()+1;
            require(q.path("version").asInt()==version-1,"Đề đã thay đổi ở tab khác; tải lại trước khi lưu");
            // Running matches keep a stable problem bank.
            for(var room:db.sql.queryForList("SELECT document FROM rooms WHERE state NOT IN ('LOBBY','FINISHED','CLOSED','UNRESOLVED')")) {
                var document=db.read((String)room.get("document"));
                for(var used:document.path("used"))require(!used.asText().equals(id),"Đề đang dùng trong trận; đợi kết thúc");
                for(var frozen:document.path("bank"))require(!frozen.path("id").asText().equals(id),"Đề nằm trong bank đã khóa; đợi kết thúc trận");
            }
            for(var row:db.sql.queryForList("SELECT document FROM contests")) {
                var contest=db.read((String)row.get("document"));
                if(db.now()>=contest.path("startsAt").asLong() && db.now()<=contest.path("endsAt").asLong())
                    for(var pid:contest.path("problemIds"))
                        require(!pid.asText().equals(id),"Đề đang dùng trong contest; đợi kết thúc");
            }
        } else id=db.id();
        q.put("id",id); q.put("version",version);
        String status=q.path("general").path("status").asText();
        if(version==1) db.sql.update("INSERT INTO problems(id,author_id,category_id,title,difficulty,status,survival,version,document,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
            id,u.id(),category,q.path("general").path("questionName").asText(),q.path("difficulty").asInt(),status,q.path("survivalEligible").asBoolean(),version,db.write(q),db.now());
        else db.sql.update("UPDATE problems SET category_id=?,title=?,difficulty=?,status=?,survival=?,version=?,document=? WHERE id=?",
            category,q.path("general").path("questionName").asText(),q.path("difficulty").asInt(),status,q.path("survivalEligible").asBoolean(),version,db.write(q),id);
        if(version==1)db.sql.update("INSERT INTO problem_numbers(problem_id) VALUES(?)",id);
        q.put("publicId",problemCode(id));
        db.audit(u.id(),"QUESTION_SAVED",id,Map.of("version",version,"status",status));
        db.event(null,"catalog_changed",Map.of("problemId",id));
        return q;
    }
    public Object leaderboard(String metric) {
        String field=switch(metric) {
            case "ac" -> "ac";
            case "exp" -> "exp";
            case "rank" -> "rating";
            case "normal_games" -> "normal_games";
            case "ranked_games" -> "ranked_games";
            default -> "elo";
        };
        // Aggregate each source before joining so solved problems cannot multiply match counts.
        // Contest Elo belongs to users; Survival rank points and EXP belong to progression.
        var rows=db.sql.queryForList("""
            SELECT u.id,u.username,u.display_name,u.elo,
                   COALESCE(s.ac,0) AS ac,COALESCE(p.exp,0) AS exp,
                   COALESCE(p.rating,1000) AS rating,
                   COALESCE(m.normal_games,0) AS normal_games,
                   COALESCE(m.ranked_games,0) AS ranked_games
            FROM users u
            LEFT JOIN (SELECT user_id,COUNT(*) AS ac FROM solved GROUP BY user_id) s ON s.user_id=u.id
            LEFT JOIN progression p ON p.user_id=u.id
            LEFT JOIN (
                SELECT user_id,
                       SUM(CASE WHEN mode='NORMAL' THEN 1 ELSE 0 END) AS normal_games,
                       SUM(CASE WHEN mode='RANKED' THEN 1 ELSE 0 END) AS ranked_games
                FROM match_results WHERE mode IN ('NORMAL','RANKED') GROUP BY user_id
            ) m ON m.user_id=u.id
            WHERE u.role='CODER' AND u.enabled=TRUE
            """+" ORDER BY "+field+" DESC,u.username LIMIT 200");
        for(var row:rows) {
            row.put("rank",progression.tier(((Number)row.get("rating")).intValue()));
            row.put("level",Progression.level(((Number)row.get("exp")).longValue()));
        }
        return rows;
    }
}
