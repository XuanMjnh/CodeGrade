package vn.codegrade.judge;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import vn.codegrade.db.Store;
import vn.codegrade.auth.Identity.User;
import vn.codegrade.catalog.*;
import vn.codegrade.room.Survival;
import static vn.codegrade.db.Store.require;
import java.util.*;
import com.google.re2j.Pattern;

@Service
public class Submissions {
    private final Store db; private final Catalog catalog; private final Survival survival;
    @Value("${app.max-queue}") int maxQueue;
    public Submissions(Store db,Catalog catalog,Survival survival) { this.db=db; this.catalog=catalog; this.survival=survival; }
    public Object accept(User u,JsonNode p,String requestId,String mode) {
        String pid=p.path("problemId").asText(), source=p.path("source").asText(), lang=p.path("language").asText();
        require(QuestionRules.LANGUAGES.contains(lang),"Ngôn ngữ: CPP11, CPP17, CPP20, PY311");
        require(!source.isBlank() && source.length()<=65536,"Source code cần 1–65536 ký tự");
        String room=p.path("roomId").asText(),round=p.path("roundId").asText(),contest=p.path("contestId").asText();
        require(room.isBlank() || contest.isBlank(),"Bài nộp chỉ thuộc một phòng hoặc một contest");
        require(!room.isBlank() || round.isBlank(),"Round ID cần đi cùng room ID");
        JsonNode q=catalog.document(pid);
        if(!contest.isBlank())checkContest(u,contest,pid);
        boolean isSample=mode.equals("VALIDATE");
        require(q.path("general").path("status").asText().equals("ready") || !contest.isBlank() || (isSample && catalog.canEdit(u,pid)),"Đề chưa công bố");
        if(isSample) require(catalog.canEdit(u,pid),"Không có quyền chạy đáp án mẫu");
        if(!room.isBlank()) {
            if(mode.equals("OFFICIAL")) q=survival.admit(u,p).path("frozenProblem");
            else {
                var r=survival.load(room);
                require(r.path("state").asText().equals("ROUND_ACTIVE") && r.path("current").path("id").asText().equals(round),"Vòng không còn hoạt động");
                boolean allowed=false; for(var player:r.path("players")) if(player.path("id").asText().equals(u.id()) && player.path("status").asText().equals("ALIVE")) allowed=true;
                require(allowed && r.path("current").path("problemId").asText().equals(pid),"Khán giả không được chạy thử");
                q=r.path("frozenProblem");
            }
        }
        if(!contest.isBlank()) checkContest(u,contest,pid);
        boolean legacyActive=!room.isBlank()||!contest.isBlank();
        if(!legacyActive&&q.path("testcases").size()!=5)for(var row:db.sql.queryForList("SELECT document FROM contests")) {
            var c=db.read((String)row.get("document"));
            if(c.path("startsAt").asLong()<=db.now()&&db.now()<=c.path("endsAt").asLong())
                for(var id:c.path("problemIds"))if(id.asText().equals(pid))legacyActive=true;
        }
        if(legacyActive&&q.path("testcases").size()!=5)QuestionRules.executableSnapshot(q);
        else QuestionRules.executable(q);
        boolean languageAllowed=false; for(var l:q.path("languages")) if(l.asText().equals(lang)) languageAllowed=true;
        require(languageAllowed,"Ngôn ngữ không được bật cho đề này");
        var tests=new ArrayList<JsonNode>();
        for(var t:QuestionRules.active(q)) {
            boolean select;
            if(mode.equals("EXAMPLES") || (!room.isBlank() && mode.equals("PRECHECK"))) select=t.path("useasexample").asBoolean();
            else if(mode.equals("PRECHECK")) {
                select=switch(q.path("precheck").asInt()) {
                    case 2 -> t.path("useasexample").asBoolean();
                    case 3 -> t.path("testtype").asInt()!=0;
                    case 4 -> true;
                    default -> false;
                };
            } else select=t.path("testtype").asInt()!=1;
            if(select) tests.add(t);
        }
        require(!tests.isEmpty(),"Không có test cho chế độ này (Precheck đang tắt/Empty)");
        require(db.sql.queryForObject("SELECT COUNT(*) FROM submissions WHERE status IN ('QUEUED','RUNNING')",Integer.class)<maxQueue,"Hàng đợi đầy; thử lại sau");
        require(db.sql.queryForObject("SELECT COUNT(*) FROM submissions WHERE user_id=? AND status IN ('QUEUED','RUNNING')",Integer.class,u.id())<4,"Tối đa 4 bài đang chờ chấm");
        ObjectNode frozen=q.deepCopy(); frozen.set("testcases",db.tree(tests));
        String id=db.id(); long received=db.now();long admissionOrder=db.sql.queryForObject("SELECT COALESCE(MAX(admission_order),0)+1 FROM submissions",Long.class);
        // Timestamp is assigned inside the admission lock. ACK is sent only after commit.
        if(!room.isBlank() && mode.equals("OFFICIAL"))
            require(received<=survival.load(room).path("current").path("deadline").asLong(),"Vòng đã hết hạn");
        db.sql.update("INSERT INTO submissions(id,user_id,problem_id,request_id,source_code,language,mode,room_id,round_id,contest_id,received_at,status,snapshot,rank_eligible,admission_order) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            id,u.id(),pid,requestId,source,lang,mode,room.isBlank()?null:room,round.isBlank()?null:round,contest.isBlank()?null:contest,received,"QUEUED",db.write(frozen),u.coder()&&mode.equals("OFFICIAL"),admissionOrder);
        if(mode.equals("OFFICIAL")&&(!room.isBlank()||!contest.isBlank()))db.sql.update("DELETE FROM drafts WHERE user_id=? AND problem_id=?",u.id(),pid);
        Object data=Map.of("admissionOrder",admissionOrder,"id",id,"userId",u.id(),"roundId",round,"receivedAt",received,"status","QUEUED","mode",mode);
        db.event(u.id(),"submission_received",data);
        if(!room.isBlank() && mode.equals("OFFICIAL")) survival.submissionEvent(room,"room_submission_received",data);
        return data;
    }
    private void checkContest(User u,String id,String problem) {
        JsonNode c=db.read((String)db.one("SELECT document FROM contests WHERE id=?",id).get("document"));
        require(db.now()>=c.path("startsAt").asLong() && db.now()<=c.path("endsAt").asLong() && !c.path("settled").asBoolean(),"Contest chưa bắt đầu hoặc đã kết thúc");
        boolean joined=u.admin(),contains=false;
        for(var uid:c.path("participants")) if(uid.asText().equals(u.id())) joined=true;
        for(var pid:c.path("problemIds")) if(pid.asText().equals(problem)) contains=true;
        require(joined && contains,"Cần đăng ký contest và chọn đúng đề");
    }
    public Object list(User u) {
        return db.sql.queryForList("SELECT s.id,s.problem_id,p.title,s.language,s.mode,s.room_id,s.round_id,s.contest_id,s.received_at,s.status,s.score,s.current_test,s.completed_tests,s.total_tests FROM submissions s JOIN problems p ON p.id=s.problem_id WHERE s.user_id=? ORDER BY s.received_at DESC,s.admission_order DESC,s.id DESC LIMIT 100",u.id());
    }
    public Object page(User u,JsonNode p) {
        String filter=p.path("filter").asText("all");
        require(Set.of("all","pending","ac","other").contains(filter),"Bộ lọc bài nộp không hợp lệ");
        int size=p.path("pageSize").asInt(20);
        require(Set.of(10,20,50).contains(size),"Số bài mỗi trang: 10, 20 hoặc 50");
        String condition=switch(filter) {
            case "pending" -> " AND s.status IN ('QUEUED','RUNNING')";
            case "ac" -> " AND s.status='AC'";
            case "other" -> " AND s.status NOT IN ('AC','QUEUED','RUNNING','SE')";
            default -> "";
        };
        long total=db.sql.queryForObject("SELECT COUNT(*) FROM submissions s WHERE s.user_id=?"+condition,Long.class,u.id());
        long pages=Math.max(1,(total+size-1)/size),page=Math.max(1,Math.min(p.path("page").asLong(1),pages));
        var items=db.sql.queryForList("SELECT s.id,s.problem_id,p.title,s.language,s.mode,s.room_id,s.round_id,s.contest_id,s.received_at,s.status,s.score,s.current_test,s.completed_tests,s.total_tests FROM submissions s JOIN problems p ON p.id=s.problem_id WHERE s.user_id=?"+condition+" ORDER BY s.received_at DESC,s.admission_order DESC,s.id DESC LIMIT ? OFFSET ?",u.id(),size,(page-1)*size);
        return Map.of("items",items,"total",total,"page",page,"pageSize",size,"totalPages",pages,"filter",filter);
    }
    public Object problemRanking(User u,String problemId) {
        catalog.get(u,problemId,false);
        var best=new HashMap<String,Map<String,Object>>();
        Comparator<Map<String,Object>> order=Comparator.comparingDouble((Map<String,Object> r)->((Number)r.get("timeMs")).doubleValue())
            .thenComparingInt(r->((Number)r.get("sourceLength")).intValue()).thenComparingLong(r->((Number)r.get("receivedAt")).longValue()).thenComparing(r->(String)r.get("submissionId"));
        for(var s:db.sql.queryForList("SELECT s.id,s.user_id,u.username,u.display_name,s.language,s.received_at,s.result,CHAR_LENGTH(s.source_code) AS source_length FROM submissions s JOIN users u ON u.id=s.user_id WHERE s.problem_id=? AND s.mode='OFFICIAL' AND s.status='AC' AND s.rank_eligible=TRUE AND u.role='CODER' AND u.enabled=TRUE",problemId)) {
            if(s.get("result")==null) continue;
            var cases=db.read((String)s.get("result")).path("cases");
            if(!cases.isArray() || cases.isEmpty()) continue;
            double time=0;for(var c:cases)time+=Math.max(0,c.path("timeMs").asDouble());
            if(!Double.isFinite(time))continue;
            var entry=new HashMap<String,Object>();
            entry.put("userId",s.get("user_id"));entry.put("username",s.get("username"));entry.put("name",s.get("display_name"));
            entry.put("submissionId",s.get("id"));entry.put("language",s.get("language"));entry.put("receivedAt",s.get("received_at"));entry.put("sourceLength",s.get("source_length"));entry.put("timeMs",time);
            String uid=(String)s.get("user_id");if(!best.containsKey(uid)||order.compare(entry,best.get(uid))<0)best.put(uid,entry);
        }
        var ranks=best.values().stream().sorted(order).limit(200).toList();
        for(int i=0;i<ranks.size();i++)ranks.get(i).put("rank",i+1);
        return ranks;
    }
    public Object detail(User u,String id) {
        var s=db.one("SELECT * FROM submissions WHERE id=?",id);
        require(s.get("user_id").equals(u.id()),"Chỉ được xem bài nộp của mình");
        JsonNode frozen=db.read((String)s.remove("snapshot")); s.remove("lease_token"); s.remove("worker_id");
        if(s.get("result")!=null) s.put("result",visibleResult((String)s.get("result"),frozen,s.get("room_id")!=null));
        return s;
    }
    public Object visibleResult(String result,JsonNode q,boolean inRoom) {
        ObjectNode r=(ObjectNode)db.read(result); ArrayNode safe=db.json.createArrayNode(); boolean hideRest=false;
        int feedback=q.path("displayfeedback").asInt(1);
        for(var c:r.path("cases")) {
            boolean ac=c.path("verdict").asText().equals("AC"); String display=c.path("display").asText();
            boolean visible=!hideRest && feedback!=2 && !display.equals("HIDE") && !(display.equals("HIDE_IF_FAIL")&&!ac) &&
                !(display.equals("HIDE_IF_SUCCEED")&&ac) && (!inRoom || c.path("example").asBoolean());
            ObjectNode x=db.obj().put("index",c.path("index").asInt());
            if(visible) { x=(ObjectNode)c.deepCopy(); x.remove(List.of("display","hiderestiffail","example")); }
            else x.put("hidden",true);
            safe.add(x);
            if(!ac && c.path("hiderestiffail").asBoolean()) hideRest=true;
        }
        r.set("cases",safe);
        if(inRoom || feedback==2) r.remove("diagnostic");
        return r;
    }
    public Object claim(String worker) {
        return db.atomic(()->{
            // Batch reference validation must not block live games; age real user work first.
            var rows=db.sql.queryForList("SELECT * FROM submissions WHERE status='QUEUED' ORDER BY CASE WHEN mode='VALIDATE' THEN 3 WHEN received_at<? THEN 0 WHEN round_id IS NOT NULL THEN 1 ELSE 2 END,received_at,admission_order LIMIT 1",db.now()-30_000);
            if(rows.isEmpty()) return Map.of("job",false);
            var s=rows.getFirst(); String lease=db.id(); long until=db.now()+30_000;
            JsonNode q=db.read((String)s.get("snapshot"));
            db.sql.update("UPDATE submissions SET status='RUNNING',worker_id=?,lease_token=?,lease_until=?,attempts=attempts+1,current_test=0,completed_tests=0,total_tests=? WHERE id=?",worker,lease,until,q.path("testcases").size(),s.get("id"));
            ObjectNode job=db.obj().put("job",true).put("id",(String)s.get("id")).put("leaseToken",lease)
                .put("source",(String)s.get("source_code")).put("language",(String)s.get("language"));
            // Trusted worker receives harness + stdin only; expected values stay on the server.
            ObjectNode runner=db.obj().put("type",q.path("coderunnertype").asText()).put("globalExtra",q.path("answer").path("globalExtra").asText())
                .put("seconds",q.path("advancedCustomisation").path("cputimelimitsecs").asInt(2))
                .put("memoryMb",Math.max(64,q.path("advancedCustomisation").path("memlimitmb").asInt(256)));
            ArrayNode tests=runner.putArray("tests");
            for(var t:q.path("testcases")) tests.add(db.obj().put("testcode",t.path("testcode").asText()).put("stdin",t.path("stdin").asText()));
            job.set("runner",runner);
            db.event((String)s.get("user_id"),"submission_running",Map.of("id",s.get("id")));
            if(s.get("room_id")!=null && "OFFICIAL".equals(s.get("mode"))) survival.submissionEvent((String)s.get("room_id"),"room_submission_running",Map.of("id",s.get("id"),"userId",s.get("user_id")));
            return job;
        });
    }
    public Object heartbeat(String worker,JsonNode p) {
        int updated=db.sql.update("UPDATE submissions SET lease_until=? WHERE id=? AND worker_id=? AND lease_token=? AND status='RUNNING'",
            db.now()+30_000,p.path("id").asText(),worker,p.path("leaseToken").asText());
        return Map.of("valid",updated==1);
    }
    public Object progress(String worker,JsonNode p) {
        return db.atomic(()->{
            var rows=db.sql.queryForList("SELECT user_id,current_test,completed_tests,total_tests FROM submissions WHERE id=? AND worker_id=? AND lease_token=? AND status='RUNNING' AND lease_until>=?",p.path("id").asText(),worker,p.path("leaseToken").asText(),db.now());
            if(rows.isEmpty())return Map.of("accepted",false);
            var s=rows.getFirst();int current=p.path("currentTest").asInt(-1),completed=p.path("completedTests").asInt(-1),total=((Number)s.get("total_tests")).intValue();
            require(current>=1 && current<=total && completed==current-1,"Tiến độ testcase không hợp lệ");
            if(current<=((Number)s.get("current_test")).intValue())return Map.of("accepted",true);
            db.sql.update("UPDATE submissions SET current_test=?,completed_tests=?,lease_until=? WHERE id=?",current,completed,db.now()+30_000,p.path("id").asText());
            db.event((String)s.get("user_id"),"submission_progress",Map.of("id",p.path("id").asText(),"currentTest",current,"completedTests",completed,"totalTests",total));
            return Map.of("accepted",true);
        });
    }
    public Object complete(String worker,JsonNode p) {
        return db.atomic(()->{
            var s=db.one("SELECT * FROM submissions WHERE id=?",p.path("id").asText());
            if(!"RUNNING".equals(s.get("status")) || !worker.equals(s.get("worker_id")) || !p.path("leaseToken").asText().equals(s.get("lease_token")) ||
                ((Number)s.get("lease_until")).longValue()<db.now()) return Map.of("accepted",false,"reason","stale lease");
            JsonNode q=db.read((String)s.get("snapshot"));
            if(p.path("systemError").asBoolean()) {
                if(((Number)s.get("attempts")).intValue()<3) {
                    db.sql.update("UPDATE submissions SET status='QUEUED',current_test=0,completed_tests=0,lease_token=NULL,lease_until=NULL WHERE id=?",s.get("id"));
                    return Map.of("accepted",true,"retry",true);
                }
                finish(s,q,"SE",0,db.obj().put("diagnostic","Judge infrastructure failed after 3 attempts").putArray("cases"));
                return Map.of("accepted",true);
            }
            JsonNode raw=p.path("cases");
            require(raw.isArray() && raw.size()==q.path("testcases").size(),"Worker trả thiếu kết quả testcase");
            ArrayNode cases=db.json.createArrayNode(); double earned=0,total=0; boolean all=true; String verdict="AC";
            for(int i=0;i<raw.size();i++) {
                JsonNode test=q.path("testcases").get(i),run=raw.get(i);
                String v=run.path("verdict").asText();
                require(Set.of("OK","CE","RE","TLE","MLE","OLE").contains(v),"Verdict worker không hợp lệ");
                require(run.path("stdout").asText().length()<=65536,"Worker output vượt giới hạn");
                if(v.equals("OK")) v=compare(run.path("stdout").asText(),test.path("expected").asText(),q.path("customisation").path("grader").asText("EqualityGrader"))?"AC":"WA";
                double mark=test.path("mark").asDouble(1); total+=mark;
                if(v.equals("AC")) earned+=mark; else { all=false; if(verdict.equals("AC")) verdict=v; }
                ObjectNode c=db.obj().put("index",i+1).put("verdict",v).put("timeMs",run.path("timeMs").asDouble())
                    .put("compileMs",run.path("compileMs").asDouble()).put("stdout",run.path("stdout").asText())
                    .put("stdin",test.path("stdin").asText()).put("testcode",test.path("testcode").asText()).put("expected",test.path("expected").asText())
                    .put("display",test.path("display").asText()).put("hiderestiffail",test.path("hiderestiffail").asBoolean()).put("example",test.path("useasexample").asBoolean());
                cases.add(c);
            }
            // Survival uses weighted partial scoring even when the standalone exercise is all-or-nothing.
            boolean partial=s.get("room_id")!=null || !q.path("allornothing").asBoolean(true);
            double score=all?100:partial&&total>0?Math.round(earned/total*10000)/100.0:0;
            ObjectNode result=db.obj(); result.set("cases",cases); result.put("diagnostic",p.path("diagnostic").asText("").substring(0,Math.min(4000,p.path("diagnostic").asText("").length())));
            finish(s,q,all?"AC":verdict,score,result);
            return Map.of("accepted",true);
        });
    }
    private void finish(Map<String,Object> s,JsonNode q,String verdict,double score,JsonNode rawResult) {
        ObjectNode result=db.obj().put("verdict",verdict).put("score",score);
        if(rawResult.isObject()) result.setAll((ObjectNode)rawResult); else result.putArray("cases");
        db.sql.update("UPDATE submissions SET status=?,score=?,result=?,completed_at=?,completed_tests=?,lease_token=NULL,lease_until=NULL WHERE id=?",verdict,score,db.write(result),db.now(),result.path("cases").size(),s.get("id"));
        boolean firstSolve="AC".equals(verdict) && "OFFICIAL".equals(s.get("mode")) && Boolean.TRUE.equals(s.get("rank_eligible")) &&
            db.sql.queryForObject("SELECT COUNT(*) FROM users WHERE id=? AND role='CODER'",Integer.class,s.get("user_id"))>0 &&
            db.sql.queryForObject("SELECT COUNT(*) FROM solved WHERE user_id=? AND problem_id=?",Integer.class,s.get("user_id"),s.get("problem_id"))==0;
        if(firstSolve)
            db.sql.update("INSERT INTO solved(user_id,problem_id) VALUES(?,?)",s.get("user_id"),s.get("problem_id"));
        if("VALIDATE".equals(s.get("mode")) && "AC".equals(verdict)) {
            ObjectNode current=(ObjectNode)catalog.document((String)s.get("problem_id"));
            if(current.path("version").asInt()==q.path("version").asInt()) {
                current.put("validatedVersion",current.path("version").asInt());
                db.sql.update("UPDATE problems SET document=? WHERE id=?",db.write(current),s.get("problem_id"));
            }
        }
        db.event((String)s.get("user_id"),"submission_judged",Map.of("id",s.get("id"),"status",verdict,"score",score));
        if(s.get("room_id")!=null && "OFFICIAL".equals(s.get("mode"))) survival.submissionEvent((String)s.get("room_id"),"room_submission_judged",Map.of("id",s.get("id"),"userId",s.get("user_id"),"status",verdict,"score",score,"receivedAt",s.get("received_at")));
        if("AC".equals(verdict) && "OFFICIAL".equals(s.get("mode"))) db.event(null,"leaderboard_changed",Map.of("metric","ac"));
    }
    public static boolean compare(String actual,String expected,String grader) {
        actual=actual.replace("\r\n","\n"); expected=expected.replace("\r\n","\n");
        return switch(grader) {
            case "RegexGrader" -> Pattern.compile(expected).matcher(actual).matches();
            case "NearEqualityGrader" -> near(actual,expected);
            default -> withoutFinalNewlines(actual).equals(withoutFinalNewlines(expected));
        };
    }
    private static String withoutFinalNewlines(String output) {
        int end=output.length();
        while(end>0 && output.charAt(end-1)=='\n') end--;
        return output.substring(0,end);
    }
    private static boolean near(String a,String e) {
        String[] aa=a.trim().split("\\s+"),ee=e.trim().split("\\s+");
        if(aa.length!=ee.length) return false;
        for(int i=0;i<aa.length;i++) {
            try {
                double x=Double.parseDouble(aa[i]),y=Double.parseDouble(ee[i]);
                if(!Double.isFinite(x)||!Double.isFinite(y)||Math.abs(x-y)>1e-6*Math.max(1,Math.abs(y))) return false;
            } catch(NumberFormatException ex) { if(!aa[i].equals(ee[i])) return false; }
        }
        return true;
    }
    @Scheduled(fixedDelay=3000)
    public void recover() {
        db.atomic(()->{
            for(var s:db.sql.queryForList("SELECT * FROM submissions WHERE status='RUNNING' AND lease_until<?",db.now())) {
                if(((Number)s.get("attempts")).intValue()>=3) finish(s,db.read((String)s.get("snapshot")),"SE",0,db.obj());
                else {
                    db.sql.update("UPDATE submissions SET status='QUEUED',current_test=0,completed_tests=0,lease_token=NULL,lease_until=NULL WHERE id=?",s.get("id"));
                    db.event((String)s.get("user_id"),"submission_retried",Map.of("id",s.get("id")));
                    if(s.get("room_id")!=null && "OFFICIAL".equals(s.get("mode"))) survival.submissionEvent((String)s.get("room_id"),"room_submission_retried",Map.of("id",s.get("id"),"userId",s.get("user_id")));
                }
            }
            return null;
        });
    }
}
