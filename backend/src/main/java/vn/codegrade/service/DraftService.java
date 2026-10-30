package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.springframework.stereotype.Service;
import vn.codegrade.model.QuestionRules;
import vn.codegrade.model.User;
import vn.codegrade.repository.DraftRepository;
import vn.codegrade.support.ServiceContext;

@Service
public class DraftService {
  private final DraftRepository drafts;
  private final ProblemService problems;
  private final ServiceContext context;

  public DraftService(DraftRepository drafts, ProblemService problems, ServiceContext context) {
    this.drafts = drafts;
    this.problems = problems;
    this.context = context;
  }

  public Object get(User user, String problem) {
    return drafts.findDraft(user.id(), problem);
  }

  public Object clear(User user, String problem) {
    drafts.deleteDraft(user.id(), problem);
    return Map.of("cleared", true);
  }

  public Object save(User user, JsonNode payload) {
    require(
        payload.path("roomId").asText().isBlank() && payload.path("contestId").asText().isBlank(),
        "Bản nháp thi đấu không được lưu");
    String problem = payload.path("problemId").asText(),
        source = payload.path("source").asText(),
        language = payload.path("language").asText();
    problems.get(user, problem, false);
    require(
        source.length() <= 65536 && QuestionRules.LANGUAGES.contains(language),
        "Draft không hợp lệ");
    long now = context.now();
    drafts.deleteDraft(user.id(), problem);
    drafts.insertDraft(user.id(), problem, language, source, now);
    return Map.of("savedAt", now);
  }
}
