package vn.codegrade;
import org.junit.jupiter.api.Test;
import vn.codegrade.room.Progression;
import java.util.*;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
class ProgressionTest {
 @Test void expectedScoresReflectActualRatings() {
  assertEquals(.5,Progression.expected(1000,1000),1e-12);
  assertEquals(10.0/11,Progression.expected(1600,1200),1e-12);
  assertEquals(1,Progression.expected(1600,1200)+Progression.expected(1200,1600),1e-12);
 }
 @Test void multiplayerUsesAllFourOpponentsAndSnapshotOrderDoesNotMatter() {
  var r=new LinkedHashMap<String,Integer>();r.put("a",1000);r.put("b",1000);r.put("c",1000);r.put("d",1000);r.put("e",1000);
  var ranks=Map.of("a",1,"b",2,"c",3,"d",4,"e",5);
  assertEquals(Map.of("a",16,"b",8,"c",0,"d",-8,"e",-16),Progression.elo(r,ranks,32));
  r.put("a",1400);r.put("e",1200);var original=Progression.elo(r,ranks,32);
  var reversed=new LinkedHashMap<String,Integer>();r.sequencedEntrySet().reversed().forEach(e->reversed.put(e.getKey(),e.getValue()));
  assertEquals(original,Progression.elo(reversed,ranks,32));
 }
 @Test void upsetGivesMoreRatingAndTiesUseHalfPoint() {
  var ranks=Map.of("a",1,"b",2,"c",3,"d",4,"e",5);
  var strong=Progression.elo(Map.of("a",1400,"b",1000,"c",1000,"d",1000,"e",1000),ranks,32);
  var weak=Progression.elo(Map.of("a",1000,"b",1400,"c",1400,"d",1400,"e",1400),ranks,32);
  assertTrue(strong.get("a")<weak.get("a"));
  assertEquals(Map.of("a",0,"b",0,"c",0,"d",0,"e",0),Progression.elo(Map.of("a",1000,"b",1000,"c",1000,"d",1000,"e",1000),Map.of("a",1,"b",1,"c",1,"d",1,"e",1),32));
 }
 @Test void levelsHaveDeterministicBoundaries() {assertEquals(1,Progression.level(0));assertEquals(1,Progression.level(99));assertEquals(2,Progression.level(100));assertEquals(3,Progression.level(400));}
 @Test void earlyTiersBoostGainsWithoutIncreasingLossesOrChangingZeroResults() {
  var progression=new Progression(null);
  var ranks=Map.of("a",1,"b",2,"c",3,"d",4,"e",5);
  int[] ratings={1000,1100,1300,1500,1700,1900},wins={48,32,24,16,16,16};
  for(int i=0;i<ratings.length;i++) {
   int rating=ratings[i];var same=Map.of("a",rating,"b",rating,"c",rating,"d",rating,"e",rating);
   var gains=progression.rankedDeltas(same,ranks);
   assertEquals(wins[i],gains.get("a"));assertEquals(wins[i]/2,gains.get("b"));
   assertEquals(0,gains.get("c"));assertEquals(-8,gains.get("d"));assertEquals(-16,gains.get("e"));
   assertEquals(Map.of("a",0,"b",0,"c",0,"d",0,"e",0),progression.rankedDeltas(same,Map.of("a",1,"b",1,"c",1,"d",1,"e",1)));
  }
 }
 @Test void promotionBonusUsesTheRankAtMatchStart() {
  var progression=new Progression(null);var ranks=Map.of("a",1,"b",2,"c",3,"d",4,"e",5);
  assertEquals(48,progression.rankedDeltas(Map.of("a",1099,"b",1099,"c",1099,"d",1099,"e",1099),ranks).get("a"));
  assertEquals(32,progression.rankedDeltas(Map.of("a",1100,"b",1100,"c",1100,"d",1100,"e",1100),ranks).get("a"));
 }
 @Test void invalidOrIncreasingGainMultipliersAreRejected() {
  for(double[] multipliers:List.of(new double[]{3,2,1},new double[]{3,2,1.5,1,1,Double.NaN},new double[]{3,2,0.5,1,1,1},new double[]{3,4,1.5,1,1,1},new double[]{5,2,1.5,1,1,1})) {
   var progression=new Progression(null);ReflectionTestUtils.setField(progression,"gainMultipliers",multipliers);
   assertThrows(vn.codegrade.db.Store.Fault.class,progression::validateConfiguration);
  }
 }
}
