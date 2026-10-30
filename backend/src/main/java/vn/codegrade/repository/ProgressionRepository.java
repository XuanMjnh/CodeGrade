package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProgressionRepository extends JdbcRepository {
  public ProgressionRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public int countUserProgression(String userId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM progression WHERE user_id=?", Integer.class, userId);
  }

  public int insertUserProgression(String userId) {
    return jdbc.update("INSERT INTO progression(user_id) VALUES(?)", userId);
  }

  public Map<String, Object> findProgression(String userId) {
    return one("SELECT * FROM progression WHERE user_id=?", userId);
  }

  public int countReward(String userId, String eventKey) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM reward_events WHERE user_id=? AND event_key=?",
        Integer.class,
        userId,
        eventKey);
  }

  public int insertReward(
      String userId,
      String eventKey,
      String kind,
      int exp,
      int ratingBefore,
      int ratingAfter,
      long createdAt) {
    return jdbc.update(
        "INSERT INTO reward_events VALUES(?,?,?,?,?,?,?)",
        userId,
        eventKey,
        kind,
        exp,
        ratingBefore,
        ratingAfter,
        createdAt);
  }

  public int applyReward(int exp, int rating, int rankedGames, String userId) {
    return jdbc.update(
        "UPDATE progression SET exp=exp+?,rating=?,ranked_games=ranked_games+? WHERE user_id=?",
        exp,
        rating,
        rankedGames,
        userId);
  }

  public int countRoomResults(String roomId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM match_results WHERE room_id=?", Integer.class, roomId);
  }

  public int insertMatchResult(
      String roomId,
      String userId,
      String mode,
      int placement,
      int exp,
      int ratingBefore,
      int ratingAfter,
      long finishedAt) {
    return jdbc.update(
        "INSERT INTO match_results VALUES(?,?,?,?,?,?,?,?)",
        roomId,
        userId,
        mode,
        placement,
        exp,
        ratingBefore,
        ratingAfter,
        finishedAt);
  }

  public List<Map<String, Object>> listRankedLeaderboard() {
    return jdbc.queryForList(
        "SELECT p.user_id,u.display_name,p.rating,p.exp,p.ranked_games FROM progression p JOIN"
            + " users u ON u.id=p.user_id WHERE u.role='CODER' AND u.enabled=TRUE AND"
            + " p.ranked_games>0 ORDER BY p.rating DESC,u.username LIMIT 200");
  }

  public List<Map<String, Object>> listMatchHistory(String userId) {
    return jdbc.queryForList(
        "SELECT * FROM match_results WHERE user_id=? ORDER BY finished_at DESC LIMIT 100", userId);
  }

  public List<Map<String, Object>> listRewards(String userId) {
    return jdbc.queryForList(
        "SELECT * FROM reward_events WHERE user_id=? ORDER BY created_at DESC LIMIT 100", userId);
  }

  public Map<String, Object> findOrDefault(String user) {
    var rows = jdbc.queryForList("SELECT * FROM progression WHERE user_id=?", user);
    return rows.isEmpty()
        ? Map.of("user_id", user, "exp", 0L, "rating", 1000, "ranked_games", 0)
        : rows.getFirst();
  }
}
