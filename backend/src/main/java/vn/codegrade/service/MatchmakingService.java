package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import vn.codegrade.model.DomainException;
import vn.codegrade.model.User;
import vn.codegrade.repository.MatchQueueRepository;
import vn.codegrade.repository.RoomRepository;
import vn.codegrade.support.ServiceContext;

/** Durable queue; the shared DB lock serializes selection across server instances. */
@Service
public class MatchmakingService {
  private final MatchQueueRepository matchQueueRepository;
  private final RoomRepository roomRepository;

  private final ServiceContext db;
  private final SurvivalService survival;
  private final ProgressionService progression;
  private final IdentityService identity;

  @Value("${app.survival.rating-ranges:150,250,350,400}")
  int[] ranges = {150, 250, 350, 400};

  @Value("${app.survival.accept-seconds:20}")
  int acceptSeconds = 20;

  public MatchmakingService(
      ServiceContext db,
      SurvivalService survival,
      ProgressionService progression,
      IdentityService identity,
      MatchQueueRepository matchQueueRepository,
      RoomRepository roomRepository) {
    this.matchQueueRepository = matchQueueRepository;
    this.roomRepository = roomRepository;
    this.db = db;
    this.survival = survival;
    this.progression = progression;
    this.identity = identity;
  }

  @jakarta.annotation.PostConstruct
  public void validateConfiguration() {
    require(ranges.length == 4, "Cần 4 phạm vi rating cho các mốc 0/10/20/30 giây");
    for (int i = 0; i < 4; i++)
      require(
          ranges[i] >= 0 && ranges[i] <= 400 && (i == 0 || ranges[i] >= ranges[i - 1]),
          "Phạm vi rating tăng dần, tối đa 400");
    require(acceptSeconds >= 5 && acceptSeconds <= 60, "Thời gian nhận trận 5–60 giây");
  }

  public void available(String uid, String exceptRoom) {
    require(
        matchQueueRepository.countActiveMembership(uid) == 0,
        "Bạn đang trong hàng đợi hoặc trận khác");
    require(
        !roomRepository.hasAliveMembership(uid, exceptRoom),
        "User is already in another active room");
  }

  public Object command(User u, String type, JsonNode p) {
    require(u.coder(), "Chỉ CODER được ghép trận");
    if (type.equals("MATCH_QUEUE_JOIN")) {
      String mode = p.path("mode").asText();
      require(Set.of("NORMAL", "RANKED").contains(mode), "Chọn NORMAL hoặc RANKED");
      available(u.id(), "");
      var stats = progression.get(u.id());
      matchQueueRepository.deleteEntry(u.id());
      matchQueueRepository.insertEntry(
          u.id(),
          mode,
          "WAITING",
          db.now(),
          db.now(),
          stats.path("rating").asInt(),
          stats.path("level").asInt());
      pair();
      return snapshot(u.id());
    }
    if (type.equals("MATCH_QUEUE_STATUS") || type.equals("MATCH_SNAPSHOT")) {
      matchQueueRepository.touchUser(db.now(), u.id());
      return snapshot(u.id());
    }
    var rows = matchQueueRepository.findByUser(u.id());
    require(!rows.isEmpty(), "Bạn không ở hàng đợi");
    var entry = rows.getFirst();
    String state = (String) entry.get("state");
    if (type.equals("MATCH_QUEUE_CANCEL") || type.equals("MATCH_DECLINE")) {
      if (entry.get("room_id") != null
          && Set.of("MATCH_FOUND", "ACCEPTED", "STARTED").contains(state)) {
        var room = survival.load((String) entry.get("room_id"));
        require(
            Set.of("LOBBY", "COUNTDOWN").contains(room.path("state").asText()),
            "Trận đã bắt đầu; dùng bỏ cuộc trong phòng");
        cancel(room, Set.of(u.id()), "CANCELLED");
      } else matchQueueRepository.cancelUser(u.id());
      pair();
      return snapshot(u.id());
    }
    if (type.equals("MATCH_ACCEPT")) {
      require(Set.of("MATCH_FOUND", "ACCEPTED").contains(state), "Không có trận chờ xác nhận");
      var r = survival.load((String) entry.get("room_id"));
      require(p.path("roomId").asText().equals(r.path("id").asText()), "Mã trận đã cũ");
      require(r.path("acceptDeadline").asLong() >= db.now(), "Hết thời gian nhận trận");
      matchQueueRepository.acceptMatch(db.now(), u.id());
      int accepted =
          matchQueueRepository.countFreshAccepted(r.path("id").asText(), db.now() - 30_000);
      if (accepted == 5) {
        survival.begin(r);
        matchQueueRepository.startMatch(r.path("id").asText());
      }
      return snapshot(u.id());
    }
    throw new DomainException("TYPE", "Lệnh ghép trận không hợp lệ");
  }

