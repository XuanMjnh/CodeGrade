package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RoomRepository extends JdbcRepository {
  private final com.fasterxml.jackson.databind.ObjectMapper json;

  public RoomRepository(JdbcTemplate jdbc, com.fasterxml.jackson.databind.ObjectMapper json) {
    super(jdbc);
    this.json = json;
  }

  public List<Map<String, Object>> listLockedRooms() {
    return jdbc.queryForList(
        "SELECT document FROM rooms WHERE state NOT IN ('LOBBY','FINISHED','CLOSED','UNRESOLVED')");
  }

  public List<Map<String, Object>> listOpenRooms() {
    return jdbc.queryForList(
        "SELECT r.document FROM rooms r WHERE r.state NOT IN ('FINISHED','CLOSED','UNRESOLVED')"
            + " AND EXISTS (SELECT 1 FROM room_members m WHERE m.room_id=r.id AND m.status='ALIVE')"
            + " ORDER BY r.updated_at DESC LIMIT 100");
  }

  public List<Map<String, Object>> listActiveRooms() {
    return jdbc.queryForList(
        "SELECT id,document FROM rooms WHERE state NOT IN ('FINISHED','CLOSED','UNRESOLVED')");
  }

  public List<Map<String, Object>> listPendingRooms() {
    return jdbc.queryForList("SELECT document FROM rooms WHERE state IN ('LOBBY','COUNTDOWN')");
  }

  public Map<String, Object> findByIdOrCode(String id, String inviteCode) {
    return one("SELECT document FROM rooms WHERE id=? OR invite_code=?", id, inviteCode);
  }

  public int updateRoom(String state, long version, String document, long updatedAt, String id) {
    int changed =
        jdbc.update(
            "UPDATE rooms SET state=?,version=?,document=?,updated_at=? WHERE id=?",
            state,
            version,
            document,
            updatedAt,
            id);
    synchronize(id, document);
    return changed;
  }

  public int countInviteCode(String inviteCode) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM rooms WHERE invite_code=?", Integer.class, inviteCode);
  }

  public int insertRoom(
      String id, String inviteCode, String state, long version, String document, long updatedAt) {
    int changed =
        jdbc.update(
            "INSERT INTO rooms(id,invite_code,state,version,document,updated_at)"
                + " VALUES(?,?,?,?,?,?)",
            id,
            inviteCode,
            state,
            version,
            document,
            updatedAt);
    synchronize(id, document);
    return changed;
  }

  public int deletePresence(String roomId, String userId) {
    return jdbc.update("DELETE FROM room_presence WHERE room_id=? AND user_id=?", roomId, userId);
  }

  public int insertPresence(String roomId, String userId, long lastSeen) {
    return jdbc.update("INSERT INTO room_presence VALUES(?,?,?)", roomId, userId, lastSeen);
  }

  public List<Map<String, Object>> findRoomDocument(String id) {
    return jdbc.queryForList("SELECT document FROM rooms WHERE id=?", id);
  }

  public List<Map<String, Object>> listPlayingRooms() {
    return jdbc.queryForList(
        "SELECT document FROM rooms WHERE state IN"
            + " ('ROUND_ACTIVE','ROUND_GRADING','ROUND_RESULT')");
  }

  public List<Map<String, Object>> findPresence(String roomId, String userId) {
    return jdbc.queryForList(
        "SELECT last_seen FROM room_presence WHERE room_id=? AND user_id=?", roomId, userId);
  }

  public Map<String, Long> findPresences(String room) {
    var presence = new HashMap<String, Long>();
    for (var row :
        jdbc.queryForList("SELECT user_id,last_seen FROM room_presence WHERE room_id=?", room))
      presence.put((String) row.get("user_id"), ((Number) row.get("last_seen")).longValue());
    return presence;
  }

  public List<Map<String, Object>> findTickableRoomIds() {
    return jdbc.queryForList(
        "SELECT id FROM rooms WHERE state IN"
            + " ('COUNTDOWN','ROUND_ACTIVE','ROUND_GRADING','ROUND_RESULT')");
  }

  public boolean hasAliveMembership(String user, String exceptRoom) {
    return jdbc.queryForObject(
            "SELECT COUNT(*) FROM room_members m JOIN rooms r ON r.id=m.room_id WHERE m.user_id=?"
                + " AND m.status='ALIVE' AND r.id<>? AND r.state NOT IN"
                + " ('FINISHED','CLOSED','UNRESOLVED')",
            Integer.class,
            user,
            exceptRoom)
        > 0;
  }

  public boolean isProblemLocked(String problem) {
    return jdbc.queryForObject(
            "SELECT COUNT(*) FROM room_problem_bank b JOIN rooms r ON r.id=b.room_id WHERE"
                + " b.problem_id=? AND r.state NOT IN ('LOBBY','FINISHED','CLOSED','UNRESOLVED')",
            Integer.class,
            problem)
        > 0;
  }

  public List<Map<String, Object>> findMemberRooms(String user) {
    return jdbc.queryForList(
        "SELECT r.document FROM rooms r JOIN room_members m ON m.room_id=r.id WHERE m.user_id=?"
            + " ORDER BY r.updated_at DESC LIMIT 100",
        user);
  }

  private void synchronize(String id, String document) {
    var room = DocumentRelations.read(json, document);
    var members = new LinkedHashMap<String, String>();
    for (var player : room.path("players"))
      members.put(player.path("id").asText(), player.path("status").asText());
    DocumentRelations.synchronize(jdbc, "room_members", "room_id", id, "user_id", members, true);
    var problems = new LinkedHashMap<String, String>();
    for (var problem : room.path("bank")) problems.put(problem.path("id").asText(), "");
    for (var problem : room.path("used")) problems.put(problem.asText(), "");
    DocumentRelations.synchronize(
        jdbc, "room_problem_bank", "room_id", id, "problem_id", problems, false);
  }
}
