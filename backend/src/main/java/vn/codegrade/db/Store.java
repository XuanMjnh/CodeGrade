package vn.codegrade.db;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;
import java.util.function.Supplier;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Component
public class Store {
    public final JdbcTemplate sql;
    public final ObjectMapper json;
    private final TransactionTemplate tx;
    public Store(JdbcTemplate sql, ObjectMapper json, TransactionTemplate tx) {
        this.sql = sql; this.json = json; this.tx = tx;
    }
    // Short DB critical section: admission, cutoff, settlement. Never execute code or send sockets here.
    public <T> T atomic(Supplier<T> body) {
        return tx.execute(s -> { sql.queryForObject("SELECT id FROM system_lock WHERE id=1 FOR UPDATE", Integer.class); return body.get(); });
    }
    public long now() { return System.currentTimeMillis(); }
    public String id() { return UUID.randomUUID().toString(); }
    public ObjectNode obj() { return json.createObjectNode(); }
    public JsonNode read(String s) {
        try { return json.readTree(s); } catch (Exception e) { throw new IllegalArgumentException("JSON không hợp lệ"); }
    }
    public String write(Object o) {
        try { return json.writeValueAsString(o); } catch (Exception e) { throw new IllegalArgumentException("Không thể mã hóa JSON", e); }
    }
    public JsonNode tree(Object o) { return json.valueToTree(o); }
    public Map<String,Object> one(String q, Object... args) {
        var rows = sql.queryForList(q,args);
        if (rows.isEmpty()) throw new Fault("NOT_FOUND","Không tìm thấy dữ liệu");
        return rows.getFirst();
    }
    public void event(String user, String type, Object payload) {
        sql.update("INSERT INTO events(user_id,type,payload,created_at) VALUES(?,?,?,?)", user,type,write(payload),now());
    }
    public void audit(String actor, String action, String entity, Object data) {
        sql.update("INSERT INTO audit(actor_id,action,entity_id,payload,created_at) VALUES(?,?,?,?,?)",actor,action,entity,write(data),now());
    }
    public static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (Exception e) { throw new IllegalStateException(e); }
    }
    public static void require(boolean ok, String message) { if (!ok) throw new Fault("VALIDATION",message); }
    public static class Fault extends RuntimeException {
        public final String code;
        public Fault(String code, String msg) { super(msg); this.code=code; }
    }
}
