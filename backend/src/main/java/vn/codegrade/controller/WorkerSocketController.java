package vn.codegrade.controller;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import vn.codegrade.model.DomainException;
import vn.codegrade.service.WorkerService;
import vn.codegrade.support.ServiceContext;

@Component
public class WorkerSocketController extends TextWebSocketHandler {
  private final ServiceContext db;
  private final WorkerService service;
  private final Map<String, String> workers = new ConcurrentHashMap<>();

  public WorkerSocketController(ServiceContext db, WorkerService service) {
    this.db = db;
    this.service = service;
  }

  @Override
  public void afterConnectionEstablished(WebSocketSession s) {
    s.setTextMessageSizeLimit(32 * 1024 * 1024);
  }

  @Override
  protected void handleTextMessage(WebSocketSession s, TextMessage message) throws Exception {
    String rid = "";
    try {
      var m = db.read(message.getPayload());
      rid = m.path("requestId").asText();
      var request = vn.codegrade.model.ProtocolRequest.worker(m);
      var p = request.payload();
      String type = request.type();
      Object data;
      if (type.equals("WORKER_AUTH")) {
        String worker = service.authenticate(p);
        workers.put(s.getId(), worker);
        data = Map.of("authenticated", true);
      } else {
        ServiceContext.require(workers.containsKey(s.getId()), "Cần WORKER_AUTH");
        String worker = workers.get(s.getId());
        data = service.execute(worker, type, p);
      }
      s.sendMessage(new TextMessage(db.write(Map.of("requestId", rid, "ok", true, "data", data))));
    } catch (Exception e) {
      s.sendMessage(
          new TextMessage(
              db.write(
                  Map.of(
                      "requestId",
                      rid,
                      "ok",
                      false,
                      "error",
                      e instanceof DomainException ? e.getMessage() : "Worker request failed"))));
    }
  }

  @Override
  public void afterConnectionClosed(WebSocketSession s, CloseStatus status) {
    workers.remove(s.getId());
  }
}
