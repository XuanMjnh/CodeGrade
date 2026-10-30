package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.security.SecureRandom;
import java.util.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import vn.codegrade.model.DomainException;
import vn.codegrade.model.QuestionRules;
import vn.codegrade.model.RoundRanking;
import vn.codegrade.model.User;
import vn.codegrade.repository.MatchQueueRepository;
import vn.codegrade.repository.ProblemRepository;
import vn.codegrade.repository.RoomRepository;
import vn.codegrade.repository.SubmissionRepository;
import vn.codegrade.repository.UserRepository;
import vn.codegrade.support.ServiceContext;

@Service
public class SurvivalService {
  private final MatchQueueRepository matchQueueRepository;
  private final ProblemRepository problemRepository;
  private final RoomRepository roomRepository;
  private final SubmissionRepository submissionRepository;
  private final UserRepository userRepository;

  private final ServiceContext db;
  private final ProblemService catalog;
  private final IdentityService identity;
  private final ProgressionService progression;
  private final SecureRandom random = new SecureRandom();

  public SurvivalService(
      ServiceContext db,
      ProblemService catalog,
      IdentityService identity,
      ProgressionService progression,
      MatchQueueRepository matchQueueRepository,
      ProblemRepository problemRepository,
      RoomRepository roomRepository,
      SubmissionRepository submissionRepository,
      UserRepository userRepository) {
    this.matchQueueRepository = matchQueueRepository;
    this.problemRepository = problemRepository;
    this.roomRepository = roomRepository;
    this.submissionRepository = submissionRepository;
    this.userRepository = userRepository;
    this.db = db;
    this.catalog = catalog;
    this.identity = identity;
    this.progression = progression;
  }

  public ObjectNode load(String id) {
    return (ObjectNode)
        db.read(
            (String)
                roomRepository.findByIdOrCode(id, id.toUpperCase(Locale.ROOT)).get("document"));
  }

  private void save(ObjectNode r, String event) {
    if (Set.of("FINISHED", "UNRESOLVED", "CLOSED").contains(r.path("state").asText()))
      matchQueueRepository.completeMatch(r.path("id").asText());
    r.put("version", r.path("version").asLong() + 1);
    roomRepository.updateRoom(
        r.path("state").asText(),
        r.path("version").asLong(),
        db.write(r),
        db.now(),
        r.path("id").asText());
    // ServiceContext a private event per member; no source code or hidden tests in snapshots.
    var snapshot = publicState(r);
    for (var p : r.path("players")) db.event(p.path("id").asText(), event, snapshot);
    // Audit the observable transition without duplicating the entire private question bank.
    db.audit("server", event, r.path("id").asText(), snapshot);
  }

  public ObjectNode publicState(ObjectNode r) {
    ObjectNode out = r.deepCopy();
    out.remove(
        List.of("bank", "used", "frozenProblem", "baseRanks", "certificate", "initialRatings"));
    if (r.has("current") && r.path("current").has("problemId")) {
      out.set("problem", catalog.publicQuestion(r.path("frozenProblem")));
      out.set("liveStandings", liveStandings(r));
    }
    return out;
  }

  private ArrayNode liveStandings(ObjectNode r) {
    var current = r.path("current");
    var submissions = submissionRepository.findRoundAttempts(current.path("id").asText());
    var players = new ArrayList<String>();
    for (var uid : current.path("players")) players.add(uid.asText());
    var completed = new ArrayList<RoundRanking.Attempt>();
    for (var s : submissions)
      if (!Set.of("QUEUED", "RUNNING", "SE").contains((String) s.get("status")))
        completed.add(
            new RoundRanking.Attempt(
                (String) s.get("user_id"),
                (String) s.get("status"),
                ((Number) s.get("score")).doubleValue(),
                ((Number) s.get("received_at")).longValue()));
    var ranks = RoundRanking.rank(players, completed, current.path("startedAt").asLong());
    ArrayNode out = db.json.createArrayNode();
    int place = 0;
    RoundRanking.Rank previous = null;
    for (int i = 0; i < ranks.size(); i++) {
      var rank = ranks.get(i);
      if (previous == null || !RoundRanking.tied(previous, rank)) place = i + 1;
      ObjectNode entry = (ObjectNode) db.tree(rank);
      if (rank.attempts() > 0) entry.put("rank", place);
      else entry.putNull("rank");
      if (!rank.ac()) entry.putNull("effectiveMs");
      var attempts =
          submissions.stream().filter(s -> rank.userId().equals(s.get("user_id"))).toList();
      entry.put("attempts", attempts.stream().filter(s -> !"SE".equals(s.get("status"))).count());
      entry.put(
          "pending",
          attempts.stream()
              .filter(s -> Set.of("QUEUED", "RUNNING").contains(s.get("status")))
              .count());
      entry.put(
          "status",
          rank.ac()
              ? "AC"
              : attempts.isEmpty() ? "NOT_SUBMITTED" : (String) attempts.getLast().get("status"));
      out.add(entry);
      previous = rank;
    }
    return out;
  }

