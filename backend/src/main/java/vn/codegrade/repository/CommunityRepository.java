package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CommunityRepository extends JdbcRepository {
  public CommunityRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public List<String> findBookmarkedProblemIds(String userId) {
    return jdbc.queryForList(
        "SELECT problem_id FROM bookmarks WHERE user_id=?", String.class, userId);
  }

  public int deleteBookmark(String userId, String problemId) {
    return jdbc.update("DELETE FROM bookmarks WHERE user_id=? AND problem_id=?", userId, problemId);
  }

  public int insertBookmark(String userId, String problemId) {
    return jdbc.update("INSERT INTO bookmarks VALUES(?,?)", userId, problemId);
  }

  public List<Map<String, Object>> listProblemComments(String problemId) {
    return jdbc.queryForList(
        "SELECT c.*,u.display_name FROM comments c JOIN users u ON u.id=c.user_id WHERE"
            + " problem_id=? ORDER BY created_at DESC",
        problemId);
  }

  public int insertComment(
      String id, String userId, String problemId, String body, long createdAt) {
    return jdbc.update(
        "INSERT INTO comments VALUES(?,?,?,?,?)", id, userId, problemId, body, createdAt);
  }

  public List<Map<String, Object>> listAnnouncements() {
    return jdbc.queryForList("SELECT * FROM announcements ORDER BY created_at DESC");
  }

  public int insertAnnouncement(
      String id, String authorId, String title, String body, long createdAt) {
    return jdbc.update(
        "INSERT INTO announcements VALUES(?,?,?,?,?)", id, authorId, title, body, createdAt);
  }
}
