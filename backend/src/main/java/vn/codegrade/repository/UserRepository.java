package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository extends JdbcRepository {
  public UserRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public Map<String, Object> findEnabledById(String id) {
    return one("SELECT * FROM users WHERE id=? AND enabled=TRUE", id);
  }

  public Map<String, Object> findById(String id) {
    return one("SELECT * FROM users WHERE id=?", id);
  }

  public int countByUsername(String username) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM users WHERE username=?", Integer.class, username);
  }

  public int updateEmail(String email, String id) {
    return jdbc.update("UPDATE users SET email=? WHERE id=?", email, id);
  }

  public int insertUser(
      String id,
      String username,
      String displayName,
      String passwordHash,
      String role,
      long createdAt) {
    int changed =
        jdbc.update(
            "INSERT INTO users(id,username,display_name,password_hash,role,created_at)"
                + " VALUES(?,?,?,?,?,?)",
            id,
            username,
            displayName,
            passwordHash,
            role,
            createdAt);
    jdbc.update("INSERT INTO progression(user_id) VALUES(?)", id);
    return changed;
  }

  public List<Map<String, Object>> findEnabledByUsername(String username) {
    return jdbc.queryForList("SELECT * FROM users WHERE username=? AND enabled=TRUE", username);
  }

  public int insertSession(String tokenHash, String userId, long expiresAt) {
    return jdbc.update(
        "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
        tokenHash,
        userId,
        expiresAt);
  }

  public List<Map<String, Object>> findValidSession(String tokenHash, long expiresAt) {
    return jdbc.queryForList(
        "SELECT u.id,u.username,u.display_name,u.role,u.elo,u.wins,u.email FROM sessions s JOIN"
            + " users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND"
            + " u.enabled=TRUE",
        tokenHash,
        expiresAt);
  }

  public int revokeToken(String tokenHash) {
    return jdbc.update("DELETE FROM sessions WHERE token_hash=?", tokenHash);
  }

  public Map<String, Object> findPasswordHash(String id) {
    return one("SELECT password_hash FROM users WHERE id=?", id);
  }

  public int updatePasswordHash(String passwordHash, String id) {
    return jdbc.update("UPDATE users SET password_hash=? WHERE id=?", passwordHash, id);
  }

  public int revokeUserSessions(String userId) {
    return jdbc.update("DELETE FROM sessions WHERE user_id=?", userId);
  }

  public List<Map<String, Object>> listAccounts() {
    return jdbc.queryForList(
        "SELECT id,username,display_name,role,enabled,elo,wins FROM users ORDER BY username");
  }

  public Map<String, Object> findRole(String id) {
    return one("SELECT role FROM users WHERE id=?", id);
  }

  public int updatePermissions(String role, boolean enabled, String id) {
    return jdbc.update("UPDATE users SET role=?,enabled=? WHERE id=?", role, enabled, id);
  }

  public List<Map<String, Object>> listLeaderboard(String metric) {
    String field =
        switch (metric) {
          case "ac" -> "ac";
          case "exp" -> "exp";
          case "rank" -> "rating";
          case "normal_games" -> "normal_games";
          case "ranked_games" -> "ranked_games";
          default -> "elo";
        };

    return jdbc.queryForList(
        """
        SELECT u.id,u.username,u.display_name,u.elo,
               COALESCE(s.ac,0) AS ac,COALESCE(p.exp,0) AS exp,
               COALESCE(p.rating,1000) AS rating,
               COALESCE(m.normal_games,0) AS normal_games,
               COALESCE(m.ranked_games,0) AS ranked_games
        FROM users u
        LEFT JOIN (SELECT user_id,COUNT(*) AS ac FROM solved GROUP BY user_id) s ON s.user_id=u.id
        LEFT JOIN progression p ON p.user_id=u.id
        LEFT JOIN (
            SELECT user_id,
                   SUM(CASE WHEN mode='NORMAL' THEN 1 ELSE 0 END) AS normal_games,
                   SUM(CASE WHEN mode='RANKED' THEN 1 ELSE 0 END) AS ranked_games
            FROM match_results WHERE mode IN ('NORMAL','RANKED') GROUP BY user_id
        ) m ON m.user_id=u.id
        WHERE u.role='CODER' AND u.enabled=TRUE
        """
            + " ORDER BY "
            + field
            + " DESC,u.username LIMIT 200");
  }

  public int updateProfile(String email, String displayName, String id) {
    return jdbc.update(
        "UPDATE users SET email=?,display_name=? WHERE id=?", email, displayName, id);
  }

  public int applyContestRating(int elo, String id) {
    return jdbc.update(
        "UPDATE users SET elo=GREATEST(100,elo+?) WHERE id=? AND role='CODER'", elo, id);
  }

  public int countAccounts() {
    return jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
  }

  public int countSeedAuthor() {
    return jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE username='author'", Integer.class);
  }

  public Map<String, Object> findSeedAuthor() {
    return one("SELECT id FROM users WHERE username='author'");
  }

  public int countCoder(String id) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM users WHERE id=? AND role='CODER'", Integer.class, id);
  }

  public int incrementWins(String id) {
    return jdbc.update("UPDATE users SET wins=wins+1 WHERE id=? AND role='CODER'", id);
  }
}