  private ObjectNode member(ObjectNode r, String uid) {
    for (var p : r.path("players")) if (p.path("id").asText().equals(uid)) return (ObjectNode) p;
    throw new DomainException("FORBIDDEN", "Bạn chưa tham gia phòng");
  }

  private List<String> alive(ObjectNode r) {
    var ids = new ArrayList<String>();
    for (var p : r.path("players"))
      if (p.path("status").asText().equals("ALIVE")) ids.add(p.path("id").asText());
    return ids;
  }

  private void levels(JsonNode a) {
    require(a.isArray() && !a.isEmpty(), "Cần chọn ít nhất một mức khó");
    Set<Integer> seen = new HashSet<>();
    for (var l : a)
      require(
          l.isIntegralNumber() && l.asInt() >= 1 && l.asInt() <= 6 && seen.add(l.asInt()),
          "Mức khó là tập con duy nhất của 1–6");
  }

  public Object command(User u, String type, JsonNode p) {
    if (type.equals("ROOM_LIST")) {
      var result = new ArrayList<Object>();
      for (var row : roomRepository.listOpenRooms()) {
        var r = (ObjectNode) db.read((String) row.get("document"));
        if (!r.path("mode").asText("PRACTICE").equals("PRACTICE")) continue;
        ObjectNode entry =
            db.obj()
                .put("id", r.path("id").asText())
                .put("code", r.path("code").asText())
                .put("state", r.path("state").asText())
                .put("hostName", r.path("hostName").asText())
                .put("count", alive(r).size())
                .put("capacity", r.path("capacity").asInt(10))
                .put("name", r.path("name").asText(r.path("hostName").asText()));
        entry.set("selectedDifficulties", r.path("selectedDifficulties"));
        result.add(entry);
      }
      return result;
    }
    if (type.equals("ROOM_CREATE")) {
      require(u.coder(), "Chỉ Coder tạo phòng Code SurvivalService");
      require(
          p.path("mode").asText("PRACTICE").equals("PRACTICE"),
          "Normal/Ranked chỉ tạo qua matchmaking");
      available(u.id(), "");
      int capacity = p.path("capacity").asInt(10);
      require(capacity >= 2 && capacity <= 10, "Sức chứa 2–10");
      String name = p.path("name").asText("Phòng của " + u.displayName()).trim();
      require(!name.isBlank() && name.length() <= 100, "Tên phòng 1–100 ký tự");
      JsonNode selected =
          p.has("selectedDifficulties")
              ? p.path("selectedDifficulties")
              : db.tree(List.of(1, 2, 3));
      levels(selected);
      ObjectNode r = db.obj();
      String id = db.id(), code;
      do {
        code = String.format("%08X", random.nextInt()).substring(0, 6);
      } while (roomRepository.countInviteCode(code) > 0);
      r.put("id", id)
          .put("code", code)
          .put("state", "LOBBY")
          .put("version", 0)
          .put("hostId", u.id())
          .put("hostName", u.displayName());
      r.put("mode", "PRACTICE").put("capacity", capacity).put("name", name);
      r.put("roundSeconds", 120).put("finalSeconds", 150);
      r.set("selectedDifficulties", selected.deepCopy());
      r.putArray("players").add(player(u, "ALIVE"));
      r.putArray("used");
      r.putArray("history");
      r.put("createdAt", db.now());
      roomRepository.insertRoom(id, code, "LOBBY", 0, db.write(r), db.now());
      touch(id, u.id());
      save(r, "room_created");
      return publicState(r);
    }
    ObjectNode r = load(p.path("roomId").asText());
    if (type.equals("ROOM_JOIN")) {
      if (!r.path("mode").asText("PRACTICE").equals("PRACTICE")) {
        member(r, u.id());
        touch(r.path("id").asText(), u.id());
        return publicState(r);
      }
      boolean exists = false;
      for (var player : r.path("players"))
        if (player.path("id").asText().equals(u.id())) exists = true;
      if (!exists) {
        boolean play =
            u.coder()
                && r.path("state").asText().equals("LOBBY")
                && alive(r).size() < r.path("capacity").asInt(10)
                && !p.path("spectate").asBoolean();
        require(r.path("players").size() < 100, "Phòng đã đủ số kết nối xem");
        if (play) available(u.id(), r.path("id").asText());
        r.withArray("players").add(player(u, play ? "ALIVE" : "SPECTATOR"));
        save(r, play ? "player_joined" : "spectator_joined");
      } else if (r.path("state").asText().equals("LOBBY")
          && u.coder()
          && member(r, u.id()).path("status").asText().equals("LEFT")
          && alive(r).size() < r.path("capacity").asInt(10)) {
        available(u.id(), r.path("id").asText());
        member(r, u.id()).put("status", "ALIVE");
        save(r, "player_joined");
      }
      if (!Set.of("LEFT", "FORFEIT").contains(member(r, u.id()).path("status").asText()))
        touch(r.path("id").asText(), u.id());
      return publicState(r);
    }
    ObjectNode me = member(r, u.id());
    if (type.equals("ROOM_TOUCH")) {
      require(!Set.of("LEFT", "FORFEIT").contains(me.path("status").asText()), "Bạn đã rời phòng");
      touch(r.path("id").asText(), u.id());
      return Map.of("present", true);
    }
    switch (type) {
      case "ROOM_SNAPSHOT":
        return publicState(r);
      case "ROOM_CONFIG":
        require(
            r.path("mode").asText("PRACTICE").equals("PRACTICE"),
            "Luật ghép trận do server quyết định");
        require(r.path("hostId").asText().equals(u.id()), "Chỉ host thay đổi cấu hình");
        require(r.path("state").asText().equals("LOBBY"), "Cấu hình đã khóa từ COUNTDOWN");
        int seconds = p.path("roundSeconds").asInt(r.path("roundSeconds").asInt(120)),
            fin = p.path("finalSeconds").asInt(r.path("finalSeconds").asInt(150));
        require(
            seconds >= 30 && seconds <= 3600 && fin >= 30 && fin <= 3600,
            "Time must be 30–3600 seconds");
        r.put("roundSeconds", seconds).put("finalSeconds", fin);
        levels(p.path("selectedDifficulties"));
        r.set("selectedDifficulties", p.path("selectedDifficulties"));
        int capacity = p.path("capacity").asInt(r.path("capacity").asInt(10));
        require(
            capacity >= Math.max(2, alive(r).size()) && capacity <= 10, "Sức chứa không hợp lệ");
        r.put("capacity", capacity);
        String name = p.path("name").asText(r.path("name").asText("Code SurvivalService"));
        require(!name.isBlank() && name.length() <= 100, "Tên phòng 1–100 ký tự");
        r.put("name", name);
        save(r, "room_difficulties_updated");
        break;
      case "ROOM_LEAVE":
        require(
            r.path("mode").asText("PRACTICE").equals("PRACTICE")
                || !Set.of("LOBBY", "COUNTDOWN").contains(r.path("state").asText()),
            "Dùng từ chối nhận trận trước khi bắt đầu");
        if (Set.of("FINISHED", "CLOSED", "UNRESOLVED").contains(r.path("state").asText()))
          return publicState(r);
        if (Set.of("LEFT", "FORFEIT").contains(me.path("status").asText())) return publicState(r);
        boolean wasAlive = me.path("status").asText().equals("ALIVE");
        if (wasAlive) me.put("eliminatedStage", r.path("history").size());
        roomRepository.deletePresence(r.path("id").asText(), u.id());
        me.put(
            "status", r.path("state").asText().equals("LOBBY") || !wasAlive ? "LEFT" : "FORFEIT");
        if (r.path("state").asText().equals("LOBBY") && r.path("hostId").asText().equals(u.id())) {
          var remaining = alive(r);
          if (remaining.isEmpty()) r.put("state", "CLOSED");
          else {
            r.put("hostId", remaining.getFirst());
            r.put("hostName", identity.historicalUser(remaining.getFirst()).displayName());
          }
        }
        boolean empty = true;
        for (var person : r.path("players"))
          if (!Set.of("LEFT", "FORFEIT").contains(person.path("status").asText())) empty = false;
        if (empty) {
          r.put("state", "UNRESOLVED").put("reason", "Mọi người đã bỏ cuộc");
          save(r, "match_unresolved");
          return publicState(r);
        }
        save(r, "player_left");
        break;
      case "ROOM_START":
        require(
            r.path("mode").asText("PRACTICE").equals("PRACTICE"),
            "Trận ghép tự bắt đầu sau 5 xác nhận");
        require(r.path("hostId").asText().equals(u.id()), "Chỉ host bắt đầu");
        begin(r);
        break;
      case "ROOM_INVALIDATE":
        require(u.admin(), "Chỉ admin hủy vòng có đề lỗi");
        require(
            Set.of("ROUND_ACTIVE", "ROUND_GRADING", "ROUND_RESULT")
                .contains(r.path("state").asText()),
            "Không có vòng để hủy");
        r.withArray("history")
            .add(db.obj().put("type", "INVALIDATED").set("round", r.path("current")));
        r.put("state", "ROUND_RESULT").put("nextKind", "RESCUE").put("nextAt", db.now() + 10_000);
        // Restore all players of the invalid round, including players eliminated at its cutoff.
        for (var uid : r.path("current").path("players")) {
          var m = member(r, uid.asText());
          if (!m.path("status").asText().equals("FORFEIT")) m.put("status", "ALIVE");
        }
        r.remove(List.of("tiePlayers", "qualified", "baseRanks", "tieSlots"));
        save(r, "round_invalidated");
        break;
      default:
        throw new DomainException("TYPE", "Lệnh phòng không hợp lệ");
    }
    return publicState(r);
  }

