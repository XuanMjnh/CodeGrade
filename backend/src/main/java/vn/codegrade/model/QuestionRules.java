package vn.codegrade.model;

import static vn.codegrade.model.Validation.require;

import com.fasterxml.jackson.databind.JsonNode;
import com.google.re2j.Pattern;
import java.util.*;

/** CodeRunner schema validation; no code is executed by the application server. */
public final class QuestionRules {
  public static final Set<String> TYPES =
      Set.of("python3", "python3_program", "cpp_program", "cpp_function");
  public static final Set<String> LANGUAGES = Set.of("CPP11", "CPP17", "CPP20", "PY311");

  public static List<JsonNode> active(JsonNode q) {
    var tests = new ArrayList<JsonNode>();
    for (var t : q.path("testcases"))
      if (!t.path("testcode").asText().isEmpty()
          || !t.path("stdin").asText().isEmpty()
          || !t.path("expected").asText().isEmpty()) tests.add(t);
    tests.sort(Comparator.comparingInt(t -> t.path("ordering").asInt()));
    return tests;
  }

  public static void validate(JsonNode q) {
    require(
        TYPES.contains(q.path("coderunnertype").asText()), "Cần chọn Question type được hỗ trợ");
    var g = q.path("general");
    require(
        !g.path("questionName").asText().isBlank()
            && g.path("questionName").asText().length() <= 200,
        "Question name cần 1–200 ký tự");
    require(!g.path("questionText").asText().isBlank(), "Question text không được trống");
    require(
        g.path("defaultMark").isNumber() && g.path("defaultMark").asDouble(0) > 0,
        "Default mark phải là số dương");
    require(
        Set.of("draft", "ready").contains(g.path("status").asText()),
        "Status phải draft hoặc ready");
    integer(q, "answerboxlines", 1, 200);
    integer(q, "precheck", 0, 4);
    integer(q, "giveupallowed", 0, 2);
    integer(q, "displayfeedback", 0, 2);
    integer(q, "difficulty", 1, 6);
    require(
        q.path("testcases").isArray() && q.path("testcases").size() <= 5,
        "Tối đa 5 testcase; đề công bố cần đúng 5");
    var tests = active(q);
    int proto = q.path("advancedCustomisation").path("prototypetype").asInt(0);
    require(proto != 1, "Không tạo prototype built-in từ giao diện");
    require(!tests.isEmpty() || proto == 2, "Cần ít nhất một test case có nội dung");
    boolean anyCode = tests.stream().anyMatch(t -> !t.path("testcode").asText().isEmpty());
    Set<String> ids = new HashSet<>();
    for (var t : q.path("testcases")) {
      require(
          t.path("id").isTextual() && ids.add(t.path("id").asText()), "ID test case phải duy nhất");
      for (String k : List.of("testcode", "stdin", "expected", "extra")) {
        require(t.path(k).isTextual(), k + " phải là chuỗi (có thể rỗng)");
        require(t.path(k).asText().length() <= 65536, k + " quá 64 KiB");
      }
      require(
          Set.of("SHOW", "HIDE", "HIDE_IF_FAIL", "HIDE_IF_SUCCEED")
              .contains(t.path("display").asText()),
          "Display không hợp lệ");
      require(
          t.path("mark").isNumber()
              && t.path("mark").asDouble() >= 0
              && Double.isFinite(t.path("mark").asDouble()),
          "Mark phải không âm");
      integer(t, "ordering", -1_000_000, 1_000_000);
      integer(t, "testtype", 0, 2);
    }
    require(
        !anyCode || tests.stream().allMatch(t -> !t.path("testcode").asText().isEmpty()),
        "Testcode phải có ở tất cả hoặc không có ở mọi test có nội dung");
    if (q.path("precheck").asInt() == 2)
      require(
          tests.stream().anyMatch(t -> t.path("useasexample").asBoolean()),
          "Precheck Examples cần ít nhất một Use as example");
    jsonValue(q.path("uiparameters").asText(), "UI parameters");
    jsonValue(q.path("customisation").path("resultcolumns").asText(), "Result columns");
    jsonValue(q.path("advancedCustomisation").path("sandboxparams").asText(), "Sandbox params");
    if (q.path("templateparamslang").asText().equals("None"))
      jsonValue(q.path("templateparams").asText(), "Template params");
    String penalty = q.path("penaltyregime").asText();
    require(
        penalty.isBlank()
            || penalty.matches(
                "\\s*\\d+(?:\\.\\d+)?(?:\\s*,\\s*\\d+(?:\\.\\d+)?)*(?:\\s*,\\s*\\.\\.\\.)?\\s*"),
        "Penalty regime không hợp lệ");
    var a = q.path("attachments");
    int n = a.path("attachments").asInt(), need = a.path("attachmentsrequired").asInt();
    require(
        Set.of(-1, 0, 1, 2, 3).contains(n) && need >= 0 && need <= 3 && (n == -1 || need <= n),
        "Attachment options không hợp lệ");
    if (!a.path("filenamesregex").asText().isBlank()) regex(a.path("filenamesregex").asText());
    var adv = q.path("advancedCustomisation");
    require(
        adv.path("cputimelimitsecs").isNull()
            || adv.path("cputimelimitsecs").isMissingNode()
            || (adv.path("cputimelimitsecs").asInt() > 0
                && adv.path("cputimelimitsecs").asInt() <= 10),
        "CPU limit phải 1–10 giây");
    require(
        adv.path("memlimitmb").isNull()
            || adv.path("memlimitmb").isMissingNode()
            || (adv.path("memlimitmb").asInt() >= 0 && adv.path("memlimitmb").asInt() <= 512),
        "RAM phải 0–512 MB");
    require(
        q.path("languages").isArray() && !q.path("languages").isEmpty(),
        "Chọn ít nhất một ngôn ngữ");
    for (var l : q.path("languages"))
      require(LANGUAGES.contains(l.asText()), "Ngôn ngữ không được hỗ trợ");
    if (g.path("status").asText().equals("ready")) executable(q);
  }

