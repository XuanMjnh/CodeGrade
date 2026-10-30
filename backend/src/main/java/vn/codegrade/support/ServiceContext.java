package vn.codegrade.support;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;
import vn.codegrade.model.DomainException;
import vn.codegrade.repository.ActivityRepository;

/** Shared serialization and transaction facilities; never exposes JDBC to services. */
@Component
public class ServiceContext {
  public final ObjectMapper json;
  private final UnitOfWork transactions;
  private final ActivityRepository activity;

  public ServiceContext(ObjectMapper json, UnitOfWork transactions, ActivityRepository activity) {
    this.json = json;
    this.transactions = transactions;
    this.activity = activity;
  }

  public <T> T atomic(Supplier<T> action) {
    return transactions.serialized("competition", action);
  }

  public <T> T atomic(String scope, Supplier<T> action) {
    return transactions.serialized(scope, action);
  }

  public <T> T readOnly(Supplier<T> action) {
    return transactions.read(action);
  }

  public long now() {
    return System.currentTimeMillis();
  }

  public String id() {
    return UUID.randomUUID().toString();
  }

  public ObjectNode obj() {
    return json.createObjectNode();
  }

  public JsonNode read(String value) {
    try {
      return json.readTree(value);
    } catch (Exception e) {
      throw new IllegalArgumentException("JSON không hợp lệ", e);
    }
  }

  public String write(Object value) {
    try {
      return json.writeValueAsString(value);
    } catch (Exception e) {
      throw new IllegalArgumentException("Không thể mã hóa JSON", e);
    }
  }

  public JsonNode tree(Object value) {
    return json.valueToTree(value);
  }

  public void event(String user, String type, Object payload) {
    activity.appendEvent(user, type, write(payload), now());
  }

  public void audit(String actor, String action, String entity, Object payload) {
    activity.appendAudit(actor, action, entity, write(payload), now());
  }

  public static String hash(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  public static void require(boolean valid, String message) {
    if (!valid) throw new DomainException("VALIDATION", message);
  }
}
