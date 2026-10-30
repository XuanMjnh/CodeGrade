package vn.codegrade.controller;

import com.fasterxml.jackson.databind.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.*;
import vn.codegrade.model.DomainException;
import vn.codegrade.model.User;
import vn.codegrade.service.CommandService;
import vn.codegrade.service.EventService;
import vn.codegrade.service.IdentityService;
import vn.codegrade.support.ServiceContext;

@Component
public class ClientSocketController extends TextWebSocketHandler {
  private final EventService eventService;

  private final ServiceContext db;
  private final IdentityService identity;
  private final CommandService commands;
  private final Map<String, Connection> clients = new ConcurrentHashMap<>();
  private final Map<String, Window> authWindows = new ConcurrentHashMap<>();

  private static class Window {
    long start = System.currentTimeMillis();
    int count = 0;
  }

  private static class Connection {
    WebSocketSession socket;
    volatile User user;
    volatile String token;
    volatile long cursor = 0, lastSeen = System.currentTimeMillis();
    long window = 0;
    int count = 0;

    Connection(WebSocketSession s) {
      socket = new ConcurrentWebSocketSessionDecorator(s, 5000, 2 * 1024 * 1024);
    }
  }

  public ClientSocketController(
      ServiceContext db,
      IdentityService identity,
      CommandService commands,
      EventService eventService) {
    this.eventService = eventService;
    this.db = db;
    this.identity = identity;
    this.commands = commands;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession s) throws Exception {
    if (clients.size() >= 250) {
      s.close(CloseStatus.SERVICE_OVERLOAD);
      return;
    }
    s.setTextMessageSizeLimit(1024 * 1024);
    clients.put(s.getId(), new Connection(s));
  }

  @Override
  protected void handleTextMessage(WebSocketSession s, TextMessage message) {
    Connection c = clients.get(s.getId());
    if (c == null) return;
    synchronized (c) {
      String rid = "", type = "";
      try {
        c.lastSeen = db.now();
        if (c.lastSeen - c.window > 10_000) {
          c.window = c.lastSeen;
          c.count = 0;
        }
        ServiceContext.require(++c.count <= 80, "Quá nhiều message; chờ 10 giây");
        JsonNode m = db.read(message.getPayload());
        rid = m.path("requestId").asText();
        type = m.path("type").asText();
        var request = vn.codegrade.model.ProtocolRequest.client(m);
        JsonNode p = request.payload();
        Object data;
        switch (type) {
          case "PING":
            data = Map.of("serverTime", db.now());
            break;
          case "REGISTER", "LOGIN":
            String ip =
                s.getRemoteAddress() == null
                    ? "unknown"
                    : s.getRemoteAddress().getAddress().getHostAddress();
            Window w = authWindows.computeIfAbsent(ip, k -> new Window());
            synchronized (w) {
              if (db.now() - w.start > 60_000) {
                w.start = db.now();
                w.count = 0;
              }
              ServiceContext.require(
                  ++w.count <= 20, "Tối đa 20 yêu cầu đăng nhập/đăng ký mỗi phút");
            }
            data =
                m.path("type").asText().equals("LOGIN") ? identity.login(p) : identity.register(p);
            break;
          case "AUTH":
            c.user = null;
            c.token = null;
            String authToken = p.path("token").asText();
            User authenticated = identity.authenticate(authToken);
            long head = eventService.head();
            c.cursor =
                p.has("lastSeq") ? Math.min(head, Math.max(0, p.path("lastSeq").asLong())) : head;
            c.token = authToken;
            c.user = authenticated;
            data = Map.of("user", c.user, "serverTime", db.now(), "headSeq", head);
            break;
          case "LOGOUT":
            ServiceContext.require(c.user != null, "Cần AUTH trước");
            identity.logout(c.token);
            c.user = null;
            data = Map.of("loggedOut", true);
            break;
          default:
            ServiceContext.require(c.user != null, "Cần AUTH trước");
            c.user = identity.authenticate(c.token);
            if (type.equals("PASSWORD_CHANGE")) {
              Window pw = authWindows.computeIfAbsent("password:" + c.user.id(), k -> new Window());
              synchronized (pw) {
                if (db.now() - pw.start > 60_000) {
                  pw.start = db.now();
                  pw.count = 0;
                }
                ServiceContext.require(++pw.count <= 5, "Tối đa 5 yêu cầu đổi mật khẩu mỗi phút");
              }
            }
            data = commands.execute(c.user, type, p, rid);
        }
        send(
            c,
            Map.of(
                "v",
                1,
                "type",
                "ACK",
                "requestId",
                rid,
                "command",
                type,
                "ok",
                true,
                "data",
                data,
                "serverTime",
                db.now()));
      } catch (Exception e) {
        String code = e instanceof DomainException f ? f.code : "SERVER_ERROR";
        String msg =
            e instanceof DomainException || e instanceof IllegalArgumentException
                ? e.getMessage()
                : "Không xử lý được yêu cầu; thử lại với cùng requestId";
        if (code.equals("SERVER_ERROR"))
          LoggerFactory.getLogger(ClientSocketController.class)
              .error("Command failed type={}", type, e);
        send(
            c,
            Map.of(
                "v",
                1,
                "type",
                "ACK",
                "requestId",
                rid,
                "command",
                type,
                "ok",
                false,
                "error",
                Map.of("code", code, "message", msg == null ? "Lỗi dữ liệu" : msg),
                "serverTime",
                db.now()));
      }
    }
  }

