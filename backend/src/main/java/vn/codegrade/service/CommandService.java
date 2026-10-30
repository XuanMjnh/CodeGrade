package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.springframework.stereotype.Service;
import vn.codegrade.model.DomainException;
import vn.codegrade.model.QuestionRules;
import vn.codegrade.model.User;
import vn.codegrade.repository.CommandRepository;
import vn.codegrade.repository.RoomRepository;
import vn.codegrade.support.ServiceContext;

@Service
public class CommandService {
  private final AuditService auditService;
  private final CommandRepository commandRepository;
  private final DraftService draftService;
  private final RoomRepository roomRepository;

  private final CommunityService community;
  private final ServiceContext db;
  private final IdentityService identity;
  private final ProblemService catalog;
  private final SurvivalService rooms;
  private final SubmissionService submissions;
  private final ContestService contests;
  private final MatchmakingService matchmaking;
  private final ProgressionService progression;
  private static final Set<String> READ =
      Set.of(
          "COMMENTS",
          "ANNOUNCEMENTS",
          "ME",
          "CATEGORIES",
          "PROBLEMS",
          "QUESTION_GET",
          "QUESTION_EDIT",
          "LEADERBOARD",
          "PROBLEM_RANKING",
          "SUBMISSIONS",
          "SUBMISSIONS_PAGE",
          "SUBMISSION_GET",
          "ROOM_LIST",
          "ROOM_SNAPSHOT",
          "CONTEST_LIST",
          "CONTEST_GET",
          "USERS",
          "SYNC",
          "DRAFT_GET",
          "AUDIT",
          "MATCH_QUEUE_STATUS",
          "MATCH_SNAPSHOT",
          "PROGRESSION_GET",
          "RANKED_LEADERBOARD",
          "MATCH_HISTORY",
          "REWARD_HISTORY");

  public CommandService(
      ServiceContext db,
      IdentityService identity,
      ProblemService catalog,
      SurvivalService rooms,
      SubmissionService submissions,
      ContestService contests,
      CommunityService community,
      MatchmakingService matchmaking,
      ProgressionService progression,
      AuditService auditService,
      CommandRepository commandRepository,
      DraftService draftService,
      RoomRepository roomRepository) {
    this.auditService = auditService;
    this.commandRepository = commandRepository;
    this.draftService = draftService;
    this.roomRepository = roomRepository;
    this.matchmaking = matchmaking;
    this.progression = progression;
    this.community = community;
    this.db = db;
    this.identity = identity;
    this.catalog = catalog;
    this.rooms = rooms;
    this.submissions = submissions;
    this.contests = contests;
  }

