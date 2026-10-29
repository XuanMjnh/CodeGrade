package vn.codegrade;
import org.junit.jupiter.api.*;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import vn.codegrade.catalog.QuestionRules;
import vn.codegrade.db.Store.Fault;
import vn.codegrade.judge.Submissions;
import static org.junit.jupiter.api.Assertions.*;
class QuestionRulesTest {
 ObjectNode q;
 @BeforeEach void setup() throws Exception {q=(ObjectNode)new ObjectMapper().readTree(getClass().getResourceAsStream("/dataset.json")).get(0).deepCopy();}
 @Test void programAllowsEmptyTestcodeAndEmptyExpected() {((ObjectNode)q.path("testcases").get(0)).put("expected","");assertDoesNotThrow(()->QuestionRules.validate(q));}
 @Test void undefinedRejected() {q.put("coderunnertype","Undefined");assertThrows(Fault.class,()->QuestionRules.validate(q));}
 @Test void testcodeAllOrNone() {((ObjectNode)q.path("testcases").get(0)).put("testcode","print(f())");assertThrows(Fault.class,()->QuestionRules.validate(q));}
 @Test void displayDoesNotSkipHiddenTests() {assertEquals(q.path("testcases").size(),QuestionRules.active(q).size());assertEquals("HIDE",q.path("testcases").get(1).path("display").asText());}
 @Test void entireBundledBankIsExecutableWithoutExposingReferenceAnswers() throws Exception {
  var bank=new ObjectMapper().readTree(getClass().getResourceAsStream("/dataset.json"));
  assertEquals(320,bank.size());var levels=new java.util.HashSet<Integer>();var counts=new java.util.HashMap<String,Integer>();
  for(var item:bank){assertDoesNotThrow(()->QuestionRules.validate(item));assertFalse(item.path("answer").path("sampleAnswer").asText().isBlank());levels.add(item.path("difficulty").asInt());counts.merge(item.path("general").path("categoryId").asText(),1,Integer::sum);assertEquals(5,item.path("testcases").size());}
  assertEquals(java.util.Set.of(1,2,3,4,5,6),levels);assertEquals(java.util.Map.of("arithmetic",54,"arrays",54,"strings",53,"numbertheory",53,"sequences",53,"graphs",53),counts);
 }
 @Test void examplesModeNeedsExample() {for(var t:q.path("testcases"))((ObjectNode)t).put("useasexample",false);assertThrows(Fault.class,()->QuestionRules.validate(q));}
 @Test void negativeMarkRejected() {((ObjectNode)q.path("testcases").get(0)).put("mark",-0.1);assertThrows(Fault.class,()->QuestionRules.validate(q));}
 @Test void comparisonIgnoresFinalNewlinesButPreservesOtherWhitespaceAndRegex() {
  assertTrue(Submissions.compare("5\r\n","5\n","EqualityGrader"));
  assertTrue(Submissions.compare("5","5\n","EqualityGrader"));
  assertTrue(Submissions.compare("5\n","5","EqualityGrader"));
  assertTrue(Submissions.compare("5\r\n\r\n","5","EqualityGrader"));
  assertTrue(Submissions.compare("","\n","EqualityGrader"));
  assertTrue(Submissions.compare("first\nsecond\n","first\nsecond","EqualityGrader"));
  assertFalse(Submissions.compare("first\nsecond","firstsecond","EqualityGrader"));
  assertFalse(Submissions.compare("\n5","5","EqualityGrader"));
  assertFalse(Submissions.compare("5 ","5","EqualityGrader"));
  assertFalse(Submissions.compare("5 \n","5\n","EqualityGrader"));
  assertTrue(Submissions.compare("1.0000001","1","NearEqualityGrader"));
  assertTrue(Submissions.compare("123\n","[0-9]+\\n","RegexGrader"));
  assertFalse(Submissions.compare("123","[0-9]+\\n","RegexGrader"));
 }
 @Test void allEmptyRejected() {q.putArray("testcases");assertThrows(Fault.class,()->QuestionRules.validate(q));}
 @Test void advancedUnimplementedEngineCanOnlyBeDraft() {
  q.put("twigall",true);assertThrows(Fault.class,()->QuestionRules.validate(q));
  ((ObjectNode)q.path("general")).put("status","draft");assertDoesNotThrow(()->QuestionRules.validate(q));
 }
 @Test void limitsAndSixDifficulties() {
  for(int d=1;d<=6;d++){q.put("difficulty",d);assertDoesNotThrow(()->QuestionRules.validate(q));}
  q.put("difficulty",7);assertThrows(Fault.class,()->QuestionRules.validate(q));
 }
}