  private void available(String uid, String exceptRoom) {
    require(
        matchQueueRepository.countActiveMembership(uid) == 0, "Bạn đang ghép trận hoặc thi đấu");
    require(
        !roomRepository.hasAliveMembership(uid, exceptRoom),
        "User is already in another active room");
  }

  public ObjectNode createMatched(String mode, List<User> users, long deadline) {
    require(
        Set.of("NORMAL", "RANKED").contains(mode)
            && users.size() == 5
            && users.stream().map(User::id).distinct().count() == 5,
        "Cần đúng 5 Coder khác nhau");
    ObjectNode r =
        db.obj()
            .put("id", db.id())
            .put("code", db.id().substring(0, 8).toUpperCase(Locale.ROOT))
            .put("mode", mode)
            .put("capacity", 5)
            .put("state", "LOBBY")
            .put("version", 0)
            .put("hostId", "")
            .put("hostName", "Server")
            .put("name", mode)
            .put("roundSeconds", 120)
            .put("finalSeconds", 150)
            .put("acceptDeadline", deadline)
            .put("createdAt", db.now());
    r.set("selectedDifficulties", db.tree(List.of(1, 2, 3)));
    r.putArray("used");
    r.putArray("history");
    var players = r.putArray("players");
    ObjectNode ratings = r.putObject("initialRatings");
    for (var u : users) {
      require(u.coder(), "Chỉ CODER được ghép");
      players.add(player(u, "ALIVE"));
      ratings.put(u.id(), progression.get(u.id()).path("rating").asInt());
    }
    roomRepository.insertRoom(
        r.path("id").asText(), r.path("code").asText(), "LOBBY", 0, db.write(r), db.now());
    for (var u : users) touch(r.path("id").asText(), u.id());
    return r;
  }

