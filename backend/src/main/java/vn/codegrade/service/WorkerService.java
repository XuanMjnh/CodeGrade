package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.JsonNode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.codegrade.model.DomainException;

@Service
public class WorkerService {
  private final SubmissionService submissions;
  private final String token;

  public WorkerService(SubmissionService submissions, @Value("${app.worker-token}") String token) {
    this.submissions = submissions;
    this.token = token;
  }

  public String authenticate(JsonNode payload) {
    require(
        token.length() >= 32
            && MessageDigest.isEqual(
                token.getBytes(StandardCharsets.UTF_8),
                payload.path("token").asText().getBytes(StandardCharsets.UTF_8)),
        "Worker token không hợp lệ");
    String id = payload.path("workerId").asText();
    require(id.matches("[A-Za-z0-9_-]{1,80}"), "Worker ID không hợp lệ");
    return id;
  }

  public Object execute(String worker, String type, JsonNode payload) {
    return switch (type) {
      case "CLAIM" -> submissions.claim(worker);
      case "HEARTBEAT" -> submissions.heartbeat(worker, payload);
      case "PROGRESS" -> submissions.progress(worker, payload);
      case "RESULT" -> submissions.complete(worker, payload);
      default -> throw new DomainException("TYPE", "Worker message không được hỗ trợ");
    };
  }
}
