package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SubmissionRepository extends JdbcRepository {
  public SubmissionRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public List<Map<String, Object>> findContestAttempts(String contestId) {
    return jdbc.queryForList(
        "SELECT user_id,problem_id,score,status,received_at FROM submissions WHERE contest_id=? AND"
            + " mode='OFFICIAL' AND status NOT IN ('QUEUED','RUNNING','SE') ORDER BY"
            + " received_at,admission_order",
        contestId);
  }

  public int countPendingContest(String contestId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM submissions WHERE contest_id=? AND status IN ('QUEUED','RUNNING')",
        Integer.class,
        contestId);
  }

  public int insertValidation(
      String id,
      String userId,
      String problemId,
      String requestId,
      String sourceCode,
      String language,
      String mode,
      long receivedAt,
      String status,
      String snapshot) {
    return jdbc.update(
        "INSERT INTO"
            + " submissions(id,user_id,problem_id,request_id,source_code,language,mode,received_at,status,snapshot)"
            + " VALUES(?,?,?,?,?,?,?,?,?,?)",
        id,
        userId,
        problemId,
        requestId,
        sourceCode,
        language,
        mode,
        receivedAt,
        status,
        snapshot);
  }

  public int countPending() {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM submissions WHERE status IN ('QUEUED','RUNNING')", Integer.class);
  }

  public int countPendingByUser(String userId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM submissions WHERE user_id=? AND status IN ('QUEUED','RUNNING')",
        Integer.class,
        userId);
  }

  public long nextAdmissionOrder() {
    // Called under the competition transaction lock: O(1), independent of history size.
    jdbc.update("UPDATE submission_sequence SET next_value=next_value+1 WHERE id=1");
    return jdbc.queryForObject("SELECT next_value FROM submission_sequence WHERE id=1", Long.class);
  }

  public int insertSubmission(
      String id,
      String userId,
      String problemId,
      String requestId,
      String sourceCode,
      String language,
      String mode,
      String roomId,
      String roundId,
      String contestId,
      long receivedAt,
      String status,
      String snapshot,
      boolean rankEligible,
      long admissionOrder) {
    return jdbc.update(
        "INSERT INTO"
            + " submissions(id,user_id,problem_id,request_id,source_code,language,mode,room_id,round_id,contest_id,received_at,status,snapshot,rank_eligible,admission_order)"
            + " VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        id,
        userId,
        problemId,
        requestId,
        sourceCode,
        language,
        mode,
        roomId,
        roundId,
        contestId,
        receivedAt,
        status,
        snapshot,
        rankEligible,
        admissionOrder);
  }

  public List<Map<String, Object>> listRecentByUser(String userId) {
    return jdbc.queryForList(
        "SELECT"
            + " s.id,s.problem_id,p.title,s.language,s.mode,s.room_id,s.round_id,s.contest_id,s.received_at,s.status,s.score,s.current_test,s.completed_tests,s.total_tests"
            + " FROM submissions s JOIN problems p ON p.id=s.problem_id WHERE s.user_id=? ORDER BY"
            + " s.received_at DESC,s.admission_order DESC,s.id DESC LIMIT 100",
        userId);
  }

  public long countHistory(String filter, String userId) {
    String condition = historyCondition(filter);
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM submissions s WHERE s.user_id=?" + condition, Long.class, userId);
  }

  public List<Map<String, Object>> findHistoryPage(
      String filter, String userId, int limit, long offset) {
    String condition = historyCondition(filter);
    return jdbc.queryForList(
        "SELECT"
            + " s.id,s.problem_id,p.title,s.language,s.mode,s.room_id,s.round_id,s.contest_id,s.received_at,s.status,s.score,s.current_test,s.completed_tests,s.total_tests"
            + " FROM submissions s JOIN problems p ON p.id=s.problem_id WHERE s.user_id=?"
            + condition
            + " ORDER BY s.received_at DESC,s.admission_order DESC,s.id DESC LIMIT ? OFFSET ?",
        userId,
        limit,
        offset);
  }

  public List<Map<String, Object>> findAcceptedProblemAttempts(String problemId) {
    return jdbc.queryForList(
        "SELECT"
            + " s.id,s.user_id,u.username,u.display_name,s.language,s.received_at,s.result,CHAR_LENGTH(s.source_code)"
            + " AS source_length FROM submissions s JOIN users u ON u.id=s.user_id WHERE"
            + " s.problem_id=? AND s.mode='OFFICIAL' AND s.status='AC' AND s.rank_eligible=TRUE AND"
            + " u.role='CODER' AND u.enabled=TRUE",
        problemId);
  }

  public Map<String, Object> findById(String id) {
    return one("SELECT * FROM submissions WHERE id=?", id);
  }

  public List<Map<String, Object>> findNextQueued(long receivedAt) {
    return jdbc.queryForList(
        "SELECT * FROM submissions WHERE status='QUEUED' ORDER BY CASE WHEN mode='VALIDATE' THEN 3"
            + " WHEN received_at<? THEN 0 WHEN round_id IS NOT NULL THEN 1 ELSE 2"
            + " END,received_at,admission_order LIMIT 1",
        receivedAt);
  }

  public int acquireLease(
      String workerId, String leaseToken, long leaseUntil, int totalTests, String id) {
    return jdbc.update(
        "UPDATE submissions SET"
            + " status='RUNNING',worker_id=?,lease_token=?,lease_until=?,attempts=attempts+1,current_test=0,completed_tests=0,total_tests=?"
            + " WHERE id=?",
        workerId,
        leaseToken,
        leaseUntil,
        totalTests,
        id);
  }

  public int renewLease(long leaseUntil, String id, String workerId, String leaseToken) {
    return jdbc.update(
        "UPDATE submissions SET lease_until=? WHERE id=? AND worker_id=? AND lease_token=? AND"
            + " status='RUNNING'",
        leaseUntil,
        id,
        workerId,
        leaseToken);
  }

  public List<Map<String, Object>> findActiveLease(
      String id, String workerId, String leaseToken, long leaseUntil) {
    return jdbc.queryForList(
        "SELECT user_id,current_test,completed_tests,total_tests FROM submissions WHERE id=? AND"
            + " worker_id=? AND lease_token=? AND status='RUNNING' AND lease_until>=?",
        id,
        workerId,
        leaseToken,
        leaseUntil);
  }

  public int updateProgress(int currentTest, int completedTests, long leaseUntil, String id) {
    return jdbc.update(
        "UPDATE submissions SET current_test=?,completed_tests=?,lease_until=? WHERE id=?",
        currentTest,
        completedTests,
        leaseUntil,
        id);
  }

  public int requeue(String id) {
    return jdbc.update(
        "UPDATE submissions SET"
            + " status='QUEUED',current_test=0,completed_tests=0,lease_token=NULL,lease_until=NULL"
            + " WHERE id=?",
        id);
  }

  public int completeSubmission(
      String status, double score, String result, long completedAt, int completedTests, String id) {
    return jdbc.update(
        "UPDATE submissions SET"
            + " status=?,score=?,result=?,completed_at=?,completed_tests=?,lease_token=NULL,lease_until=NULL"
            + " WHERE id=?",
        status,
        score,
        result,
        completedAt,
        completedTests,
        id);
  }

  public List<Map<String, Object>> findExpiredLeases(long leaseUntil) {
    return jdbc.queryForList(
        "SELECT * FROM submissions WHERE status='RUNNING' AND lease_until<?", leaseUntil);
  }

  public List<Map<String, Object>> findRoundAttempts(String roundId) {
    return jdbc.queryForList(
        "SELECT user_id,status,score,received_at FROM submissions WHERE round_id=? AND"
            + " mode='OFFICIAL' ORDER BY received_at,admission_order",
        roundId);
  }

  public int countOfficialRoundAttempts(String userId, String roundId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM submissions WHERE user_id=? AND round_id=? AND mode='OFFICIAL' AND"
            + " status<>'SE'",
        Integer.class,
        userId,
        roundId);
  }

  public int countRoundInfrastructureFailures(String roundId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM submissions WHERE round_id=? AND mode='OFFICIAL' AND status='SE'",
        Integer.class,
        roundId);
  }

  public List<Map<String, Object>> findRoundAccepted(String roundId) {
    return jdbc.queryForList(
        "SELECT user_id,received_at FROM submissions WHERE round_id=? AND mode='OFFICIAL' AND"
            + " status='AC' ORDER BY received_at,admission_order",
        roundId);
  }

  public int countEarlierPending(String roundId, long receivedAt) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM submissions WHERE round_id=? AND mode='OFFICIAL' AND status IN"
            + " ('QUEUED','RUNNING') AND received_at<=?",
        Integer.class,
        roundId,
        receivedAt);
  }

  public List<Map<String, Object>> findRoundParticipants(String roundId) {
    return jdbc.queryForList(
        "SELECT DISTINCT user_id FROM submissions WHERE round_id=? AND mode='OFFICIAL' AND"
            + " status<>'SE'",
        roundId);
  }

  public int countPendingRound(String roundId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM submissions WHERE round_id=? AND mode='OFFICIAL' AND status IN"
            + " ('QUEUED','RUNNING')",
        Integer.class,
        roundId);
  }

  private String historyCondition(String filter) {
    return switch (filter) {
      case "all" -> "";
      case "pending" -> " AND s.status IN ('QUEUED','RUNNING')";
      case "ac" -> " AND s.status='AC'";
      case "other" -> " AND s.status NOT IN ('AC','QUEUED','RUNNING','SE')";
      default -> throw new IllegalArgumentException("Unknown submission history filter");
    };
  }
}
