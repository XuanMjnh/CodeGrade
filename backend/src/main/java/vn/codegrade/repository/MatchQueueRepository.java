package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class MatchQueueRepository extends JdbcRepository {
  public MatchQueueRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public int countActiveMembership(String userId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM match_queue WHERE user_id=? AND state IN"
            + " ('WAITING','MATCH_FOUND','ACCEPTED','STARTED')",
        Integer.class,
        userId);
  }

  public int deleteEntry(String userId) {
    return jdbc.update("DELETE FROM match_queue WHERE user_id=?", userId);
  }

  public int insertEntry(
      String userId,
      String mode,
      String state,
      long joinedAt,
      long lastSeen,
      int rating,
      int playerLevel) {
    return jdbc.update(
        "INSERT INTO match_queue(user_id,mode,state,joined_at,last_seen,rating,player_level)"
            + " VALUES(?,?,?,?,?,?,?)",
        userId,
        mode,
        state,
        joinedAt,
        lastSeen,
        rating,
        playerLevel);
  }

  public int touchUser(long lastSeen, String userId) {
    return jdbc.update("UPDATE match_queue SET last_seen=? WHERE user_id=?", lastSeen, userId);
  }

  public List<Map<String, Object>> findByUser(String userId) {
    return jdbc.queryForList("SELECT * FROM match_queue WHERE user_id=?", userId);
  }

  public int cancelUser(String userId) {
    return jdbc.update("UPDATE match_queue SET state='CANCELLED' WHERE user_id=?", userId);
  }

  public int acceptMatch(long lastSeen, String userId) {
    return jdbc.update(
        "UPDATE match_queue SET state='ACCEPTED',last_seen=? WHERE user_id=?", lastSeen, userId);
  }

  public int countFreshAccepted(String roomId, long lastSeen) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM match_queue WHERE room_id=? AND state='ACCEPTED' AND last_seen>=?",
        Integer.class,
        roomId,
        lastSeen);
  }

  public int startMatch(String roomId) {
    return jdbc.update("UPDATE match_queue SET state='STARTED' WHERE room_id=?", roomId);
  }

  public int countWaiting(String mode, long lastSeen) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM match_queue WHERE mode=? AND state='WAITING' AND last_seen>=?",
        Integer.class,
        mode,
        lastSeen);
  }

  public int countAccepted(String roomId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM match_queue WHERE room_id=? AND state IN ('ACCEPTED','STARTED')",
        Integer.class,
        roomId);
  }

  public List<Map<String, Object>> findWaitingCandidates(String mode, long lastSeen) {
    return jdbc.queryForList(
        "SELECT q.* FROM match_queue q JOIN users u ON u.id=q.user_id WHERE q.mode=? AND"
            + " q.state='WAITING' AND q.last_seen>=? AND u.role='CODER' AND u.enabled=TRUE ORDER BY"
            + " q.joined_at,q.user_id",
        mode,
        lastSeen);
  }

  public int assignMatch(String roomId, String userId) {
    return jdbc.update(
        "UPDATE match_queue SET state='MATCH_FOUND',room_id=? WHERE user_id=? AND state='WAITING'",
        roomId,
        userId);
  }

  public List<Map<String, Object>> findRoomMembers(String roomId) {
    return jdbc.queryForList("SELECT user_id,last_seen FROM match_queue WHERE room_id=?", roomId);
  }

  public int resetEntry(String state, String userId) {
    return jdbc.update(
        "UPDATE match_queue SET state=?,room_id=NULL WHERE user_id=?", state, userId);
  }

  public int expireWaiting(long lastSeen) {
    return jdbc.update(
        "UPDATE match_queue SET state='EXPIRED' WHERE state='WAITING' AND last_seen<?", lastSeen);
  }

  public List<Map<String, Object>> findUnacceptedUsers(String roomId) {
    return jdbc.queryForList(
        "SELECT user_id FROM match_queue WHERE room_id=? AND state<>'ACCEPTED'", roomId);
  }

  public int completeMatch(String roomId) {
    return jdbc.update(
        "UPDATE match_queue SET state='COMPLETED' WHERE room_id=? AND state='STARTED'", roomId);
  }

  public int countFreshStarted(String roomId, long lastSeen) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM match_queue WHERE room_id=? AND state='STARTED' AND last_seen>=?",
        Integer.class,
        roomId,
        lastSeen);
  }

  public int requeueCancelledMatch(long lastSeen, String roomId) {
    return jdbc.update(
        "UPDATE match_queue SET state=CASE WHEN last_seen>=? THEN 'WAITING' ELSE 'EXPIRED'"
            + " END,room_id=NULL WHERE room_id=?",
        lastSeen,
        roomId);
  }
}