  public void begin(ObjectNode r) {
    require(r.path("state").asText().equals("LOBBY"), "Phòng đã bắt đầu");
    int count = alive(r).size();
    boolean practice = r.path("mode").asText("PRACTICE").equals("PRACTICE");
    for (String uid : alive(r))
      require(identity.user(uid).coder(), "Người chơi phải là CODER đang hoạt động");
    require(
        practice ? count >= 2 && count <= r.path("capacity").asInt(10) : count == 5,
        "Practice cần 2–10; Normal/Ranked cần đúng 5 người");
    levels(r.path("selectedDifficulties"));
    var bank = eligible(r);
    int need = RoundRanking.mainRounds(count) + 1;
    require(
        bank.size() >= need,
        "Thiếu nguồn đề: cần " + need + " bài đã xác thực; hiện có " + bank.size());
    r.set("bank", db.tree(bank));
    r.set("participants", db.tree(alive(r)));
    r.put("lockedAt", db.now()).put("state", "COUNTDOWN").put("nextAt", db.now() + 10_000);
    save(r, "room_config_locked");
  }

  public void cancelMatched(ObjectNode r) {
    r.put("state", "CLOSED").put("reason", "Trận chưa đủ 5 người xác nhận");
    save(r, "match_cancelled");
  }

  private ObjectNode player(User u, String status) {
    return db.obj()
        .put("id", u.id())
        .put("name", u.displayName())
        .put("status", status)
        .put("joinedAt", db.now());
  }

