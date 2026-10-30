package vn.codegrade.model;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.JsonNode;

/** Validated transport envelope; command payloads retain the editor's extensible JSON schema. */
public record ProtocolRequest(int v, String requestId, String type, JsonNode payload) {
  public static ProtocolRequest client(JsonNode value) {
    return parse(value, true);
  }

  public static ProtocolRequest worker(JsonNode value) {
    return parse(value, false);
  }

  private static ProtocolRequest parse(JsonNode value, boolean client) {
    int version = value.path("v").asInt();
    String requestId = value.path("requestId").asText();
    require(version == 1, "Protocol v phải là 1");
    if (client) require(requestId.matches("[A-Za-z0-9:_-]{1,80}"), "Request ID không hợp lệ");
    JsonNode payload = value.path("payload");
    require(payload.isObject(), "Payload phải là JSON object");
    return new ProtocolRequest(version, requestId, value.path("type").asText(), payload);
  }
}
