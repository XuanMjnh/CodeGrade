package vn.codegrade.db;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import vn.codegrade.auth.Identity;
import vn.codegrade.catalog.*;
import java.util.*;

@Component
public class Bootstrap implements ApplicationRunner {
    private final Store db; private final Identity identity; private final Catalog catalog;
    @Value("${app.admin-password}") String adminPassword;
    @Value("${app.worker-token}") String workerToken;
    @Value("${app.demo}") boolean demo;
    @Value("${DEMO_PASSWORD:}") String demoPassword;
    public Bootstrap(Store db,Identity identity,Catalog catalog) { this.db=db; this.identity=identity; this.catalog=catalog; }
    @Override public void run(ApplicationArguments args) throws Exception {
        Store.require(workerToken.length()>=32,"Thiết lập WORKER_TOKEN ≥32 ký tự trong .env");
        Store.require(adminPassword.length()>=10 && adminPassword.length()<=72,"Thiết lập ADMIN_PASSWORD 10–72 ký tự trong .env");
        db.atomic(()->{
            if(db.sql.queryForObject("SELECT COUNT(*) FROM users",Integer.class)==0) identity.create("admin","Quản trị viên",adminPassword,"ADMIN");
            if(db.sql.queryForObject("SELECT COUNT(*) FROM categories",Integer.class)==0)
                db.sql.update("INSERT INTO categories(id,name,description) VALUES('algorithms','Algorithms','Ngân hàng thuật toán và lập trình')");
            return null;
        });
        if(!demo) return;
        Store.require(demoPassword.length()>=10 && demoPassword.length()<=72,"DEMO_PASSWORD cần 10–72 ký tự khi bật DEMO_DATA");
        JsonNode dataset=db.json.readTree(getClass().getResourceAsStream("/dataset.json"));
        db.atomic(()->{
            if(db.sql.queryForObject("SELECT COUNT(*) FROM users WHERE username='author'",Integer.class)==0)
                identity.create("author","Người tạo đề",demoPassword,"AUTHOR");
            for(int i=1;i<=10;i++) {
                String username=String.format("coder%02d",i);
                if(db.sql.queryForObject("SELECT COUNT(*) FROM users WHERE username=?",Integer.class,username)==0)
                    identity.create(username,"Coder "+i,demoPassword,"CODER");
            }
            String author=(String)db.one("SELECT id FROM users WHERE username='author'").get("id");
            var owner=identity.user(author);
            Set<String> categories=new HashSet<>(db.sql.queryForList("SELECT id FROM categories",String.class));
            Set<String> existing=new HashSet<>();
            for(var row:db.sql.queryForList("SELECT document FROM problems"))
                existing.add(db.read((String)row.get("document")).path("general").path("idNumber").asText());
            for(var item:dataset) {
                String category=item.path("general").path("categoryId").asText();
                if(categories.add(category))db.sql.update("INSERT INTO categories VALUES(?,?,?)",category,category,category);
                String key=item.path("general").path("idNumber").asText();
                if(!existing.add(key)) continue;
                ObjectNode saved=(ObjectNode)catalog.save(owner,item);
                // Reference solutions are verified by the real worker, never marked AC by seed logic.
                String id=db.id();
                db.sql.update("INSERT INTO submissions(id,user_id,problem_id,request_id,source_code,language,mode,received_at,status,snapshot) VALUES(?,?,?,?,?,?,?,?,?,?)",
                    id,author,saved.path("id").asText(),"seed:"+key,saved.path("answer").path("sampleAnswer").asText(),saved.path("answer").path("language").asText(),"VALIDATE",db.now(),"QUEUED",db.write(saved));
            }
            return null;
        });
    }
}
