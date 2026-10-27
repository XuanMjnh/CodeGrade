package vn.codegrade.protocol;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Service;
import vn.codegrade.db.Store;
import vn.codegrade.auth.Identity;
import vn.codegrade.auth.Identity.User;
import vn.codegrade.catalog.*;
import vn.codegrade.room.Survival;
import vn.codegrade.judge.Submissions;
import java.util.*;
import static vn.codegrade.db.Store.require;

@Service
public class Commands {
    private final Community community;
    private final Store db; private final Identity identity; private final Catalog catalog;
    private final Survival rooms; private final Submissions submissions; private final Contests contests;
    private static final Set<String> READ=Set.of("COMMENTS","ANNOUNCEMENTS","ME","CATEGORIES","PROBLEMS","QUESTION_GET","QUESTION_EDIT","LEADERBOARD","PROBLEM_RANKING","SUBMISSIONS","SUBMISSIONS_PAGE","SUBMISSION_GET","ROOM_LIST","ROOM_SNAPSHOT","CONTEST_LIST","CONTEST_GET","USERS","SYNC","DRAFT_GET","AUDIT");
    public Commands(Store db,Identity identity,Catalog catalog,Survival rooms,Submissions submissions,Contests contests,Community community) {
        this.community=community;
        this.db=db; this.identity=identity; this.catalog=catalog; this.rooms=rooms; this.submissions=submissions; this.contests=contests;
    }
    public Object execute(User user,String type,JsonNode p,String requestId) {
        return db.atomic(()->{
            User u=identity.user(user.id());
            String fingerprint=Store.hash(type+canonical(p));
            boolean mutate=!READ.contains(type);
            if(mutate) {
                var previous=db.sql.queryForList("SELECT fingerprint,response FROM commands WHERE user_id=? AND request_id=?",u.id(),requestId);
                if(!previous.isEmpty()) {
                    require(previous.getFirst().get("fingerprint").equals(fingerprint),"Request ID đã dùng cho nội dung khác");
                    return db.read((String)previous.getFirst().get("response"));
                }
            }
            Object result=switch(type) {
                case "PROFILE_SAVE","BOOKMARK_SET","COMMENTS","COMMENT_ADD","ANNOUNCEMENTS","ANNOUNCEMENT_ADD" -> community.command(u,type,p);
                case "RECEIPT_GET" -> vn.codegrade.judge.ReceiptLedger.get(db,u,p.path("id").asText());
                case "ME" -> u;
                case "PASSWORD_CHANGE" -> identity.changePassword(u,p);
                case "CATEGORIES" -> catalog.categories();
                case "CATEGORY_SAVE" -> catalog.categorySave(u,p);
                case "PROBLEMS" -> catalog.list(u,p);
                case "QUESTION_GET" -> catalog.get(u,p.path("id").asText(),false);
                case "QUESTION_EDIT" -> catalog.get(u,p.path("id").asText(),true);
                case "QUESTION_SAVE" -> saveQuestion(u,p,requestId);
                case "QUESTION_VALIDATE" -> {
                    var q=catalog.document(p.path("id").asText());
                    require(catalog.canEdit(u,p.path("id").asText()),"Không có quyền chạy đáp án mẫu");
                    require(!q.path("answer").path("sampleAnswer").asText().isBlank(),"Chưa có đáp án mẫu");
                    yield submissions.accept(u,samplePayload(q),requestId,"VALIDATE");
                }
                case "LEADERBOARD" -> catalog.leaderboard(p.path("metric").asText());
                case "PROBLEM_RANKING" -> submissions.problemRanking(u,p.path("problemId").asText());
                case "SUBMIT" -> submissions.accept(u,p,requestId,"OFFICIAL");
                case "PRECHECK" -> submissions.accept(u,p,requestId,"PRECHECK");
                case "RUN_EXAMPLES" -> submissions.accept(u,p,requestId,"EXAMPLES");
                case "SUBMISSIONS" -> submissions.list(u);
                case "SUBMISSIONS_PAGE" -> submissions.page(u,p);
                case "SUBMISSION_GET" -> submissions.detail(u,p.path("id").asText());
                case "DRAFT_SAVE" -> saveDraft(u,p);
                case "DRAFT_GET" -> db.sql.queryForList("SELECT language,source_code,updated_at FROM drafts WHERE user_id=? AND problem_id=?",u.id(),p.path("problemId").asText());
                case "USERS","USER_SET" -> identity.admin(u,type,p);
                case "AUDIT" -> { require(u.admin(),"Cần quyền admin"); yield db.sql.queryForList("SELECT * FROM audit ORDER BY id DESC LIMIT 100"); }
                case "SYNC" -> sync(u);
                default -> {
                    if(type.startsWith("ROOM_")) yield rooms.command(u,type,p);
                    if(type.startsWith("CONTEST_")) yield contests.command(u,type,p);
                    throw new Store.Fault("TYPE","Message type không được hỗ trợ");
                }
            };
            if(mutate) db.sql.update("INSERT INTO commands(user_id,request_id,fingerprint,response,created_at) VALUES(?,?,?,?,?)",u.id(),requestId,fingerprint,db.write(result),db.now());
            return result;
        });
    }
    private Object saveQuestion(User u,JsonNode p,String requestId) {
        ObjectNode saved=(ObjectNode)catalog.save(u,p);
        if(saved.path("answer").path("validateOnSave").asBoolean() && !saved.path("answer").path("sampleAnswer").asText().isBlank()) {
            try {
                QuestionRules.executable(saved);
                saved.set("sampleValidation",db.tree(submissions.accept(u,samplePayload(saved),Store.hash(requestId)+":sample","VALIDATE")));
            } catch(Store.Fault e) { saved.put("validationNotice",e.getMessage()); }
        }
        return saved;
    }
    private ObjectNode samplePayload(JsonNode q) {
        return db.obj().put("problemId",q.path("id").asText()).put("language",q.path("answer").path("language").asText(q.path("languages").get(0).asText())).put("source",q.path("answer").path("sampleAnswer").asText());
    }
    private Object saveDraft(User u,JsonNode p) {
        String pid=p.path("problemId").asText(),source=p.path("source").asText(),lang=p.path("language").asText();
        catalog.get(u,pid,false);
        require(source.length()<=65536 && QuestionRules.LANGUAGES.contains(lang),"Draft không hợp lệ");
        db.sql.update("DELETE FROM drafts WHERE user_id=? AND problem_id=?",u.id(),pid);
        db.sql.update("INSERT INTO drafts(user_id,problem_id,language,source_code,updated_at) VALUES(?,?,?,?,?)",u.id(),pid,lang,source,db.now());
        return Map.of("savedAt",db.now());
    }
    public Object sync(User u) {
        var mine=new ArrayList<Object>();
        for(var row:db.sql.queryForList("SELECT document FROM rooms ORDER BY updated_at DESC LIMIT 100")) {
            var r=(ObjectNode)db.read((String)row.get("document"));
            for(var m:r.path("players")) if(m.path("id").asText().equals(u.id())) mine.add(rooms.publicState(r));
        }
        return Map.of("user",u,"rooms",mine,"submissions",submissions.list(u),"serverTime",db.now());
    }
    public String canonical(JsonNode n) {
        if(n.isObject()) {
            var map=new TreeMap<String,Object>(); n.fields().forEachRemaining(e->map.put(e.getKey(),db.read(canonical(e.getValue())))); return db.write(map);
        }
        if(n.isArray()) { var a=new ArrayList<Object>(); for(var x:n) a.add(db.read(canonical(x))); return db.write(a); }
        return db.write(n);
    }
}
