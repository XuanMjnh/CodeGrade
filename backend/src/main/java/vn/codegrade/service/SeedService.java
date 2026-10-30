package vn.codegrade.service;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.stereotype.Service;
import vn.codegrade.repository.ProblemRepository;
import vn.codegrade.repository.SubmissionRepository;
import vn.codegrade.repository.UserRepository;
import vn.codegrade.support.ServiceContext;

@Service
public class SeedService {
  private final ProblemRepository problemRepository;
  private final SubmissionRepository submissionRepository;
  private final UserRepository userRepository;

  private final ServiceContext db;
  private final IdentityService identity;
  private final ProblemService catalog;

  @Value("${app.admin-password}")
  String adminPassword;

  @Value("${app.worker-token}")
  String workerToken;

  @Value("${app.demo}")
  boolean demo;

  @Value("${DEMO_PASSWORD:}")
  String demoPassword;

  public SeedService(
      ServiceContext db,
      IdentityService identity,
      ProblemService catalog,
      ProblemRepository problemRepository,
      SubmissionRepository submissionRepository,
      UserRepository userRepository) {
    this.problemRepository = problemRepository;
    this.submissionRepository = submissionRepository;
    this.userRepository = userRepository;
    this.db = db;
    this.identity = identity;
    this.catalog = catalog;
  }

  public void run(ApplicationArguments args) throws Exception {
    ServiceContext.require(
        workerToken.length() >= 32, "Thiết lập WORKER_TOKEN ≥32 ký tự trong .env");
    ServiceContext.require(
        adminPassword.length() >= 10 && adminPassword.length() <= 72,
        "Thiết lập ADMIN_PASSWORD 10–72 ký tự trong .env");
    db.atomic(
        () -> {
          if (userRepository.countAccounts() == 0)
            identity.create("admin", "Quản trị viên", adminPassword, "ADMIN");
          if (problemRepository.countCategories() == 0) problemRepository.insertDefaultCategory();
          return null;
        });
    if (!demo) return;
    ServiceContext.require(
        demoPassword.length() >= 10 && demoPassword.length() <= 72,
        "DEMO_PASSWORD cần 10–72 ký tự khi bật DEMO_DATA");
    JsonNode dataset = db.json.readTree(getClass().getResourceAsStream("/dataset.json"));
    db.atomic(
        () -> {
          if (userRepository.countSeedAuthor() == 0)
            identity.create("author", "Người tạo đề", demoPassword, "AUTHOR");
          for (int i = 1; i <= 10; i++) {
            String username = String.format("coder%02d", i);
            if (userRepository.countByUsername(username) == 0)
              identity.create(username, "Coder " + i, demoPassword, "CODER");
          }
          String author = (String) userRepository.findSeedAuthor().get("id");
          var owner = identity.user(author);
          Set<String> categories = new HashSet<>(problemRepository.findCategoryIds());
          Set<String> existing = new HashSet<>();
          for (var row : problemRepository.listDocuments())
            existing.add(
                db.read((String) row.get("document")).path("general").path("idNumber").asText());
          for (var item : dataset) {
            String category = item.path("general").path("categoryId").asText();
            if (categories.add(category))
              problemRepository.insertSeedCategory(category, category, category);
            String key = item.path("general").path("idNumber").asText();
            if (!existing.add(key)) continue;
            ObjectNode saved = (ObjectNode) catalog.save(owner, item);
            // Reference solutions are verified by the real worker, never marked AC by seed logic.
            String id = db.id();
            submissionRepository.insertValidation(
                id,
                author,
                saved.path("id").asText(),
                "seed:" + key,
                saved.path("answer").path("sampleAnswer").asText(),
                saved.path("answer").path("language").asText(),
                "VALIDATE",
                db.now(),
                "QUEUED",
                db.write(saved));
          }
          return null;
        });
  }
}