  private void touch(String room, String user) {
    roomRepository.deletePresence(room, user);
    roomRepository.insertPresence(room, user, db.now());
  }

  private List<JsonNode> eligible(ObjectNode r) {
    Set<Integer> selected = new HashSet<>();
    for (var d : r.path("selectedDifficulties")) selected.add(d.asInt());
    List<JsonNode> out = new ArrayList<>();
    for (var row : problemRepository.findSurvivalCandidates()) {
      var q = db.read((String) row.get("document"));
      if (!selected.contains(q.path("difficulty").asInt())
          || q.path("answer").path("sampleAnswer").asText().isBlank()
          || q.path("validatedVersion").asInt(-1) != q.path("version").asInt()) continue;
      boolean hidden =
          QuestionRules.active(q).stream()
              .anyMatch(
                  t -> !t.path("useasexample").asBoolean() && t.path("testtype").asInt() != 1);
      if (hidden) {
        try {
          QuestionRules.executable(q);
          out.add(q);
        } catch (DomainException ignored) {
        }
      }
    }
    return out;
  }

  public ObjectNode admit(User u, JsonNode p) {
    ObjectNode r = load(p.path("roomId").asText());
    var me = member(r, u.id());
    require(
        u.coder() && me.path("status").asText().equals("ALIVE"),
        "Khán giả/người bỏ cuộc không được nộp");
    require(
        r.path("state").asText().equals("ROUND_ACTIVE")
            && db.now() <= r.path("current").path("deadline").asLong(),
        "Vòng đã hết hạn");
    require(
        r.path("current").path("id").asText().equals(p.path("roundId").asText()),
        "Round ID cũ; tải snapshot");
    require(
        r.path("current").path("problemId").asText().equals(p.path("problemId").asText()),
        "Đề không thuộc vòng");
    if (r.has("tiePlayers")) {
      boolean allowed = false;
      for (var uid : r.path("tiePlayers")) if (uid.asText().equals(u.id())) allowed = true;
      require(allowed, "Bạn đã chắc suất; chỉ người đang hòa được nộp Sudden Death");
    }
    int attempts =
        submissionRepository.countOfficialRoundAttempts(u.id(), p.path("roundId").asText());
    require(attempts < 2, "Tối đa 2 lượt chính thức mỗi vòng");
    return r;
  }