  public Object execute(User user, String type, JsonNode p, String requestId) {
    java.util.function.Supplier<Object> action =
        () -> {
          User u = identity.user(user.id());
          if (type.equals("RECEIPT_GET"))
            throw new DomainException("TYPE", "Lệnh biên nhận đã được loại bỏ");
          String fingerprint = ServiceContext.hash(type + canonical(p));
          boolean mutate = !READ.contains(type);
          if (mutate) {
            var previous = commandRepository.findResponse(u.id(), requestId);
            if (!previous.isEmpty()) {
              require(
                  previous.getFirst().get("fingerprint").equals(fingerprint),
                  "Request ID đã dùng cho nội dung khác");
              return withoutProofs(db.read((String) previous.getFirst().get("response")));
            }
          }
          Object result =
              switch (type) {
                case "PROFILE_SAVE",
                        "BOOKMARK_SET",
                        "COMMENTS",
                        "COMMENT_ADD",
                        "ANNOUNCEMENTS",
                        "ANNOUNCEMENT_ADD" ->
                    community.command(u, type, p);
                case "PROGRESSION_GET" -> progression.get(u.id());
                case "RANKED_LEADERBOARD" -> progression.leaderboard();
                case "MATCH_HISTORY" -> progression.history(u.id());
                case "REWARD_HISTORY" -> progression.rewards(u.id());
                case "ME" -> u;
                case "PASSWORD_CHANGE" -> identity.changePassword(u, p);
                case "CATEGORIES" -> catalog.categories();
                case "CATEGORY_SAVE" -> catalog.categorySave(u, p);
                case "PROBLEMS" -> catalog.list(u, p);
                case "QUESTION_GET" -> catalog.get(u, p.path("id").asText(), false);
                case "QUESTION_EDIT" -> catalog.get(u, p.path("id").asText(), true);
                case "QUESTION_SAVE" -> saveQuestion(u, p, requestId);
                case "QUESTION_VALIDATE" -> {
                  var q = catalog.document(p.path("id").asText());
                  require(
                      catalog.canEdit(u, p.path("id").asText()), "Không có quyền chạy đáp án mẫu");
                  require(
                      !q.path("answer").path("sampleAnswer").asText().isBlank(),
                      "Chưa có đáp án mẫu");
                  yield submissions.accept(u, samplePayload(q), requestId, "VALIDATE");
                }
                case "LEADERBOARD" -> catalog.leaderboard(p.path("metric").asText());
                case "PROBLEM_RANKING" ->
                    submissions.problemRanking(u, p.path("problemId").asText());
                case "SUBMIT" -> submissions.accept(u, p, requestId, "OFFICIAL");
                case "PRECHECK" -> submissions.accept(u, p, requestId, "PRECHECK");
                case "RUN_EXAMPLES" -> submissions.accept(u, p, requestId, "EXAMPLES");
                case "SUBMISSIONS" -> submissions.list(u);
                case "SUBMISSIONS_PAGE" -> submissions.page(u, p);
                case "SUBMISSION_GET" -> submissions.detail(u, p.path("id").asText());
                case "DRAFT_SAVE" -> draftService.save(u, p);
                case "DRAFT_CLEAR" -> draftService.clear(u, p.path("problemId").asText());
                case "DRAFT_GET" -> draftService.get(u, p.path("problemId").asText());
                case "USERS", "USER_SET" -> identity.admin(u, type, p);
                case "AUDIT" -> auditService.list(u, p.path("summaryOnly").asBoolean(false));
                case "SYNC" -> sync(u);
                default -> {
                  if (type.startsWith("MATCH_")) yield matchmaking.command(u, type, p);
                  if (type.startsWith("ROOM_")) yield rooms.command(u, type, p);
                  if (type.startsWith("CONTEST_")) yield contests.command(u, type, p);
                  throw new DomainException("TYPE", "Message type không được hỗ trợ");
                }
              };
          if (mutate)
            commandRepository.saveResponse(
                u.id(), requestId, fingerprint, db.write(result), db.now());
          return result;
        };
    boolean read =
        READ.contains(type) && !Set.of("MATCH_QUEUE_STATUS", "MATCH_SNAPSHOT").contains(type);
    return read ? db.readOnly(action) : db.atomic(action);
  }

  private Object saveQuestion(User u, JsonNode p, String requestId) {
    ObjectNode saved = (ObjectNode) catalog.save(u, p);
    if (saved.path("answer").path("validateOnSave").asBoolean()
        && !saved.path("answer").path("sampleAnswer").asText().isBlank()) {
      try {
        QuestionRules.executable(saved);
        saved.set(
            "sampleValidation",
            db.tree(
                submissions.accept(
                    u,
                    samplePayload(saved),
                    ServiceContext.hash(requestId) + ":sample",
                    "VALIDATE")));
      } catch (DomainException e) {
        saved.put("validationNotice", e.getMessage());
      }
    }
    return saved;
  }

  private ObjectNode samplePayload(JsonNode q) {
    return db.obj()
        .put("problemId", q.path("id").asText())
        .put(
            "language",
            q.path("answer").path("language").asText(q.path("languages").get(0).asText()))
        .put("source", q.path("answer").path("sampleAnswer").asText());
  }

  public Object sync(User u) {
    var mine = new ArrayList<Object>();
    for (var row : roomRepository.findMemberRooms(u.id())) {
      var r = (ObjectNode) db.read((String) row.get("document"));
      for (var m : r.path("players"))
        if (m.path("id").asText().equals(u.id())) mine.add(rooms.publicState(r));
    }
    return Map.of(
        "user",
        u,
        "rooms",
        mine,
        "matchmaking",
        matchmaking.snapshot(u.id()),
        "progression",
        progression.get(u.id()),
        "submissions",
        submissions.list(u),
        "serverTime",
        db.now());
  }

  public static JsonNode withoutProofs(JsonNode n) {
    if (n.isObject()) {
      ((ObjectNode) n).remove(List.of("receipt", "certificate"));
      n.elements().forEachRemaining(CommandService::withoutProofs);
    } else if (n.isArray()) n.elements().forEachRemaining(CommandService::withoutProofs);
    return n;
  }

  public String canonical(JsonNode n) {
    if (n.isObject()) {
      var map = new TreeMap<String, Object>();
      n.fields().forEachRemaining(e -> map.put(e.getKey(), db.read(canonical(e.getValue()))));
      return db.write(map);
    }
    if (n.isArray()) {
      var a = new ArrayList<Object>();
      for (var x : n) a.add(db.read(canonical(x)));
      return db.write(a);
    }
    return db.write(n);
  }
}
