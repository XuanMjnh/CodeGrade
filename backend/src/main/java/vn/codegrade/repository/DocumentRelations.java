package vn.codegrade.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;

/** Maintains relational indexes in the same transaction as their aggregate document. */
final class DocumentRelations {
  private DocumentRelations() {}

  static JsonNode read(ObjectMapper json, String value) {
    try {
      return json.readTree(value);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid aggregate document", e);
    }
  }

  static void synchronize(
      JdbcTemplate jdbc,
      String table,
      String ownerColumn,
      String owner,
      String targetColumn,
      Map<String, String> desired,
      boolean statuses) {
    // Identifiers are constants supplied by repositories, never request values.
    var existing = new HashMap<String, String>();
    for (var row :
        jdbc.queryForList(
            "SELECT "
                + targetColumn
                + (statuses ? ",status" : "")
                + " FROM "
                + table
                + " WHERE "
                + ownerColumn
                + "=?",
            owner))
      existing.put((String) row.get(targetColumn), statuses ? (String) row.get("status") : "");
    for (var entry : desired.entrySet()) {
      if (!existing.containsKey(entry.getKey())) {
        if (statuses)
          jdbc.update(
              "INSERT INTO "
                  + table
                  + "("
                  + ownerColumn
                  + ","
                  + targetColumn
                  + ",status) VALUES(?,?,?)",
              owner,
              entry.getKey(),
              entry.getValue());
        else
          jdbc.update(
              "INSERT INTO " + table + "(" + ownerColumn + "," + targetColumn + ") VALUES(?,?)",
              owner,
              entry.getKey());
      } else if (statuses && !Objects.equals(existing.get(entry.getKey()), entry.getValue()))
        jdbc.update(
            "UPDATE "
                + table
                + " SET status=? WHERE "
                + ownerColumn
                + "=? AND "
                + targetColumn
                + "=?",
            entry.getValue(),
            owner,
            entry.getKey());
    }
    for (String target : existing.keySet())
      if (!desired.containsKey(target))
        jdbc.update(
            "DELETE FROM " + table + " WHERE " + ownerColumn + "=? AND " + targetColumn + "=?",
            owner,
            target);
  }
}
