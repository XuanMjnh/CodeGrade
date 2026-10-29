package vn.codegrade.db;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import vn.codegrade.auth.Identity;
import vn.codegrade.catalog.Catalog;
import vn.codegrade.catalog.QuestionRules;
import java.util.*;

/** Additive, content-checked bank upgrade. Never touches historical submission snapshots. */
@Component
public class SeedBankExpansion {
    private final Store db;private final Catalog catalog;private final Identity identity;
    private volatile boolean deferred;
    public SeedBankExpansion(Store db,Catalog catalog,Identity identity){this.db=db;this.catalog=catalog;this.identity=identity;}
    private ObjectNode content(JsonNode q) {
        ObjectNode out=(ObjectNode)q.deepCopy();out.remove(List.of("id","version","publicId","validatedVersion","sampleValidation","validationNotice"));return out;
    }
    private void notice(String action,String id,String reason) {
        if(db.sql.queryForObject("SELECT COUNT(*) FROM audit WHERE action=? AND entity_id=?",Integer.class,action,id)==0)
            db.audit("server",action,id,Map.of("bank","6","reason",reason));
    }
    @Order(5) @EventListener(ApplicationReadyEvent.class)
    public void apply() throws Exception {
        var old=db.json.readTree(getClass().getResourceAsStream("/dataset-upgrade-6.json"));
        var bank=db.json.readTree(getClass().getResourceAsStream("/dataset.json"));
        Map<String,JsonNode> baselines=new HashMap<>();for(var q:old)baselines.put(q.path("general").path("idNumber").asText(),q);
        boolean[] pending={false};
        db.atomic(()->{
            Map<String,Map<String,Object>> existing=new HashMap<>();String author=null;
            for(var row:db.sql.queryForList("SELECT id,author_id,version,document FROM problems")) {
                String key=db.read((String)row.get("document")).path("general").path("idNumber").asText();existing.put(key,row);
                if(baselines.containsKey(key))author=(String)row.get("author_id");
            }
            // An unrelated production installation is not silently populated with demo data.
            if(author==null)return null;
            if(!identity.historicalUser(author).author()) {
                var owners=db.sql.queryForList("SELECT id FROM users WHERE role IN ('AUTHOR','ADMIN') AND enabled=TRUE ORDER BY created_at LIMIT 1");
                if(owners.isEmpty()){notice("SEED_V6_CONFLICT",author,"Chưa có AUTHOR/ADMIN để sở hữu ngân hàng mới");return null;}
                author=(String)owners.getFirst().get("id");
            }
            Set<String> pinned=new HashSet<>();
            for(var row:db.sql.queryForList("SELECT document FROM rooms WHERE state NOT IN ('LOBBY','FINISHED','CLOSED','UNRESOLVED')")) {
                var room=db.read((String)row.get("document"));for(var q:room.path("bank"))pinned.add(q.path("id").asText());
                for(var id:room.path("used"))pinned.add(id.asText());
            }
            for(var row:db.sql.queryForList("SELECT document FROM contests")) {
                var c=db.read((String)row.get("document"));if(c.path("startsAt").asLong()<=db.now()&&db.now()<=c.path("endsAt").asLong())for(var id:c.path("problemIds"))pinned.add(id.asText());
            }
            for(var target:bank) {
                String key=target.path("general").path("idNumber").asText();var row=existing.get(key);
                if(row==null) {
                    if(!key.startsWith("v6-"))continue;
                    String cat=target.path("general").path("categoryId").asText();
                    if(db.sql.queryForObject("SELECT COUNT(*) FROM categories WHERE id=?",Integer.class,cat)==0)db.sql.update("INSERT INTO categories VALUES(?,?,?)",cat,cat,cat);
                    var saved=(ObjectNode)catalog.save(identity.historicalUser(author),target);validate(saved,author,key);continue;
                }
                String id=(String)row.get("id");JsonNode current=db.read((String)row.get("document"));
                if(content(current).equals(content(target)))continue;
                if(pinned.contains(id)){pending[0]=true;notice("SEED_V6_DEFERRED",id,"Đề nằm trong bank trận hoặc contest đang diễn ra; thử lại sau trận");continue;}
                if(!baselines.containsKey(key)||!content(current).equals(content(baselines.get(key)))) {
                    notice("SEED_V6_CONFLICT",id,"Nội dung đã được chỉnh sửa; giữ nguyên và cần AUTHOR rà soát để có 5 testcase");continue;
                }
                ObjectNode upgraded=(ObjectNode)target.deepCopy();int version=((Number)row.get("version")).intValue()+1;
                upgraded.put("id",id).put("version",version);QuestionRules.validate(upgraded);
                db.sql.update("UPDATE problems SET title=?,difficulty=?,version=?,document=? WHERE id=?",upgraded.path("general").path("questionName").asText(),upgraded.path("difficulty").asInt(),version,db.write(upgraded),id);
                validate(upgraded,(String)row.get("author_id"),key);db.audit("server","SEED_V6_UPGRADED",id,Map.of("version",version));
            }
            return null;
        });
        deferred=pending[0];
    }
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay=60000)
    public void retryDeferred() {
        if(!deferred)return;
        try {new SeedBankUpgrade(db).apply();apply();}
        catch(Exception e){org.slf4j.LoggerFactory.getLogger(getClass()).warn("Bank upgrade deferred until next retry",e);}
    }
    private void validate(ObjectNode q,String author,String key) {
        db.sql.update("INSERT INTO submissions(id,user_id,problem_id,request_id,source_code,language,mode,received_at,status,snapshot) VALUES(?,?,?,?,?,?,?,?,?,?)",db.id(),author,q.path("id").asText(),"seed-v6:"+key+":"+q.path("version").asInt(),q.path("answer").path("sampleAnswer").asText(),q.path("answer").path("language").asText(),"VALIDATE",db.now(),"QUEUED",db.write(q));
    }
}
