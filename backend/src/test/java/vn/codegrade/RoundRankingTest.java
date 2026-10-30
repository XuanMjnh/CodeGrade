package vn.codegrade;

import static org.junit.jupiter.api.Assertions.*;
import static vn.codegrade.model.RoundRanking.*;

import java.util.*;
import org.junit.jupiter.api.Test;

class RoundRankingTest {
  @Test
  void wrongPenaltyCanLoseToLaterAc() {
    var a =
        List.of(
            new Attempt("A", "WA", 0, 30000),
            new Attempt("A", "AC", 100, 48000),
            new Attempt("B", "AC", 100, 55000),
            new Attempt("C", "AC", 100, 70000));
    assertEquals(
        List.of("B", "A", "C"),
        rank(List.of("A", "B", "C"), a, 0).stream().map(Rank::userId).toList());
  }

  @Test
  void bestPartialIsNotSumAndAcAlwaysFirst() {
    var a =
        List.of(
            new Attempt("A", "WA", 60, 1),
            new Attempt("A", "WA", 70, 2),
            new Attempt("B", "WA", 80, 3),
            new Attempt("C", "AC", 100, 100000));
    var r = rank(List.of("A", "B", "C"), a, 0);
    assertEquals("C", r.getFirst().userId());
    assertEquals(70, r.getLast().score());
    assertEquals("B", r.get(1).userId());
  }

  @Test
  void systemErrorsDontCountAsWrong() {
    var r =
        rank(
                List.of("A"),
                List.of(new Attempt("A", "SE", 0, 10), new Attempt("A", "AC", 100, 20)),
                0)
            .getFirst();
    assertEquals(0, r.wrong());
    assertEquals(1, r.attempts());
    assertEquals(20, r.effectiveMs());
  }

  @Test
  void completionPermutationDoesNotChangeOutcome() {
    var a =
        new ArrayList<>(
            List.of(
                new Attempt("A", "AC", 100, 30),
                new Attempt("B", "AC", 100, 20),
                new Attempt("C", "WA", 99, 10)));
    var expected = rank(List.of("A", "B", "C"), a, 0);
    for (int seed = 0; seed < 100; seed++) {
      Collections.shuffle(a, new Random(seed));
      assertEquals(expected, rank(List.of("A", "B", "C"), a, 0));
    }
  }

  @Test
  void noSubmissionRemainsTiedRatherThanRandomElimination() {
    var r = rank(List.of("a", "b"), List.of(), 0);
    assertTrue(tied(r.get(0), r.get(1)));
  }

  @Test
  void tiesUseReceiptThenFewerAttempts() {
    var r =
        rank(
            List.of("A", "B"),
            List.of(new Attempt("A", "WA", 50, 5), new Attempt("B", "WA", 50, 10)),
            0);
    assertEquals("A", r.getFirst().userId());
  }

  @Test
  void populationPathsMatchRules() {
    assertEquals(7, survivors(10));
    assertEquals(4, survivors(7));
    assertEquals(2, survivors(4));
    assertEquals(1, survivors(2));
    for (int n = 5; n <= 10; n++) assertEquals(n <= 7 ? 3 : 4, mainRounds(n));
  }
}
