package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import org.springframework.stereotype.Service;
import vn.codegrade.model.DomainException;
import vn.codegrade.model.User;
import vn.codegrade.repository.CommunityRepository;
import vn.codegrade.repository.UserRepository;
import vn.codegrade.support.ServiceContext;

@Service
public class CommunityService {
  private final CommunityRepository communityRepository;
  private final UserRepository userRepository;

  private final ServiceContext db;
  private final ProblemService catalog;

  public CommunityService(
      ServiceContext d,
      ProblemService c,
      CommunityRepository communityRepository,
      UserRepository userRepository) {
    this.communityRepository = communityRepository;
    this.userRepository = userRepository;
    db = d;
    catalog = c;
  }

  public Object command(User u, String type, JsonNode p) {
    String pid = p.path("problemId").asText();
    if (type.startsWith("BOOKMARK") || type.startsWith("COMMENT")) catalog.get(u, pid, false);
    switch (type) {
      case "BOOKMARK_SET":
        communityRepository.deleteBookmark(u.id(), pid);
        if (p.path("starred").asBoolean()) communityRepository.insertBookmark(u.id(), pid);
        return Map.of("starred", p.path("starred").asBoolean());
      case "COMMENTS":
        return communityRepository.listProblemComments(pid);
      case "COMMENT_ADD":
        String text = p.path("body").asText().trim();
        require(!text.isEmpty() && text.length() <= 4000, "Comment: 1–4000 characters");
        communityRepository.insertComment(db.id(), u.id(), pid, text, db.now());
        db.event(null, "comments_changed", Map.of("problemId", pid));
        return Map.of("saved", true);
      case "ANNOUNCEMENTS":
        return communityRepository.listAnnouncements();
      case "ANNOUNCEMENT_ADD":
        require(u.admin(), "Admin only");
        String title = p.path("title").asText().trim(), body = p.path("body").asText().trim();
        require(
            !title.isEmpty() && title.length() <= 200 && !body.isEmpty() && body.length() <= 4000,
            "Invalid announcement");
        communityRepository.insertAnnouncement(db.id(), u.id(), title, body, db.now());
        db.event(null, "announcement_published", Map.of("title", title));
        return Map.of("saved", true);
      case "PROFILE_SAVE":
        String email = p.path("email").asText().trim().toLowerCase(Locale.ROOT),
            name = p.path("displayName").asText().trim();
        require(email.matches("[^ @]+@[^ @]+[.][^ @]+") && email.length() <= 254, "Invalid email");
        require(!name.isBlank() && name.length() <= 100, "Invalid name");
        userRepository.updateProfile(email, name, u.id());
        return Map.of("saved", true);
      default:
        throw new DomainException("TYPE", "Unknown command");
    }
  }
}
