package vn.codegrade.catalog;
import org.springframework.stereotype.Service;
import vn.codegrade.db.Store;
import vn.codegrade.auth.Identity.User;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import static vn.codegrade.db.Store.require;
@Service public class Community {
 private final Store db;private final Catalog catalog;
 public Community(Store d,Catalog c){db=d;catalog=c;}
 public Object command(User u,String type,JsonNode p){
  String pid=p.path("problemId").asText();
  if(type.startsWith("BOOKMARK")||type.startsWith("COMMENT"))catalog.get(u,pid,false);
  switch(type){
   case "BOOKMARK_SET":db.sql.update("DELETE FROM bookmarks WHERE user_id=? AND problem_id=?",u.id(),pid);if(p.path("starred").asBoolean())db.sql.update("INSERT INTO bookmarks VALUES(?,?)",u.id(),pid);return Map.of("starred",p.path("starred").asBoolean());
   case "COMMENTS":return db.sql.queryForList("SELECT c.*,u.display_name FROM comments c JOIN users u ON u.id=c.user_id WHERE problem_id=? ORDER BY created_at DESC",pid);
   case "COMMENT_ADD":String text=p.path("body").asText().trim();require(!text.isEmpty()&&text.length()<=4000,"Comment: 1–4000 characters");db.sql.update("INSERT INTO comments VALUES(?,?,?,?,?)",db.id(),u.id(),pid,text,db.now());db.event(null,"comments_changed",Map.of("problemId",pid));return Map.of("saved",true);
   case "ANNOUNCEMENTS":return db.sql.queryForList("SELECT * FROM announcements ORDER BY created_at DESC");
   case "ANNOUNCEMENT_ADD":require(u.admin(),"Admin only");String title=p.path("title").asText().trim(),body=p.path("body").asText().trim();require(!title.isEmpty()&&title.length()<=200&&!body.isEmpty()&&body.length()<=4000,"Invalid announcement");db.sql.update("INSERT INTO announcements VALUES(?,?,?,?,?)",db.id(),u.id(),title,body,db.now());db.event(null,"announcement_published",Map.of("title",title));return Map.of("saved",true);
   case "PROFILE_SAVE":String email=p.path("email").asText().trim().toLowerCase(Locale.ROOT),name=p.path("displayName").asText().trim();require(email.matches("[^ @]+@[^ @]+[.][^ @]+")&&email.length()<=254,"Invalid email");require(!name.isBlank()&&name.length()<=100,"Invalid name");db.sql.update("UPDATE users SET email=?,display_name=? WHERE id=?",email,name,u.id());return Map.of("saved",true);
   default:throw new Store.Fault("TYPE","Unknown command");
  }
 }
}