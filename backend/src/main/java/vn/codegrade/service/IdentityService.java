package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.JsonNode;
import java.security.SecureRandom;
import java.util.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import vn.codegrade.model.DomainException;
import vn.codegrade.model.User;
import vn.codegrade.repository.UserRepository;
import vn.codegrade.support.ServiceContext;

@Service
public class IdentityService {
  private final UserRepository userRepository;

  private final ServiceContext db;
  private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(11);

  public IdentityService(ServiceContext db, UserRepository userRepository) {
    this.userRepository = userRepository;
    this.db = db;
  }

  public User user(String id) {
    var m = userRepository.findEnabledById(id);
    return profile(m);
  }

  /** Historical standings must remain readable after an account is disabled. */
  public User historicalUser(String id) {
    return profile(userRepository.findById(id));
  }

  private User profile(Map<String, Object> m) {
    String id = (String) m.get("id");
    return new User(
        id,
        (String) m.get("username"),
        (String) m.get("display_name"),
        (String) m.get("role"),
        ((Number) m.get("elo")).intValue(),
        ((Number) m.get("wins")).intValue(),
        (String) m.get("email"));
  }

  public Map<String, Object> register(JsonNode p) {
    String name = p.path("username").asText().trim(),
        pass = p.path("password").asText(),
        display = p.path("displayName").asText().trim();
    require(name.matches("[A-Za-z0-9_]{3,40}"), "Username: 3–40 ký tự chữ, số hoặc _");
    require(
        pass.length() >= 10 && pass.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 72,
        "Mật khẩu cần ít nhất 10 ký tự và tối đa 72 byte");
    require(!display.isBlank() && display.length() <= 100, "Họ tên cần 1–100 ký tự");
    String email = p.path("email").asText().trim();
    require(email.matches("[^ @]+@[^ @]+[.][^ @]+") && email.length() <= 254, "Invalid email");
    // BCrypt is expensive: do it before entering a short account transaction.
    String hash = passwords.encode(pass);
    return db.atomic(
        "identity",
        () -> {
          require(userRepository.countByUsername(name) == 0, "Username đã tồn tại");
          String id = db.id();
          userRepository.insertUser(id, name, display, hash, "CODER", db.now());
          userRepository.updateEmail(email, id);
          return issue(user(id));
        });
  }

  public String create(String username, String display, String pass, String role) {
    String id = db.id();
    String hash = passwords.encode(pass);
    return db.atomic(
        "identity",
        () -> {
          userRepository.insertUser(id, username, display, hash, role, db.now());
          return id;
        });
  }

  public Map<String, Object> login(JsonNode p) {
    var rows = userRepository.findEnabledByUsername(p.path("username").asText());
    String hash =
        rows.isEmpty()
            ? "$2a$11$8k9p4f2Fqj7AXdWTobR7VO5hHP9XyzLrS7b0Bz0tAEhUhASB9SS1e"
            : (String) rows.getFirst().get("password_hash");
    boolean valid = passwords.matches(p.path("password").asText(), hash);
    if (rows.isEmpty() || !valid)
      throw new DomainException("AUTH", "Tài khoản hoặc mật khẩu không đúng");
    return issue(user((String) rows.getFirst().get("id")));
  }

  private Map<String, Object> issue(User user) {
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    userRepository.insertSession(ServiceContext.hash(token), user.id(), db.now() + 12 * 3600_000L);
    return Map.of("token", token, "user", user);
  }

  public User authenticate(String token) {
    var rows = userRepository.findValidSession(ServiceContext.hash(token), db.now());
    if (rows.isEmpty()) throw new DomainException("AUTH", "Phiên đăng nhập đã hết hạn");
    return profile(rows.getFirst());
  }

  public void logout(String token) {
    userRepository.revokeToken(ServiceContext.hash(token));
  }

  public Object changePassword(User u, JsonNode p) {
    String current = p.path("currentPassword").asText(), next = p.path("newPassword").asText();
    String hash = (String) userRepository.findPasswordHash(u.id()).get("password_hash");
    require(
        current.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 72
            && passwords.matches(current, hash),
        "Mật khẩu hiện tại không đúng");
    require(
        next.length() >= 10 && next.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 72,
        "Mật khẩu mới cần ít nhất 10 ký tự và tối đa 72 byte");
    require(!passwords.matches(next, hash), "Mật khẩu mới phải khác mật khẩu hiện tại");
    userRepository.updatePasswordHash(passwords.encode(next), u.id());
    userRepository.revokeUserSessions(u.id());
    db.audit(u.id(), "PASSWORD_CHANGED", u.id(), Map.of("sessionsRevoked", true));
    return Map.of("changed", true);
  }

  public Object admin(User u, String type, JsonNode p) {
    require(u.admin(), "Chỉ admin được quản lý người dùng");
    if (type.equals("USERS")) return userRepository.listAccounts();
    String id = p.path("id").asText();
    var target = userRepository.findRole(id);
    require(!id.equals(u.id()), "Không tự thay đổi quyền hoặc khóa tài khoản đang dùng");
    String role = p.path("role").asText((String) target.get("role"));
    require(Set.of("ADMIN", "AUTHOR", "CODER").contains(role), "Role không hợp lệ");
    userRepository.updatePermissions(role, p.path("enabled").asBoolean(true), id);
    userRepository.revokeUserSessions(id);
    db.audit(
        u.id(),
        "USER_UPDATED",
        id,
        Map.of("role", role, "enabled", p.path("enabled").asBoolean(true)));
    db.event(
        id, "session_revoked", Map.of("reason", "Quyền hoặc trạng thái tài khoản đã thay đổi"));
    return Map.of("id", id);
  }
}
