package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DraftRepository extends JdbcRepository {
  public DraftRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public int deleteDraft(String userId, String problemId) {
    return jdbc.update("DELETE FROM drafts WHERE user_id=? AND problem_id=?", userId, problemId);
  }

  public List<Map<String, Object>> findDraft(String userId, String problemId) {
    return jdbc.queryForList(
        "SELECT language,source_code,updated_at FROM drafts WHERE user_id=? AND problem_id=?",
        userId,
        problemId);
  }

  public int insertDraft(
      String userId, String problemId, String language, String sourceCode, long updatedAt) {
    return jdbc.update(
        "INSERT INTO drafts(user_id,problem_id,language,source_code,updated_at) VALUES(?,?,?,?,?)",
        userId,
        problemId,
        language,
        sourceCode,
        updatedAt);
  }
}
