package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ActivityRepository extends JdbcRepository {
  public ActivityRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public long headSequence() {
    return jdbc.queryForObject("SELECT COALESCE(MAX(id),0) FROM events", Long.class);
  }

  public List<Map<String, Object>> findEventsAfter(long id, String userId) {
    return jdbc.queryForList(
        """
SELECT id,type,payload,created_at FROM (
    (SELECT id,type,payload,created_at FROM events WHERE user_id IS NULL AND id>? ORDER BY id LIMIT 200)
    UNION ALL
    (SELECT id,type,payload,created_at FROM events WHERE user_id=? AND id>? ORDER BY id LIMIT 200)
) feed ORDER BY id LIMIT 200
""",
        id,
        userId,
        id);
  }

  public List<Map<String, Object>> listAudit(boolean summary) {
    return jdbc.queryForList(
        "SELECT "
            + (summary ? "id,actor_id,action,entity_id,created_at" : "*")
            + " FROM audit ORDER BY id DESC LIMIT 100");
  }

  public void appendEvent(String user, String type, String payload, long createdAt) {
    jdbc.update(
        "INSERT INTO events(user_id,type,payload,created_at) VALUES(?,?,?,?)",
        user,
        type,
        payload,
        createdAt);
  }

  public void appendAudit(
      String actor, String action, String entity, String payload, long createdAt) {
    jdbc.update(
        "INSERT INTO audit(actor_id,action,entity_id,payload,created_at) VALUES(?,?,?,?,?)",
        actor,
        action,
        entity,
        payload,
        createdAt);
  }
}
