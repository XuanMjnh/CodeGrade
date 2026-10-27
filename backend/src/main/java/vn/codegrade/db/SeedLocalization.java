package vn.codegrade.db;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.Map;
import org.springframework.core.annotation.Order;
@Component
public class SeedLocalization {
 private final Store db;
 public SeedLocalization(Store db){this.db=db;}
 @Order(10)
 @EventListener(ApplicationReadyEvent.class)
 public void apply() throws Exception {
  var entries=db.json.readTree(getClass().getResourceAsStream("/dataset-localization.json"));
  db.atomic(()->{
   Map<String,String> categories=Map.of("arithmetic","Số học","arrays","Mảng","strings","Chuỗi","numbertheory","Lý thuyết số","sequences","Dãy con","graphs","Đồ thị","algorithms","Thuật toán");
   categories.forEach((id,name)->db.sql.update("UPDATE categories SET name=?,description=? WHERE id=? AND (name=? OR name=?)",name,name,id,id,id.equals("numbertheory")?"NumberTheory":id.substring(0,1).toUpperCase()+id.substring(1)));
   for(var row:db.sql.queryForList("SELECT id,title,document FROM problems")){
    ObjectNode doc=(ObjectNode)db.read((String)row.get("document"));var general=doc.path("general");
    for(var entry:entries){if(general.path("idNumber").asText().equals(entry.path("key").asText()) && general.path("questionName").asText().equals(entry.path("oldTitle").asText()) && general.path("questionText").asText().equals(entry.path("oldText").asText())){
     ((ObjectNode)general).put("questionName",entry.path("title").asText()).put("questionText",entry.path("text").asText());db.sql.update("UPDATE problems SET title=?,document=? WHERE id=?",entry.path("title").asText(),db.write(doc),row.get("id"));break;
    }}
   }
   return null;
  });
 }
}