  public void submissionEvent(String roomId, String type, Object data) {
    // A queued submission still completes if everyone has left and the room was removed.
    var rows = roomRepository.findRoomDocument(roomId);
    if (rows.isEmpty()) return;
    ObjectNode r = (ObjectNode) db.read((String) rows.getFirst().get("document"));
    for (var p : r.path("players")) db.event(p.path("id").asText(), type, data);
    advance(r);
  }

  @Scheduled(fixedDelay = 250)
  public void tick() {
    db.atomic(
        () -> {
          for (var row : roomRepository.listPlayingRooms()) {
            ObjectNode r = (ObjectNode) db.read((String) row.get("document"));
            boolean changed = false;
            var presence = roomRepository.findPresences(r.path("id").asText());
            for (var p : r.path("players"))
              if (p.path("status").asText().equals("ALIVE")) {
                if (presence.getOrDefault(p.path("id").asText(), 0L) < db.now() - 90_000) {
                  ((ObjectNode) p)
                      .put("status", "FORFEIT")
                      .put("eliminatedStage", r.path("history").size());
                  changed = true;
                }
              }
            if (changed) save(r, "player_disconnected");
          }
          return null;
        });
    for (var row : roomRepository.findTickableRoomIds()) {
      try {
        db.atomic(
            () -> {
              advance(load((String) row.get("id")));
              return null;
            });
      } catch (Exception e) {
        org.slf4j.LoggerFactory.getLogger(SurvivalService.class)
            .error("Room tick failed {}", row.get("id"), e);
      }
    }
  }

  public void advance(ObjectNode r) {
    String state = r.path("state").asText();
    long now = db.now();
    if (!Set.of("LOBBY", "COUNTDOWN", "FINISHED", "CLOSED", "UNRESOLVED").contains(state)
        && alive(r).isEmpty()) {
      r.put("state", "UNRESOLVED").put("reason", "Không còn thí sinh");
      save(r, "match_unresolved");
      return;
    }
    if (!Set.of("LOBBY", "COUNTDOWN", "FINISHED", "CLOSED", "UNRESOLVED").contains(state)
        && alive(r).size() == 1) {
      finishMatch(r, alive(r).getFirst());
      return;
    }
    if ((state.equals("COUNTDOWN") || state.equals("ROUND_RESULT"))
        && now >= r.path("nextAt").asLong()) {
      if (state.equals("COUNTDOWN") && !r.path("mode").asText("PRACTICE").equals("PRACTICE")) {
        int confirmed = matchQueueRepository.countFreshStarted(r.path("id").asText(), now - 30_000);
        if (confirmed != 5) {
          cancelMatched(r);
          matchQueueRepository.requeueCancelledMatch(now - 30_000, r.path("id").asText());
          return;
        }
      }
      startRound(r);
    } else if (state.equals("ROUND_ACTIVE") || state.equals("ROUND_GRADING")) {
      String round = r.path("current").path("id").asText();
      // A confirmed AC can finish early, but cannot jump an earlier pending admission.
      if (alive(r).size() <= 2
          && submissionRepository.countRoundInfrastructureFailures(round) == 0) {
        var accepted = submissionRepository.findRoundAccepted(round);
        for (var s : accepted)
          if (alive(r).contains((String) s.get("user_id"))) {
            int earlier =
                submissionRepository.countEarlierPending(
                    round, ((Number) (s.get("received_at"))).longValue());
            if (earlier == 0) {
              settle(r, (String) s.get("user_id"));
              return;
            }
          }
      }
      if (state.equals("ROUND_ACTIVE")) {
        Set<String> submitted = new HashSet<>();
        for (var s : submissionRepository.findRoundParticipants(round))
          submitted.add((String) s.get("user_id"));
        boolean everyoneSubmitted = true;
        for (var uid : r.path("current").path("players"))
          if (member(r, uid.asText()).path("status").asText().equals("ALIVE")
              && !submitted.contains(uid.asText())) everyoneSubmitted = false;
        if (now <= r.path("current").path("deadline").asLong() && !everyoneSubmitted) return;
        r.put("state", "ROUND_GRADING");
        save(r, "round_closed");
      }
      int pending = submissionRepository.countPendingRound(r.path("current").path("id").asText());
      if (pending == 0) settle(r);
    }
  }

