package vn.codegrade.worker;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import java.io.*;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

/** Network-only Java worker. It never connects to MySQL or runs submissions on the host. */
public final class WorkerMain {
  private static final ObjectMapper JSON = new ObjectMapper();
  private static final String URL =
      System.getenv().getOrDefault("WORKER_URL", "ws://localhost:8080/worker-ws");
  private static final String TOKEN = System.getenv().getOrDefault("WORKER_TOKEN", "");
  private static final String IMAGE =
      System.getenv().getOrDefault("SANDBOX_IMAGE", "codegrade-sandbox:5");
  private static final String ID =
      System.getenv()
          .getOrDefault("WORKER_ID", "worker-" + UUID.randomUUID().toString().substring(0, 8));

  private static class Link implements WebSocket.Listener, AutoCloseable {
    WebSocket ws;
    final Map<String, CompletableFuture<JsonNode>> pending = new ConcurrentHashMap<>();
    final StringBuilder buffer = new StringBuilder();

    Link() throws Exception {
      ws =
          HttpClient.newBuilder()
              .connectTimeout(Duration.ofSeconds(10))
              .build()
              .newWebSocketBuilder()
              .connectTimeout(Duration.ofSeconds(10))
              .buildAsync(URI.create(URL), this)
              .get(15, TimeUnit.SECONDS);
    }

    @Override
    public void onOpen(WebSocket ws) {
      ws.request(1);
    }

    @Override
    public CompletionStage<?> onText(WebSocket ws, CharSequence text, boolean last) {
      buffer.append(text);
      if (last) {
        try {
          JsonNode m = JSON.readTree(buffer.toString());
          var future = pending.remove(m.path("requestId").asText());
          if (future != null) future.complete(m);
        } catch (Exception e) {
          onError(ws, e);
        } finally {
          buffer.setLength(0);
        }
      }
      ws.request(1);
      return CompletableFuture.completedFuture(null);
    }

    @Override
    public void onError(WebSocket ws, Throwable error) {
      pending.values().forEach(f -> f.completeExceptionally(error));
      pending.clear();
    }

    @Override
    public CompletionStage<?> onClose(WebSocket ws, int code, String reason) {
      onError(ws, new IOException("Worker socket closed"));
      return CompletableFuture.completedFuture(null);
    }

    JsonNode call(String type, Object payload) throws Exception {
      String id = UUID.randomUUID().toString();
      var future = new CompletableFuture<JsonNode>();
      pending.put(id, future);
      try {
        synchronized (this) {
          ws.sendText(
                  JSON.writeValueAsString(
                      Map.of("v", 1, "type", type, "requestId", id, "payload", payload)),
                  true)
              .get(5, TimeUnit.SECONDS);
        }
        JsonNode result = future.get(15, TimeUnit.SECONDS);
        if (!result.path("ok").asBoolean()) throw new IOException(result.path("error").asText());
        return result.path("data");
      } finally {
        pending.remove(id);
      }
    }

    @Override
    public void close() {
      ws.abort();
    }
  }

  public static void run() throws Exception {
    if (TOKEN.length() < 32)
      throw new IllegalStateException("WORKER_TOKEN must contain at least 32 characters");
    // Fail closed: never switch to local execution if Docker is unavailable.
    command(List.of("docker", "image", "inspect", IMAGE), 20, "");
    ScheduledExecutorService heart = Executors.newSingleThreadScheduledExecutor();
    AtomicReference<JsonNode> active = new AtomicReference<>();
    AtomicReference<Link> current = new AtomicReference<>();
    heart.scheduleWithFixedDelay(
        () -> {
          var job = active.get();
          var link = current.get();
          if (job != null && link != null)
            try {
              link.call(
                  "HEARTBEAT",
                  Map.of(
                      "id",
                      job.path("id").asText(),
                      "leaseToken",
                      job.path("leaseToken").asText()));
            } catch (Exception e) {
              System.err.println("Heartbeat deferred; stale lease results will be rejected");
            }
        },
        5,
        5,
        TimeUnit.SECONDS);
    Runtime.getRuntime().addShutdownHook(new Thread(heart::shutdownNow));
    while (!Thread.currentThread().isInterrupted()) {
      try (Link link = new Link()) {
        current.set(link);
        link.call("WORKER_AUTH", Map.of("token", TOKEN, "workerId", ID));
        System.out.println("Worker connected: " + ID);
        while (true) {
          JsonNode job = link.call("CLAIM", Map.of());
          if (!job.path("job").asBoolean()) {
            Thread.sleep(500);
            continue;
          }
          active.set(job);
          ObjectNode result = grade(job, link);
          link.call("RESULT", result);
          active.set(null);
        }
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
      } catch (Exception e) {
        active.set(null);
        current.set(null);
        System.err.println("Worker reconnecting: " + e.getClass().getSimpleName());
        Thread.sleep(2000);
      }
    }
  }

