package vn.codegrade;

import static org.junit.jupiter.api.Assertions.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import vn.codegrade.model.RoundRanking;

class FairnessExperimentTest {
  @Test
  void measureCompletionOrderBaselineAgainstAdmissionOrder() throws Exception {
    int trials = 10000, n = 10, slots = 7, baselineWrong = 0, proposedWrong = 0, late = 0;
    long seed = 20261024L;
    Random random = new Random(seed);
    var raw = new ArrayList<Object>();
    long begin = System.nanoTime();
    for (int t = 0; t < trials; t++) {
      var attempts = new ArrayList<RoundRanking.Attempt>();
      Map<String, Long> completion = new HashMap<>();
      for (int i = 0; i < n; i++) {
        String id = "p" + i;
        long received = 1000 + random.nextInt(118001), finished = received + random.nextInt(60001);
        attempts.add(new RoundRanking.Attempt(id, "AC", 100, received));
        completion.put(id, finished);
        if (finished > 120000) late++;
      }
      var ids = attempts.stream().map(RoundRanking.Attempt::user).toList();
      var gold =
          attempts.stream()
              .sorted(Comparator.comparingLong(RoundRanking.Attempt::receivedAt))
              .limit(slots)
              .map(RoundRanking.Attempt::user)
              .collect(java.util.stream.Collectors.toSet());
      var fifo =
          ids.stream()
              .sorted(Comparator.comparingLong(completion::get))
              .limit(slots)
              .collect(java.util.stream.Collectors.toSet());
      var proposed =
          RoundRanking.rank(ids, attempts, 0).stream()
              .limit(slots)
              .map(RoundRanking.Rank::userId)
              .collect(java.util.stream.Collectors.toSet());
      if (!gold.equals(fifo)) baselineWrong++;
      if (!gold.equals(proposed)) proposedWrong++;
      if (t < 100)
        raw.add(
            Map.of(
                "trial",
                t,
                "received",
                attempts,
                "completedAt",
                completion,
                "gold",
                gold,
                "baseline",
                fifo,
                "proposed",
                proposed));
    }
    var result = new LinkedHashMap<String, Object>();
    result.put(
        "kind",
        "seeded simulation using the production Java ranking function; not network latency");
    result.put("seed", seed);
    result.put("trials", trials);
    result.put("players", n);
    result.put("survivors", slots);
    result.put("receiptWindowMs", List.of(1000, 119000));
    result.put("workerDelayMs", List.of(0, 60000));
    result.put("baselineCutoffDisagreements", baselineWrong);
    result.put("proposedCutoffDisagreements", proposedWrong);
    result.put("onTimeJobsCompletingAfterDeadline", late);
    result.put("elapsedMs", (System.nanoTime() - begin) / 1e6);
    result.put("first100Trials", raw);
    String destination = System.getProperty("experiment.output");
    if (destination != null) {
      Path p = Path.of(destination);
      Files.createDirectories(p.toAbsolutePath().getParent());
      new ObjectMapper().writerWithDefaultPrettyPrinter().writeValue(p.toFile(), result);
    }
    System.out.println(
        "FAIRNESS_EXPERIMENT "
            + new ObjectMapper()
                .writeValueAsString(
                    Map.of(
                        "trials",
                        trials,
                        "baselineDisagreements",
                        baselineWrong,
                        "proposedDisagreements",
                        proposedWrong,
                        "lateJobs",
                        late)));
    assertEquals(0, proposedWrong);
    assertTrue(baselineWrong > 0);
    assertTrue(late > 0);
  }
}
