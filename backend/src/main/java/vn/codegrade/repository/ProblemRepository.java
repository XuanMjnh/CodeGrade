package vn.codegrade.repository;

import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ProblemRepository extends JdbcRepository {
  public ProblemRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public List<Map<String, Object>> listCategories() {
    return jdbc.queryForList("SELECT * FROM categories ORDER BY name");
  }

  public int countCategory(String id) {
    return jdbc.queryForObject("SELECT COUNT(*) FROM categories WHERE id=?", Integer.class, id);
  }

  public int updateCategory(String name, String description, String id) {
    return jdbc.update(
        "UPDATE categories SET name=?,description=? WHERE id=?", name, description, id);
  }

  public int insertCategory(String id, String name, String description) {
    return jdbc.update(
        "INSERT INTO categories(id,name,description) VALUES(?,?,?)", id, name, description);
  }

  public Map<String, Object> findPublicNumber(String problemId) {
    return one("SELECT number FROM problem_numbers WHERE problem_id=?", problemId);
  }

  public Map<String, Object> findDocument(String id) {
    return one(
        "SELECT p.document,n.number AS public_number FROM problems p JOIN problem_numbers n ON"
            + " n.problem_id=p.id WHERE p.id=?",
        id);
  }

  public Map<String, Object> findOwner(String id) {
    return one("SELECT author_id FROM problems WHERE id=?", id);
  }

  public List<String> findSolvedProblemIds(String userId) {
    return jdbc.queryForList("SELECT problem_id FROM solved WHERE user_id=?", String.class, userId);
  }

  public List<Map<String, Object>> listProblemSummaries(
      String user, boolean admin, int difficulty, String category) {
    return jdbc.query(
        """
        SELECT p.id,p.author_id,p.title,p.difficulty,p.status,p.survival,p.version,p.category_id,
               c.name AS category,n.number AS public_number,
               b.user_id IS NOT NULL AS starred,s.user_id IS NOT NULL AS solved
        FROM problems p JOIN categories c ON c.id=p.category_id
        JOIN problem_numbers n ON n.problem_id=p.id
        LEFT JOIN bookmarks b ON b.problem_id=p.id AND b.user_id=?
        LEFT JOIN solved s ON s.problem_id=p.id AND s.user_id=?
        WHERE (p.status='ready' OR ?=TRUE OR p.author_id=?)
          AND (?<=0 OR p.difficulty=?) AND (?='' OR p.category_id=?)
        ORDER BY p.created_at DESC
        """,
        (rs, index) -> {
          var row = new org.springframework.jdbc.core.ColumnMapRowMapper().mapRow(rs, index);
          row.put("starred", rs.getBoolean("starred"));
          row.put("solved", rs.getBoolean("solved"));
          return row;
        },
        user,
        user,
        admin,
        user,
        difficulty,
        difficulty,
        category,
        category);
  }

  public Map<String, Object> requireCategory(String id) {
    return one("SELECT id FROM categories WHERE id=?", id);
  }

  public Map<String, Object> findVersion(String id) {
    return one("SELECT version FROM problems WHERE id=?", id);
  }

  public int insertProblem(
      String id,
      String authorId,
      String categoryId,
      String title,
      int difficulty,
      String status,
      boolean survival,
      long version,
      String document,
      long createdAt) {
    return jdbc.update(
        "INSERT INTO"
            + " problems(id,author_id,category_id,title,difficulty,status,survival,version,document,created_at)"
            + " VALUES(?,?,?,?,?,?,?,?,?,?)",
        id,
        authorId,
        categoryId,
        title,
        difficulty,
        status,
        survival,
        version,
        document,
        createdAt);
  }

  public int updateProblem(
      String categoryId,
      String title,
      int difficulty,
      String status,
      boolean survival,
      long version,
      String document,
      String id) {
    return jdbc.update(
        "UPDATE problems SET"
            + " category_id=?,title=?,difficulty=?,status=?,survival=?,version=?,document=? WHERE"
            + " id=?",
        categoryId,
        title,
        difficulty,
        status,
        survival,
        version,
        document,
        id);
  }

  public int allocatePublicNumber(String problemId) {
    return jdbc.update("INSERT INTO problem_numbers(problem_id) VALUES(?)", problemId);
  }

  public int countCategories() {
    return jdbc.queryForObject("SELECT COUNT(*) FROM categories", Integer.class);
  }

  public int insertDefaultCategory() {
    return jdbc.update(
        "INSERT INTO categories(id,name,description) VALUES('algorithms','Algorithms','Ngân hàng"
            + " thuật toán và lập trình')");
  }

  public List<String> findCategoryIds() {
    return jdbc.queryForList("SELECT id FROM categories", String.class);
  }

  public List<Map<String, Object>> listDocuments() {
    return jdbc.queryForList("SELECT document FROM problems");
  }

  public int insertSeedCategory(String id, String name, String description) {
    return jdbc.update("INSERT INTO categories VALUES(?,?,?)", id, name, description);
  }

  public int countSolve(String userId, String problemId) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM solved WHERE user_id=? AND problem_id=?",
        Integer.class,
        userId,
        problemId);
  }

  public int insertSolve(String userId, String problemId) {
    return jdbc.update("INSERT INTO solved(user_id,problem_id) VALUES(?,?)", userId, problemId);
  }

  public int updateValidatedDocument(String document, String id) {
    return jdbc.update("UPDATE problems SET document=? WHERE id=?", document, id);
  }

  public List<Map<String, Object>> findSurvivalCandidates() {
    return jdbc.queryForList(
        "SELECT document FROM problems WHERE status='ready' AND survival=TRUE");
  }
}