  public ObjectNode snapshot(String uid) {
    var rows = matchQueueRepository.findByUser(uid);
    if (rows.isEmpty()) return db.obj().put("state", "IDLE");
    var e = rows.getFirst();
    String state = (String) e.get("state"), mode = (String) e.get("mode");
    long waited = Math.max(0, db.now() - ((Number) e.get("joined_at")).longValue());
    var out =
        db.obj()
            .put("state", state)
            .put("mode", mode)
            .put("joinedAt", ((Number) e.get("joined_at")).longValue())
            .put("waitSeconds", waited / 1000)
            .put("target", 5)
            .put("ratingRange", range(waited));
    out.put("waiting", matchQueueRepository.countWaiting(mode, db.now() - 90_000));
    if (e.get("room_id") != null && Set.of("MATCH_FOUND", "ACCEPTED", "STARTED").contains(state)) {
      String id = (String) e.get("room_id");
      var room = survival.load(id);
      out.put("roomId", id).put("acceptDeadline", room.path("acceptDeadline").asLong());
      out.put("accepted", matchQueueRepository.countAccepted(id));
      out.set("room", survival.publicState(room));
    }
    return out;
  }

  private int range(long waited) {
    return Math.min(400, ranges[(int) Math.min(3, waited / 10_000)]);
  }

  public void pair() {
    for (String mode : List.of("NORMAL", "RANKED")) {
      while (true) {
        var waiting = matchQueueRepository.findWaitingCandidates(mode, db.now() - 90_000);
        if (waiting.size() < 5) break;
        List<Map<String, Object>> group = null;
        // Try anchors FIFO, so an isolated rating does not block other valid groups.
        for (var anchor : waiting) {
          long waited = db.now() - ((Number) anchor.get("joined_at")).longValue();
          List<Map<String, Object>> candidates = new ArrayList<>(waiting);
          if (mode.equals("NORMAL")) {
            if (waited < 10_000)
              candidates.sort(
                  Comparator.comparingInt(
                          (Map<String, Object> e) ->
                              Math.abs(
                                  ((Number) e.get("player_level")).intValue()
                                      - ((Number) anchor.get("player_level")).intValue()))
                      .thenComparingLong(e -> ((Number) e.get("joined_at")).longValue()));
            group = new ArrayList<>(candidates.subList(0, 5));
            break;
          }
          candidates.sort(Comparator.comparingInt(e -> ((Number) e.get("rating")).intValue()));
          for (int i = 0; i + 5 <= candidates.size(); i++) {
            var slice = candidates.subList(i, i + 5);
            if (!slice.contains(anchor)) continue;
            int spread =
                ((Number) slice.getLast().get("rating")).intValue()
                    - ((Number) slice.getFirst().get("rating")).intValue();
            if (spread <= range(waited)) {
              // Within a valid rating window select the oldest five, not the lowest five.
              int low = ((Number) slice.getFirst().get("rating")).intValue();
              var window =
                  waiting.stream()
                      .filter(
                          e -> {
                            int rating = ((Number) e.get("rating")).intValue();
                            return rating >= low && rating <= low + range(waited);
                          })
                      .limit(5)
                      .toList();
              group = new ArrayList<>(window);
              break;
            }
          }
          if (group != null) break;
        }
        if (group == null) break;
        List<User> users = new ArrayList<>();
        for (var e : group) users.add(identity.user((String) e.get("user_id")));
        var room = survival.createMatched(mode, users, db.now() + acceptSeconds * 1000L);
        for (var e : group) {
          matchQueueRepository.assignMatch(room.path("id").asText(), (String) (e.get("user_id")));
          db.event((String) e.get("user_id"), "MATCH_FOUND", snapshot((String) e.get("user_id")));
        }
      }
    }
  }

  private void cancel(ObjectNode r, Set<String> excluded, String reason) {
    String rid = r.path("id").asText();
    for (var e : matchQueueRepository.findRoomMembers(rid)) {
      String uid = (String) e.get("user_id");
      String state =
          excluded.contains(uid) || ((Number) e.get("last_seen")).longValue() < db.now() - 90_000
              ? reason
              : "WAITING";
      matchQueueRepository.resetEntry(state, uid);
      db.event(uid, "match_cancelled", Map.of("roomId", rid, "state", state));
    }
    survival.cancelMatched(r);
  }

  @Scheduled(fixedDelay = 500)
  public void tick() {
    db.atomic(
        () -> {
          matchQueueRepository.expireWaiting(db.now() - 90_000);
          for (var row : roomRepository.listPendingRooms()) {
            ObjectNode r = (ObjectNode) db.read((String) row.get("document"));
            if (r.path("mode").asText("PRACTICE").equals("PRACTICE")) continue;
            if (r.path("state").asText().equals("LOBBY")
                && db.now() > r.path("acceptDeadline").asLong()) {
              Set<String> expired = new HashSet<>();
              for (var e : matchQueueRepository.findUnacceptedUsers(r.path("id").asText()))
                expired.add((String) e.get("user_id"));
              cancel(r, expired, "EXPIRED");
            }
          }
          pair();
          return null;
        });
  }
}
