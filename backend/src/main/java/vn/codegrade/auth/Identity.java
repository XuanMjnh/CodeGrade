package vn.codegrade.auth;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import vn.codegrade.db.Store;
import static vn.codegrade.db.Store.require;
import java.security.SecureRandom;
import java.util.*;

@Service
public class Identity {
    private final Store db;
    private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(11);
    public Identity(Store db) { this.db=db; }
    public record User(String id, String username, String displayName, String role, int elo, int wins, String email) {
        public boolean admin() { return role.equals("ADMIN"); }
        public boolean author() { return admin() || role.equals("AUTHOR"); }
        public boolean coder() { return role.equals("CODER"); }
    }
    public User user(String id) {
        var m=db.one("SELECT * FROM users WHERE id=? AND enabled=TRUE",id);
        return profile(m);
    }
    /** Historical standings must remain readable after an account is disabled. */
    public User historicalUser(String id) {
        return profile(db.one("SELECT * FROM users WHERE id=?",id));
    }
    private User profile(Map<String,Object> m) {
        String id=(String)m.get("id");
        return new User(id,(String)m.get("username"),(String)m.get("display_name"),(String)m.get("role"),
            ((Number)m.get("elo")).intValue(),((Number)m.get("wins")).intValue(),(String)m.get("email"));
    }
    public Map<String,Object> register(JsonNode p) {
        String name=p.path("username").asText().trim(), pass=p.path("password").asText(),
            display=p.path("displayName").asText().trim();
        require(name.matches("[A-Za-z0-9_]{3,40}"),"Username: 3–40 ký tự chữ, số hoặc _");
        require(pass.length()>=10 && pass.length()<=72,"Mật khẩu cần 10–72 ký tự");
        require(!display.isBlank() && display.length()<=100,"Họ tên cần 1–100 ký tự");
        require(db.sql.queryForObject("SELECT COUNT(*) FROM users WHERE username=?",Integer.class,name)==0,"Username đã tồn tại");
        String id=create(name,display,pass,"CODER");
        String email=p.path("email").asText().trim(); require(email.matches("[^ @]+@[^ @]+[.][^ @]+")&&email.length()<=254,"Invalid email");
        db.sql.update("UPDATE users SET email=? WHERE id=?",email,id);
        return issue(user(id));
    }
    public String create(String username,String display,String pass,String role) {
        String id=db.id();
        db.sql.update("INSERT INTO users(id,username,display_name,password_hash,role,created_at) VALUES(?,?,?,?,?,?)",
            id,username,display,passwords.encode(pass),role,db.now());
        return id;
    }
    public Map<String,Object> login(JsonNode p) {
        var rows=db.sql.queryForList("SELECT * FROM users WHERE username=? AND enabled=TRUE",p.path("username").asText());
        String hash=rows.isEmpty()?"$2a$11$8k9p4f2Fqj7AXdWTobR7VO5hHP9XyzLrS7b0Bz0tAEhUhASB9SS1e":(String)rows.getFirst().get("password_hash");
        boolean valid=passwords.matches(p.path("password").asText(),hash);
        if (rows.isEmpty() || !valid) throw new Store.Fault("AUTH","Tài khoản hoặc mật khẩu không đúng");
        return issue(user((String)rows.getFirst().get("id")));
    }
    private Map<String,Object> issue(User user) {
        byte[] bytes=new byte[32]; new SecureRandom().nextBytes(bytes);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        db.sql.update("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",Store.hash(token),user.id(),db.now()+12*3600_000L);
        return Map.of("token",token,"user",user);
    }
    public User authenticate(String token) {
        var rows=db.sql.queryForList("SELECT s.user_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.enabled=TRUE",Store.hash(token),db.now());
        if(rows.isEmpty()) throw new Store.Fault("AUTH","Phiên đăng nhập đã hết hạn");
        return user((String)rows.getFirst().get("user_id"));
    }
    public void logout(String token) { db.sql.update("DELETE FROM sessions WHERE token_hash=?",Store.hash(token)); }
    public Object changePassword(User u,JsonNode p) {
        String current=p.path("currentPassword").asText(),next=p.path("newPassword").asText();
        String hash=(String)db.one("SELECT password_hash FROM users WHERE id=?",u.id()).get("password_hash");
        require(current.getBytes(java.nio.charset.StandardCharsets.UTF_8).length<=72 && passwords.matches(current,hash),"Mật khẩu hiện tại không đúng");
        require(next.length()>=10 && next.getBytes(java.nio.charset.StandardCharsets.UTF_8).length<=72,"Mật khẩu mới cần ít nhất 10 ký tự và tối đa 72 byte");
        require(!passwords.matches(next,hash),"Mật khẩu mới phải khác mật khẩu hiện tại");
        db.sql.update("UPDATE users SET password_hash=? WHERE id=?",passwords.encode(next),u.id());
        db.sql.update("DELETE FROM sessions WHERE user_id=?",u.id());
        db.audit(u.id(),"PASSWORD_CHANGED",u.id(),Map.of("sessionsRevoked",true));
        return Map.of("changed",true);
    }
    public Object admin(User u, String type, JsonNode p) {
        require(u.admin(),"Chỉ admin được quản lý người dùng");
        if(type.equals("USERS")) return db.sql.queryForList("SELECT id,username,display_name,role,enabled,elo,wins FROM users ORDER BY username");
        String id=p.path("id").asText(); var target=db.one("SELECT role FROM users WHERE id=?",id);
        require(!id.equals(u.id()),"Không tự thay đổi quyền hoặc khóa tài khoản đang dùng");
        String role=p.path("role").asText((String)target.get("role"));
        require(Set.of("ADMIN","AUTHOR","CODER").contains(role),"Role không hợp lệ");
        db.sql.update("UPDATE users SET role=?,enabled=? WHERE id=?",role,p.path("enabled").asBoolean(true),id);
        db.sql.update("DELETE FROM sessions WHERE user_id=?",id);
        db.audit(u.id(),"USER_UPDATED",id,Map.of("role",role,"enabled",p.path("enabled").asBoolean(true)));
        db.event(id,"session_revoked",Map.of("reason","Quyền hoặc trạng thái tài khoản đã thay đổi"));
        return Map.of("id",id);
    }
}