  private void startRound(ObjectNode r) {
    String kind = r.path("nextKind").asText("NORMAL");
    Set<String> used = new HashSet<>();
    for (var id : r.path("used")) used.add(id.asText());
    var bank = new ArrayList<JsonNode>();
    for (var q : r.path("bank")) if (!used.contains(q.path("id").asText())) bank.add(q);
    if (bank.isEmpty()) {
      r.put("state", "UNRESOLVED")
          .put("reason", "Hết đề trong tập mức đã khóa; không chọn ngẫu nhiên người thắng");
      save(r, "match_unresolved");
      return;
    }
    if (!kind.equals("NORMAL")) {
      int easiest = bank.stream().mapToInt(q -> q.path("difficulty").asInt()).min().orElseThrow();
      bank.removeIf(q -> q.path("difficulty").asInt() != easiest);
    }
    JsonNode q = bank.get(random.nextInt(bank.size()));
    List<String> players =
        r.has("tiePlayers")
            ? db.json.convertValue(
                r.path("tiePlayers"),
                new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {})
            : alive(r);
    if (players.isEmpty()) {
      r.put("state", "UNRESOLVED").put("reason", "Không còn thí sinh");
      save(r, "match_unresolved");
      return;
    }
    int seconds =
        kind.equals("NORMAL")
            ? (alive(r).size() <= 2
                ? r.path("finalSeconds").asInt(150)
                : r.path("roundSeconds").asInt(120))
            : (q.path("difficulty").asInt() <= 3 ? 60 : 150);
    ObjectNode cur =
        db.obj()
            .put("id", db.id())
            .put("number", r.path("history").size() + 1)
            .put("kind", kind.equals("NORMAL") && alive(r).size() <= 2 ? "FINAL" : kind)
            .put("problemId", q.path("id").asText())
            .put("difficulty", q.path("difficulty").asInt())
            .put("startedAt", db.now())
            .put("deadline", db.now() + seconds * 1000L);
    cur.set("players", db.tree(players));
    r.set("current", cur);
    r.set("frozenProblem", q);
    r.withArray("used").add(q.path("id").asText());
    r.put("state", "ROUND_ACTIVE");
    r.remove("nextKind");
    save(r, "round_started");
  }

  private void settle(ObjectNode r) {
    settle(r, null);
  }

