package vn.codegrade.controller;

import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class MetaController {
  @GetMapping("/api/health")
  public Object health() {
    return Map.of("status", "UP", "service", "CodeGrade Network");
  }

  @GetMapping("/api/meta")
  public Object meta() {
    return Map.of(
        "protocolVersion",
        1,
        "roles",
        List.of("ADMIN", "AUTHOR", "CODER"),
        "difficulties",
        List.of(1, 2, 3, 4, 5, 6),
        "languages",
        List.of("CPP11", "CPP17", "CPP20", "PY311"),
        "questionTypes",
        List.of(
            Map.of(
                "id",
                "python3",
                "description",
                "Python 3.11: định nghĩa hàm, testcode được nối sau bài làm"),
            Map.of(
                "id", "python3_program", "description", "Python 3.11: chương trình stdin/stdout"),
            Map.of("id", "cpp_program", "description", "C++11/17/20: chương trình stdin/stdout"),
            Map.of(
                "id", "cpp_function", "description", "C++11/17/20: hàm, testcode đặt trong main")));
  }
}