  private static ObjectNode grade(JsonNode job, Link link) {
    ObjectNode result =
        JSON.createObjectNode()
            .put("id", job.path("id").asText())
            .put("leaseToken", job.path("leaseToken").asText());
    ArrayNode cases = result.putArray("cases");
    try {
      for (var test : job.path("runner").path("tests")) {
        link.call(
            "PROGRESS",
            Map.of(
                "id",
                job.path("id").asText(),
                "leaseToken",
                job.path("leaseToken").asText(),
                "currentTest",
                cases.size() + 1,
                "completedTests",
                cases.size()));
        ObjectNode payload =
            JSON.createObjectNode()
                .put("source", job.path("source").asText())
                .put("language", job.path("language").asText())
                .put("testcode", test.path("testcode").asText())
                .put("stdin", test.path("stdin").asText())
                .put("type", job.path("runner").path("type").asText())
                .put("globalExtra", job.path("runner").path("globalExtra").asText())
                .put("seconds", job.path("runner").path("seconds").asInt(2))
                .put(
                    "memoryMb",
                    Math.min(512, Math.max(64, job.path("runner").path("memoryMb").asInt(256))));
        String name = "cg-" + UUID.randomUUID().toString().replace("-", "");
        try {
          List<String> args =
              new ArrayList<>(
                  List.of(
                      "docker",
                      "run",
                      "-i",
                      "--name",
                      name,
                      "--label",
                      "codegrade.managed=true",
                      "--network",
                      "none",
                      "--read-only",
                      "--user",
                      "65534:65534",
                      "--cap-drop",
                      "ALL",
                      "--security-opt",
                      "no-new-privileges:true",
                      "--pids-limit",
                      "32",
                      "--cpus",
                      "1",
                      "--memory",
                      "512m",
                      "--memory-swap",
                      "512m",
                      "--ulimit",
                      "nofile=64:64",
                      "--ulimit",
                      "fsize=16777216:16777216",
                      "--ulimit",
                      "core=0:0",
                      "--log-driver",
                      "none",
                      "--tmpfs",
                      "/work:rw,exec,nosuid,nodev,size=67108864,mode=1777",
                      "--tmpfs",
                      "/tmp:rw,noexec,nosuid,nodev,size=8388608,mode=1777",
                      IMAGE,
                      "python3.11",
                      "-I",
                      "-S",
                      "/opt/sandbox.py"));
          String raw;
          try {
            raw =
                command(
                    args,
                    job.path("runner").path("seconds").asInt(2) + 30,
                    JSON.writeValueAsString(payload));
          } catch (Exception failed) {
            String oom =
                command(
                    List.of("docker", "inspect", "--format", "{{.State.OOMKilled}}", name), 10, "");
            if (oom.trim().equals("true")) {
              cases.add(
                  JSON.createObjectNode()
                      .put("verdict", "MLE")
                      .put("stdout", "")
                      .put("timeMs", 0)
                      .put("compileMs", 0));
              continue;
            }
            throw failed;
          }
          JsonNode run = JSON.readTree(raw);
          if (!run.has("verdict")) throw new IOException("Invalid sandbox reply");
          cases.add(run);
          if (!result.has("diagnostic") && !run.path("diagnostic").asText().isBlank())
            result.put("diagnostic", run.path("diagnostic").asText());
        } finally {
          try {
            command(List.of("docker", "rm", "-f", name), 10, "");
          } catch (Exception ignored) {
          }
        }
      }
    } catch (Exception e) {
      result.put("systemError", true);
      result.put("diagnostic", "Sandbox infrastructure unavailable");
    }
    return result;
  }

  private static String command(List<String> command, int seconds, String input) throws Exception {
    Process p = new ProcessBuilder(command).start();
    ExecutorService io = Executors.newVirtualThreadPerTaskExecutor();
    var out = io.submit(() -> readBounded(p.getInputStream(), 600_000));
    var err = io.submit(() -> readBounded(p.getErrorStream(), 16_384));
    try {
      p.getOutputStream().write(input.getBytes(StandardCharsets.UTF_8));
      p.getOutputStream().close();
      if (!p.waitFor(seconds, TimeUnit.SECONDS)) {
        p.destroyForcibly();
        throw new IOException("Docker timeout");
      }
      String stdout = out.get(5, TimeUnit.SECONDS), stderr = err.get(5, TimeUnit.SECONDS);
      if (p.exitValue() != 0)
        throw new IOException(
            "Docker infrastructure failed ("
                + p.exitValue()
                + "): "
                + stderr.substring(0, Math.min(500, stderr.length())));
      return stdout;
    } finally {
      p.destroyForcibly();
      io.shutdownNow();
    }
  }

  private static String readBounded(InputStream in, int max) throws IOException {
    ByteArrayOutputStream b = new ByteArrayOutputStream();
    byte[] buf = new byte[4096];
    int n;
    while ((n = in.read(buf)) != -1) {
      if (b.size() + n > max) throw new IOException("Docker reply exceeds bound");
      b.write(buf, 0, n);
    }
    return b.toString(StandardCharsets.UTF_8);
  }
}
