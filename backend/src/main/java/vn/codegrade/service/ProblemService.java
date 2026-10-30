package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.springframework.stereotype.Service;
import vn.codegrade.model.QuestionRules;
import vn.codegrade.model.User;
import vn.codegrade.repository.ContestRepository;
import vn.codegrade.repository.ProblemRepository;
import vn.codegrade.repository.RoomRepository;
import vn.codegrade.repository.UserRepository;
import vn.codegrade.support.ServiceContext;

@Service
public class ProblemService {
  private final ContestRepository contestRepository;
  private final ProblemRepository problemRepository;
  private final RoomRepository roomRepository;
  private final UserRepository userRepository;

  private final ServiceContext db;
  private final ProgressionService progression;

  public ProblemService(
      ServiceContext db,
      ProgressionService progression,
      ContestRepository contestRepository,
      ProblemRepository problemRepository,
      RoomRepository roomRepository,
      UserRepository userRepository) {
    this.contestRepository = contestRepository;
    this.problemRepository = problemRepository;
    this.roomRepository = roomRepository;
    this.userRepository = userRepository;
    this.db = db;
    this.progression = progression;
  }

  public List<Map<String, Object>> categories() {
    return problemRepository.listCategories();
  }

  public Object categorySave(User u, JsonNode p) {
    require(u.author(), "Cần role Admin hoặc Người tạo đề");
    String id = p.path("id").asText(db.id()),
        name = p.path("name").asText().trim(),
        desc = p.path("description").asText();
    require(
        !name.isBlank() && name.length() <= 100 && desc.length() <= 1000,
        "Tên category 1–100 ký tự, mô tả ≤1000 ký tự");
    if (problemRepository.countCategory(id) > 0) problemRepository.updateCategory(name, desc, id);
    else problemRepository.insertCategory(id, name, desc);
    db.event(null, "catalog_changed", Map.of("categoryId", id));
    return Map.of("id", id);
  }

  public static String publicId(long number) {
    return String.format(Locale.ROOT, "CG-%04d", number);
  }

  private String problemCode(String id) {
    return publicId(((Number) problemRepository.findPublicNumber(id).get("number")).longValue());
  }

  public JsonNode document(String id) {
    var stored = problemRepository.findDocument(id);
    ObjectNode q = (ObjectNode) db.read((String) stored.get("document"));
    q.put("publicId", publicId(((Number) stored.get("public_number")).longValue()));
    return q;
  }

  public boolean canEdit(User u, String id) {
    return u.admin()
        || (u.author() && problemRepository.findOwner(id).get("author_id").equals(u.id()));
  }

  public Object list(User u, JsonNode p) {
    var result = new ArrayList<Object>();
    String search = p.path("search").asText().toLowerCase(Locale.ROOT);
    for (var row :
        problemRepository.listProblemSummaries(
            u.id(), u.admin(), p.path("difficulty").asInt(), p.path("categoryId").asText())) {
      String code = publicId(((Number) row.remove("public_number")).longValue());
      row.put("publicId", code);
      if (!row.get("title").toString().toLowerCase(Locale.ROOT).contains(search)
          && !code.toLowerCase(Locale.ROOT).contains(search)) continue;
      result.add(row);
    }
    return result;
  }

  public Object get(User u, String id, boolean edit) {
    JsonNode q = document(id);
    if (edit) {
      require(canEdit(u, id), "Không có quyền sửa đề");
      return q;
    }
    require(
        q.path("general").path("status").asText().equals("ready")
            || canEdit(u, id)
            || contestRepository.hasActiveAccess(u.id(), id, db.now()),
        "Đề chưa công bố");
    return publicQuestion(q);
  }

  public ObjectNode publicQuestion(JsonNode q) {
    ObjectNode safe = db.obj();
    for (String k :
        List.of(
            "id",
            "publicId",
            "difficulty",
            "languages",
            "version",
            "answerboxlines",
            "precheck",
            "hidecheck",
            "giveupallowed",
            "displayfeedback")) safe.set(k, q.path(k));
    safe.set(
        "general",
        db.obj()
            .put("questionName", q.path("general").path("questionName").asText())
            .put("questionText", q.path("general").path("questionText").asText()));
    safe.put("preloadAnswer", q.path("answer").path("preloadAnswer").asText());
    ArrayNode examples = safe.putArray("examples");
    for (var t : QuestionRules.active(q))
      if (t.path("useasexample").asBoolean()) {
        ObjectNode e = db.obj();
        for (String k : List.of("testcode", "stdin", "expected")) e.set(k, t.path(k));
        examples.add(e);
      }
    return safe;
  }

  public Object save(User u, JsonNode payload) {
    require(u.author(), "Chỉ người tạo đề/admin được lưu câu hỏi");
    ObjectNode q = (ObjectNode) payload.deepCopy();
    // Validation provenance is server-owned. Import/clients cannot assert a sample was AC.
    q.remove(List.of("publicId", "validatedVersion", "sampleValidation", "validationNotice"));
    QuestionRules.validate(q);
    String category = q.path("general").path("categoryId").asText();
    problemRepository.requireCategory(category);
    String id = q.path("id").asText();
    int version = 1;
    if (!id.isBlank()) {
      require(canEdit(u, id), "Không có quyền sửa đề");
      version = ((Number) problemRepository.findVersion(id).get("version")).intValue() + 1;
      require(
          q.path("version").asInt() == version - 1,
          "Đề đã thay đổi ở tab khác; tải lại trước khi lưu");
      require(!roomRepository.isProblemLocked(id), "Problem is locked by an active match");
      require(
          !contestRepository.isProblemActive(id, db.now()),
          "Problem is locked by an active contest");
    } else id = db.id();
    q.put("id", id);
    q.put("version", version);
    String status = q.path("general").path("status").asText();
    if (version == 1)
      problemRepository.insertProblem(
          id,
          u.id(),
          category,
          q.path("general").path("questionName").asText(),
          q.path("difficulty").asInt(),
          status,
          q.path("survivalEligible").asBoolean(),
          version,
          db.write(q),
          db.now());
    else
      problemRepository.updateProblem(
          category,
          q.path("general").path("questionName").asText(),
          q.path("difficulty").asInt(),
          status,
          q.path("survivalEligible").asBoolean(),
          version,
          db.write(q),
          id);
    if (version == 1) problemRepository.allocatePublicNumber(id);
    q.put("publicId", problemCode(id));
    db.audit(u.id(), "QUESTION_SAVED", id, Map.of("version", version, "status", status));
    db.event(null, "catalog_changed", Map.of("problemId", id));
    return q;
  }

  public Object leaderboard(String metric) {
    // Aggregate each source before joining so solved problems cannot multiply match counts.
    // Contest Elo belongs to users; SurvivalService rank points and EXP belong to progression.
    var rows = userRepository.listLeaderboard(metric);
    for (var row : rows) {
      row.put("rank", progression.tier(((Number) row.get("rating")).intValue()));
      row.put("level", ProgressionService.level(((Number) row.get("exp")).longValue()));
    }
    return rows;
  }
}