  private void settle(ObjectNode r, String finalWinner) {
    var c = r.path("current");
    String round = c.path("id").asText();
    var attempts = new ArrayList<RoundRanking.Attempt>();
    for (var s : submissionRepository.findRoundAttempts(round))
      attempts.add(
          new RoundRanking.Attempt(
              (String) s.get("user_id"),
              (String) s.get("status"),
              ((Number) s.get("score")).doubleValue(),
              ((Number) s.get("received_at")).longValue()));
    List<String> players = new ArrayList<>();
    for (var uid : c.path("players"))
      if (!member(r, uid.asText()).path("status").asText().equals("FORFEIT"))
        players.add(uid.asText());
    var ranks = RoundRanking.rank(players, attempts, c.path("startedAt").asLong());
    ObjectNode history = db.obj();
    history.set("round", c.deepCopy());
    history.set("ranks", db.tree(ranks));
    r.withArray("history").add(history);
    // An exhausted infrastructure retry is never treated as a contestant failure.
    if (finalWinner == null && attempts.stream().anyMatch(a -> a.verdict().equals("SE"))) {
      history.put("type", "INFRASTRUCTURE_VOID");
      r.put("state", "ROUND_RESULT").put("nextKind", "RESCUE").put("nextAt", db.now() + 10_000);
      save(r, "round_infrastructure_void");
      return;
    }
    Comparator<RoundRanking.Rank> ordering = RoundRanking.ORDER;
    if (c.path("kind").asText().equals("TIE_BREAK") && alive(r).size() == 2) {
      ordering = ordering.thenComparing((a, b) -> compareHistory(r, a.userId(), b.userId()));
      ranks.sort(ordering);
    }
    r.set("standings", db.tree(ranks));
    if (finalWinner != null) {
      for (String id : alive(r))
        if (!id.equals(finalWinner)) member(r, id).put("status", "SPECTATOR");
      r.remove(List.of("tieSlots", "tiePlayers", "qualified", "baseRanks"));
      finishMatch(r, finalWinner);
      return;
    }
    for (var rank : ranks) if (!rank.ac()) member(r, rank.userId()).put("status", "SPECTATOR");
    ranks.removeIf(rank -> !rank.ac());
    int slots =
        Math.min(
            ranks.size(),
            r.has("tieSlots")
                ? r.path("tieSlots").asInt()
                : RoundRanking.survivors(players.size()));
    if (slots < ranks.size() && ordering.compare(ranks.get(slots - 1), ranks.get(slots)) == 0) {
      // Resolve only the boundary tie. Safe qualifiers do not risk elimination again.
      var boundary = ranks.get(slots - 1);
      List<String> qualified = new ArrayList<>();
      if (r.has("qualified")) for (var uid : r.path("qualified")) qualified.add(uid.asText());
      var tied = new ArrayList<String>();
      var eliminated = new ArrayList<String>();
      for (var rank : ranks) {
        int cmp = RoundRanking.ORDER.compare(rank, boundary);
        if (cmp < 0) qualified.add(rank.userId());
        else if (cmp == 0) tied.add(rank.userId());
        else eliminated.add(rank.userId());
      }
      for (String id : eliminated) member(r, id).put("status", "SPECTATOR");
      r.set("qualified", db.tree(qualified));
      r.set("tiePlayers", db.tree(tied));
      r.put(
          "tieSlots",
          slots
              - (int)
                  ranks.stream().filter(x -> RoundRanking.ORDER.compare(x, boundary) < 0).count());
      r.put("state", "ROUND_RESULT").put("nextKind", "TIE_BREAK").put("nextAt", db.now() + 10_000);
      save(r, "tie_break");
      return;
    }
    List<String> keep = new ArrayList<>();
    if (r.has("qualified"))
      for (var uid : r.path("qualified"))
        if (member(r, uid.asText()).path("status").asText().equals("ALIVE")) keep.add(uid.asText());
    for (int i = 0; i < slots; i++) keep.add(ranks.get(i).userId());
    for (String id : alive(r)) if (!keep.contains(id)) member(r, id).put("status", "SPECTATOR");
    r.remove(List.of("tieSlots", "tiePlayers", "qualified", "baseRanks"));
    if (keep.isEmpty()) {
      r.put("state", "UNRESOLVED").put("reason", "No player achieved AC");
      save(r, "match_unresolved");
      return;
    }
    if (keep.size() == 1) {
      finishMatch(r, keep.getFirst());
    } else {
      r.put("state", "ROUND_RESULT").put("nextAt", db.now() + 10_000);
      save(r, "round_result");
    }
  }

  private void finishMatch(ObjectNode r, String winner) {
    if (r.path("state").asText().equals("FINISHED")) return;
    r.put("state", "FINISHED").put("winnerId", winner).put("finishedAt", db.now());
    progression.settle(r);
    userRepository.incrementWins(winner);
    save(r, "match_finished");
    db.event(null, "leaderboard_changed", Map.of("roomId", r.path("id").asText()));
  }

  private int compareHistory(ObjectNode r, String a, String b) {
    double[] x = historyStats(r, a), y = historyStats(r, b);
    int result = Double.compare(y[0], x[0]);
    if (result == 0) result = Double.compare(y[1], x[1]);
    if (result == 0) result = Double.compare(x[2], y[2]);
    return result;
  }

  private double[] historyStats(ObjectNode r, String uid) {
    double[] stats = new double[3];
    // Exclude the tie-break currently being settled and invalidated rounds.
    for (int i = 0; i < r.path("history").size() - 1; i++) {
      var h = r.path("history").get(i);
      if (h.has("type")) continue;
      for (var rank : h.path("ranks"))
        if (rank.path("userId").asText().equals(uid)) {
          stats[1] += rank.path("score").asDouble();
          if (rank.path("ac").asBoolean()) {
            stats[0]++;
            stats[2] += rank.path("effectiveMs").asDouble();
          }
        }
    }
    return stats;
  }
}
