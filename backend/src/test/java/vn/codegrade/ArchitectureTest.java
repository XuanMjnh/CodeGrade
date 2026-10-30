package vn.codegrade;

import static org.junit.jupiter.api.Assertions.*;

import java.nio.file.*;
import java.util.List;
import org.junit.jupiter.api.Test;

class ArchitectureTest {
  @Test
  void transportAndBusinessLayersCannotAccessJdbcOrRepositoriesDirectlyFromControllers()
      throws Exception {
    Path root = Path.of("src/main/java/vn/codegrade");
    for (String layer : List.of("controller", "service", "model")) {
      try (var files = Files.walk(root.resolve(layer))) {
        for (Path file : files.filter(p -> p.toString().endsWith(".java")).toList()) {
          String source = Files.readString(file);
          assertFalse(source.contains("org.springframework.jdbc"), file + " must not access JDBC");
          assertFalse(
              source.contains("javax.sql.DataSource"), file + " must not access a DataSource");
          if (layer.equals("controller"))
            assertFalse(source.contains("vn.codegrade.repository"), file + " must call a service");
          if (layer.equals("service"))
            assertFalse(
                source.contains("vn.codegrade.controller"), file + " must not depend on transport");
          if (layer.equals("model"))
            assertFalse(
                source.contains("org.springframework"),
                file + " must remain independent of Spring");
        }
      }
    }
  }

  @Test
  void repositoriesDoNotDependOnServicesOrTransport() throws Exception {
    try (var files = Files.walk(Path.of("src/main/java/vn/codegrade/repository"))) {
      for (Path file : files.filter(p -> p.toString().endsWith(".java")).toList()) {
        String source = Files.readString(file);
        assertFalse(source.contains("vn.codegrade.service"), file + " must not call a service");
        assertFalse(
            source.contains("vn.codegrade.controller"), file + " must not access transport");
      }
    }
  }
}
