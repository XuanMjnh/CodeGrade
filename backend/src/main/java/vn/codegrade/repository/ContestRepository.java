package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ContestRepository extends JdbcRepository {
  private final com.fasterxml.jackson.databind.ObjectMapper json;

  public ContestRepository(JdbcTemplate jdbc, com.fasterxml.jackson.databind.ObjectMapper json) {
    super(jdbc);
    this.json = json;
  }

  public List<Map<String, Object>> listDocuments() {
    return jdbc.queryForList("SELECT document FROM contests");
  }

  public int insertContest(String id, String authorId, String document) {
    var contest = DocumentRelations.read(json, document);
    int changed =
        jdbc.update(
            "INSERT INTO contests(id,author_id,title,starts_at,ends_at,rated,settled,document)"
                + " VALUES(?,?,?,?,?,?,?,?)",
            id,
            authorId,
            contest.path("title").asText(),
            contest.path("startsAt").asLong(),
            contest.path("endsAt").asLong(),
            contest.path("rated").asBoolean(),
            contest.path("settled").asBoolean(),
            document);
    synchronize(id, contest);
    return changed;
  }

  public Map<String, Object> findDocument(String id) {
    return one("SELECT document FROM contests WHERE id=?", id);
  }

  public int updateDocument(String document, String id) {
    var contest = DocumentRelations.read(json, document);
    int changed =
        jdbc.update(
            "UPDATE contests SET title=?,starts_at=?,ends_at=?,rated=?,settled=?,document=? WHERE"
                + " id=?",
            contest.path("title").asText(),
            contest.path("startsAt").asLong(),
            contest.path("endsAt").asLong(),
            contest.path("rated").asBoolean(),
            contest.path("settled").asBoolean(),
            document,
            id);
    synchronize(id, contest);
    return changed;
  }

  public List<Map<String, Object>> findDue(long now) {
    return jdbc.queryForList(
        "SELECT document FROM contests WHERE settled=FALSE AND ends_at<?", now);
  }

  public boolean hasActiveAccess(String user, String problem, long now) {
    return jdbc.queryForObject(
            "SELECT COUNT(*) FROM contest_problems p JOIN contests c ON c.id=p.contest_id JOIN"
                + " contest_registrations r ON r.contest_id=c.id WHERE p.problem_id=? AND"
                + " r.user_id=? AND r.status='ACCEPTED' AND c.starts_at<=? AND c.ends_at>=?",
            Integer.class,
            problem,
            user,
            now,
            now)
        > 0;
  }

  public boolean isProblemActive(String problem, long now) {
    return jdbc.queryForObject(
            "SELECT COUNT(*) FROM contest_problems p JOIN contests c ON c.id=p.contest_id WHERE"
                + " p.problem_id=? AND c.starts_at<=? AND c.ends_at>=?",
            Integer.class,
            problem,
            now,
            now)
        > 0;
  }

  private void synchronize(String id, com.fasterxml.jackson.databind.JsonNode contest) {
    var problems = new LinkedHashMap<String, String>();
    for (var problem : contest.path("problemIds")) problems.put(problem.asText(), "");
    DocumentRelations.synchronize(
        jdbc, "contest_problems", "contest_id", id, "problem_id", problems, false);
    var users = new LinkedHashMap<String, String>();
    for (var user : contest.path("pending")) users.put(user.asText(), "PENDING");
    for (var user : contest.path("participants")) users.put(user.asText(), "ACCEPTED");
    DocumentRelations.synchronize(
        jdbc, "contest_registrations", "contest_id", id, "user_id", users, true);
  }
}