  private void send(Connection c, Object data) {
    try {
      if (c.socket.isOpen()) c.socket.sendMessage(new TextMessage(db.write(data)));
    } catch (Exception e) {
      try {
        c.socket.close(CloseStatus.SESSION_NOT_RELIABLE);
      } catch (Exception ignored) {
      }
    }
  }

  @Scheduled(fixedDelay = 200)
  public void events() {
    for (var c : clients.values()) {
      synchronized (c) {
        if (c.user == null || !c.socket.isOpen()) continue;
        try {
          try {
            identity.authenticate(c.token);
          } catch (DomainException revoked) {
            send(
                c,
                Map.of(
                    "v",
                    1,
                    "type",
                    "EVENT",
                    "seq",
                    c.cursor + 1,
                    "event",
                    "session_revoked",
                    "data",
                    Map.of("reason", "Phiên đăng nhập đã hết hạn hoặc bị thu hồi"),
                    "serverTime",
                    db.now()));
            c.user = null;
            c.token = null;
            continue;
          }
          var events = eventService.poll(c.cursor, c.user.id());
          for (var e : events) {
            send(
                c,
                Map.of(
                    "v",
                    1,
                    "type",
                    "EVENT",
                    "seq",
                    e.get("id"),
                    "event",
                    e.get("type"),
                    "data",
                    CommandService.withoutProofs(db.read((String) e.get("payload"))),
                    "serverTime",
                    db.now()));
            c.cursor = ((Number) e.get("id")).longValue();
          }
        } catch (Exception e) {
          LoggerFactory.getLogger(ClientSocketController.class).warn("Event delivery deferred");
        }
      }
    }
  }

  @Scheduled(fixedDelay = 10_000)
  public void reap() {
    authWindows.entrySet().removeIf(e -> db.now() - e.getValue().start > 120_000);
    for (var c : clients.values())
      if (db.now() - c.lastSeen > (c.user == null ? 30_000 : 60_000))
        try {
          c.socket.close(CloseStatus.SESSION_NOT_RELIABLE);
        } catch (Exception ignored) {
        }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession s, CloseStatus status) {
    clients.remove(s.getId());
  }

  @Override
  public void handleTransportError(WebSocketSession s, Throwable t) throws Exception {
    s.close(CloseStatus.SERVER_ERROR);
  }
}
