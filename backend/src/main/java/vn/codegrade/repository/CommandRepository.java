package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CommandRepository extends JdbcRepository {
  public CommandRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public List<Map<String, Object>> findResponse(String userId, String requestId) {
    return jdbc.queryForList(
        "SELECT fingerprint,response FROM commands WHERE user_id=? AND request_id=?",
        userId,
        requestId);
  }

  public int saveResponse(
      String userId, String requestId, String fingerprint, String response, long createdAt) {
    return jdbc.update(
        "INSERT INTO commands(user_id,request_id,fingerprint,response,created_at)"
            + " VALUES(?,?,?,?,?)",
        userId,
        requestId,
        fingerprint,
        response,
        createdAt);
  }
}
