package vn.codegrade.protocol;

import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import vn.codegrade.db.Store;
import vn.codegrade.judge.Submissions;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Component
public class WorkerSocket extends TextWebSocketHandler {
    private final Store db; private final Submissions submissions;
    private final Map<String,String> workers=new ConcurrentHashMap<>();
    @Value("${app.worker-token}") String token;
    public WorkerSocket(Store db,Submissions submissions) { this.db=db; this.submissions=submissions; }
    @Override public void afterConnectionEstablished(WebSocketSession s) { s.setTextMessageSizeLimit(32*1024*1024); }
    @Override protected void handleTextMessage(WebSocketSession s,TextMessage message) throws Exception {
        String rid="";
        try {
            var m=db.read(message.getPayload()); rid=m.path("requestId").asText(); var p=m.path("payload"); String type=m.path("type").asText();
            Store.require(m.path("v").asInt()==1,"Protocol v phải là 1");
            Store.require(p.isObject(),"Payload phải là JSON object");
            Object data;
            if(type.equals("WORKER_AUTH")) {
                Store.require(token.length()>=32 && MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8),p.path("token").asText().getBytes(StandardCharsets.UTF_8)),"Worker token không hợp lệ");
                String worker=p.path("workerId").asText(); Store.require(worker.matches("[A-Za-z0-9_-]{1,80}"),"Worker ID không hợp lệ");
                workers.put(s.getId(),worker); data=Map.of("authenticated",true);
            } else {
                Store.require(workers.containsKey(s.getId()),"Cần WORKER_AUTH");
                String worker=workers.get(s.getId());
                data=switch(type) {
                    case "CLAIM" -> submissions.claim(worker);
                    case "HEARTBEAT" -> submissions.heartbeat(worker,p);
                    case "PROGRESS" -> submissions.progress(worker,p);
                    case "RESULT" -> submissions.complete(worker,p);
                    default -> throw new Store.Fault("TYPE","Worker message không được hỗ trợ");
                };
            }
            s.sendMessage(new TextMessage(db.write(Map.of("requestId",rid,"ok",true,"data",data))));
        } catch(Exception e) {
            s.sendMessage(new TextMessage(db.write(Map.of("requestId",rid,"ok",false,"error",e instanceof Store.Fault?e.getMessage():"Worker request failed"))));
        }
    }
    @Override public void afterConnectionClosed(WebSocketSession s,CloseStatus status) { workers.remove(s.getId()); }
}