  public static void executable(JsonNode q) {
    executable(q, true);
  }

  /** Only for frozen rooms/contests already active when the five-case bank was installed. */
  public static void executableSnapshot(JsonNode q) {
    executable(q, false);
  }

  private static void executable(JsonNode q, boolean fiveCases) {
    if (fiveCases)
      require(
          q.path("testcases").size() == 5 && active(q).size() == 5,
          "Đề dùng để chấm cần đúng 5 testcase có nội dung");
    var c = q.path("customisation");
    var a = q.path("advancedCustomisation");
    require(!active(q).isEmpty(), "Đề công bố phải có test case");
    require(
        !c.path("iscombinatortemplate").asBoolean()
            && c.path("template").asText().isBlank()
            && !q.path("twigall").asBoolean()
            && Set.of("None", "").contains(q.path("templateparamslang").asText())
            && a.path("prototypetype").asInt() == 0,
        "Twig/combinator/preprocessor/prototype chỉ lưu cấu hình draft; chưa tích hợp Moodle"
            + " engine");
    require(
        Set.of("EqualityGrader", "NearEqualityGrader", "RegexGrader")
            .contains(c.path("grader").asText("EqualityGrader")),
        "TemplateGrader chỉ lưu draft");
    require(
        q.path("datafiles").isEmpty()
            && q.path("answer").path("sampleAnswerAttachments").isEmpty()
            && q.path("attachments").path("attachments").asInt() == 0,
        "Bản runner này nhận source code, chưa nhận file hỗ trợ/attachments");
    if (q.path("coderunnertype").asText().equals("cpp_function"))
      for (var l : q.path("languages"))
        require(l.asText().startsWith("CPP"), "Prototype C++ chỉ chấm C++11/17/20");
    if (q.path("coderunnertype").asText().equals("python3"))
      for (var l : q.path("languages"))
        require(l.asText().equals("PY311"), "Prototype Python chỉ chấm Python 3.11");
    if (q.path("coderunnertype").asText().endsWith("_program"))
      require(
          active(q).stream().allMatch(t -> t.path("testcode").asText().isBlank()),
          "Program prototype dùng stdin; hãy dùng function prototype cho testcode");
    var official = active(q).stream().filter(t -> t.path("testtype").asInt() != 1).toList();
    require(
        !official.isEmpty()
            && official.stream().mapToDouble(t -> t.path("mark").asDouble(1)).sum() > 0,
        "Cần test Check có tổng mark > 0");
    if (c.path("grader").asText().equals("RegexGrader"))
      for (var t : active(q)) regex(t.path("expected").asText());
  }

  private static void regex(String s) {
    try {
      Pattern.compile(s);
    } catch (Exception e) {
      require(false, "Regex không hợp lệ hoặc không được RE2 hỗ trợ");
    }
  }

  private static void jsonValue(String value, String label) {
    if (value.isBlank()) return;
    try {
      new com.fasterxml.jackson.databind.ObjectMapper().readTree(value);
    } catch (Exception e) {
      require(false, label + " phải là JSON hợp lệ");
    }
  }

  private static void integer(JsonNode q, String k, int min, int max) {
    require(
        q.path(k).isIntegralNumber() && q.path(k).asInt() >= min && q.path(k).asInt() <= max,
        k + " phải là số nguyên trong [" + min + "," + max + "]");
  }
}
