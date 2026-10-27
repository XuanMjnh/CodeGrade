package vn.codegrade.db;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import vn.codegrade.catalog.QuestionRules;
import java.util.*;

/** Upgrades pristine bundled exercises without resetting identifiers or user work. */
@Component
public class SeedBankUpgrade {
 private final Store db;
 public SeedBankUpgrade(Store db) { this.db=db; }
 private ObjectNode content(JsonNode value) {
  ObjectNode copy=(ObjectNode)value.deepCopy();
  copy.remove(List.of("id","version","publicId","validatedVersion","sampleValidation","validationNotice"));
  return copy;
 }
 @Order(0)
 @EventListener(ApplicationReadyEvent.class)
 public void apply() throws Exception {
  var baselines=db.json.readTree(getClass().getResourceAsStream("/dataset-upgrade-5.5.json"));
  var targets=db.json.readTree(getClass().getResourceAsStream("/dataset.json"));
  Map<String,JsonNode> byKey=new HashMap<>();
  for(var target:targets) byKey.put(target.path("general").path("idNumber").asText(),target);
  db.atomic(()->{
   Set<String> pinned=new HashSet<>();
   for(var row:db.sql.queryForList("SELECT document FROM rooms WHERE state NOT IN ('LOBBY','FINISHED','CLOSED','UNRESOLVED')"))
    for(var id:db.read((String)row.get("document")).path("used")) pinned.add(id.asText());
   for(var row:db.sql.queryForList("SELECT document FROM contests")) {
    var c=db.read((String)row.get("document"));
    if(c.path("startsAt").asLong()<=db.now() && db.now()<=c.path("endsAt").asLong())
     for(var id:c.path("problemIds")) pinned.add(id.asText());
   }
   for(var row:db.sql.queryForList("SELECT id,author_id,version,document FROM problems")) {
    String id=(String)row.get("id");
    if(((Number)row.get("version")).intValue()!=1 || pinned.contains(id)) continue;
    var current=content(db.read((String)row.get("document")));
    String key=current.path("general").path("idNumber").asText();
    for(var baseline:baselines) {
     if(!key.equals(baseline.path("key").asText())) continue;
     var candidate=current.deepCopy();var general=(ObjectNode)candidate.path("general");
     // The previous release existed in English and Vietnamese; both must be exact.
     if(general.path("questionName").asText().equals(baseline.path("englishTitle").asText()) &&
        general.path("questionText").asText().equals(baseline.path("englishText").asText())) {
      general.set("questionName",baseline.path("baseline").path("general").path("questionName"));
      general.set("questionText",baseline.path("baseline").path("general").path("questionText"));
     }
     if(!candidate.equals(content(baseline.path("baseline")))) break;
     ObjectNode target=(ObjectNode)byKey.get(key).deepCopy();target.put("id",id).put("version",2);
     QuestionRules.validate(target);
     db.sql.update("UPDATE problems SET title=?,difficulty=?,version=2,document=? WHERE id=?",
       target.path("general").path("questionName").asText(),target.path("difficulty").asInt(),db.write(target),id);
     db.sql.update("INSERT INTO submissions(id,user_id,problem_id,request_id,source_code,language,mode,received_at,status,snapshot) VALUES(?,?,?,?,?,?,?,?,?,?)",
       db.id(),row.get("author_id"),id,"seed-v55:"+key,target.path("answer").path("sampleAnswer").asText(),target.path("answer").path("language").asText(),"VALIDATE",db.now(),"QUEUED",db.write(target));
     db.audit((String)row.get("author_id"),"SEED_BANK_UPGRADED",id,Map.of("bank","5.5","version",2));
     break;
    }
   }
   return null;
  });
 }
}
