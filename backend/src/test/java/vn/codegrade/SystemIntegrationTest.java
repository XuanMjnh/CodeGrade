package vn.codegrade;

import org.junit.jupiter.api.*;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.beans.factory.annotation.Autowired;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.*;
import vn.codegrade.db.Store;
import vn.codegrade.auth.Identity;
import vn.codegrade.auth.Identity.User;
import vn.codegrade.catalog.*;
import vn.codegrade.room.Survival;
import vn.codegrade.judge.Submissions;
import vn.codegrade.protocol.Commands;
import vn.codegrade.protocol.ClientSocket;
import org.springframework.boot.test.web.server.LocalServerPort;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment=SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class SystemIntegrationTest {
 @Autowired Store db; @Autowired Identity identity; @Autowired Catalog catalog; @Autowired Commands commands;
 @Autowired Submissions judge; @Autowired Survival rooms; @Autowired Contests contests;
 @Autowired ClientSocket clients; @LocalServerPort int port;
 @Autowired vn.codegrade.room.Matchmaking matchmaking; @Autowired vn.codegrade.room.Progression progression;
 User admin,author;List<User> coders;ObjectNode fixture;
 @BeforeEach void setup() throws Exception {
  db.atomic(()->{
   for(String t:List.of("reward_events","match_results","match_queue","progression","room_presence","submissions","rooms","contests","solved","commands","drafts","events","audit","problems","sessions","users","categories"))db.sql.update("DELETE FROM "+t);
   db.sql.update("INSERT INTO categories VALUES('algorithms','Algorithms','Tests')");
   admin=identity.user(identity.create("admin","Admin","test-password-123","ADMIN"));
   author=identity.user(identity.create("author","Author","test-password-123","AUTHOR"));
   coders=new ArrayList<>();for(int i=0;i<6;i++)coders.add(identity.user(identity.create("coder"+i,"Coder "+i,"test-password-123","CODER")));
   return null;
  });
  fixture=(ObjectNode)db.json.readTree(getClass().getResourceAsStream("/dataset.json")).get(0).deepCopy();
  ((ObjectNode)fixture.path("answer")).put("validateOnSave",false);((ObjectNode)fixture.path("general")).put("categoryId","algorithms");
 }
 JsonNode call(User u,String type,JsonNode payload){return db.tree(commands.execute(u,type,payload,db.id()));}
 ObjectNode data(Object... a){ObjectNode p=db.obj();for(int i=0;i<a.length;i+=2)p.set(a[i].toString(),db.tree(a[i+1]));return p;}
 JsonNode createProblem(int difficulty,boolean validate) {
  ObjectNode q=fixture.deepCopy();q.put("difficulty",difficulty);((ObjectNode)q.path("general")).put("questionName","Problem "+db.id());
  JsonNode saved=call(author,"QUESTION_SAVE",q);
  if(validate){call(author,"QUESTION_VALIDATE",data("id",saved.path("id").asText()));gradeNext(true);}
  return saved;
 }
 JsonNode gradeNext(boolean pass){JsonNode job=db.tree(judge.claim("test-worker"));assertTrue(job.path("job").asBoolean());grade(job,pass);return job;}
 void grade(JsonNode job,boolean pass) {
  JsonNode q=db.read((String)db.one("SELECT snapshot FROM submissions WHERE id=?",job.path("id").asText()).get("snapshot"));
  ObjectNode result=data("id",job.path("id").asText(),"leaseToken",job.path("leaseToken").asText());
  ArrayNode cases=result.putArray("cases");for(var t:q.path("testcases"))cases.add(data("verdict","OK","stdout",pass?t.path("expected").asText():"WRONG\n","timeMs",1,"compileMs",1));
  assertTrue(db.tree(judge.complete("test-worker",result)).path("accepted").asBoolean());
 }
 ObjectNode lobby(int count,List<Integer> selected,int bankSize) {
  for(int i=0;i<bankSize;i++)createProblem(selected.getFirst(),true);
  var r=(ObjectNode)call(coders.getFirst(),"ROOM_CREATE",data("selectedDifficulties",selected));
  for(int i=1;i<count;i++)r=(ObjectNode)call(coders.get(i),"ROOM_JOIN",data("roomId",r.path("id").asText()));
  return r;
 }
 ObjectNode start(ObjectNode r) {
  call(coders.getFirst(),"ROOM_START",data("roomId",r.path("id").asText()));
  ObjectNode loaded=rooms.load(r.path("id").asText());loaded.put("nextAt",db.now()-1);writeRoom(loaded);
  db.atomic(()->{rooms.advance(loaded);return null;});return rooms.load(r.path("id").asText());
 }
 void writeRoom(ObjectNode r){db.sql.update("UPDATE rooms SET state=?,document=? WHERE id=?",r.path("state").asText(),db.write(r),r.path("id").asText());}
 ObjectNode submitPayload(ObjectNode r){return data("roomId",r.path("id").asText(),"roundId",r.path("current").path("id").asText(),"problemId",r.path("current").path("problemId").asText(),"source","print(sum(map(int,input().split())))","language","PY311");}
 @Test void everyoneSubmittingClosesEarlyAndWaitsForAllJudgments() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();
  for(int i=0;i<4;i++)call(coders.get(i),"SUBMIT",submitPayload(r));
  assertEquals("ROUND_ACTIVE",rooms.load(id).path("state").asText());
  call(coders.get(4),"SUBMIT",submitPayload(r));
  assertEquals("ROUND_GRADING",rooms.load(id).path("state").asText());
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"SUBMIT",submitPayload(r)));
  for(int i=0;i<4;i++)gradeNext(true);
  assertEquals("ROUND_GRADING",rooms.load(id).path("state").asText());
  gradeNext(true);var settled=rooms.load(id);
  assertEquals("ROUND_RESULT",settled.path("state").asText());
  assertEquals(1,settled.path("history").size());
  assertTrue(settled.path("current").path("deadline").asLong()>db.now());
 }
 @Test void examplesDoNotCloseRoundAndPlayersCanRetryBeforeEveryoneSubmits() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();
  for(int i=0;i<5;i++)call(coders.get(i),"RUN_EXAMPLES",submitPayload(r));
  assertEquals("ROUND_ACTIVE",rooms.load(id).path("state").asText());
  for(int i=0;i<5;i++)gradeNext(true);
  call(coders.getFirst(),"SUBMIT",submitPayload(r));gradeNext(false);
  assertEquals("ROUND_ACTIVE",rooms.load(id).path("state").asText());
  assertDoesNotThrow(()->call(coders.getFirst(),"SUBMIT",submitPayload(r)));
 }
 @Test void forfeitedPlayerDoesNotBlockEarlyClose() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();
  call(coders.get(4),"ROOM_LEAVE",data("roomId",id));
  for(int i=0;i<4;i++)call(coders.get(i),"SUBMIT",submitPayload(r));
  assertEquals("ROUND_GRADING",rooms.load(id).path("state").asText());
 }
 @Test void finalWaitsForEarlierPendingAdmissionAndWorkerOrderCannotChooseWinner() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();
  for(int i=0;i<2;i++){everyoneAc(r);r=nextRound(rooms.load(id));}
  assertEquals("FINAL",r.path("current").path("kind").asText());
  var payload=submitPayload(r);
  call(coders.getFirst(),"SUBMIT",payload);
  JsonNode first=db.tree(judge.claim("test-worker"));
  call(coders.get(1),"SUBMIT",payload);
  JsonNode second=db.tree(judge.claim("test-worker"));
  grade(second,true);
  assertEquals("ROUND_GRADING",rooms.load(id).path("state").asText());
  grade(first,true);ObjectNode finished=rooms.load(id);
  assertEquals("FINISHED",finished.path("state").asText());
  assertEquals(coders.getFirst().id(),finished.path("winnerId").asText());
  assertEquals(1,identity.user(coders.getFirst().id()).wins());
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"SUBMIT",payload));
  assertFalse(db.tree(judge.complete("test-worker",data("id",first.path("id").asText(),"leaseToken",first.path("leaseToken").asText()))).path("accepted").asBoolean());
  assertEquals(finished,rooms.load(id));
  assertEquals(0,identity.user(coders.get(1).id()).wins());
  assertEquals(1,identity.user(coders.getFirst().id()).wins());
 }
 @Test void finalAcDoesNotWaitForOpponentToSubmit() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();
  for(int i=0;i<2;i++){everyoneAc(r);r=nextRound(rooms.load(id));}
  call(coders.getFirst(),"SUBMIT",submitPayload(r));gradeNext(true);
  assertEquals("FINISHED",rooms.load(id).path("state").asText());
  assertEquals(coders.getFirst().id(),rooms.load(id).path("winnerId").asText());
 }
 @Test void queuedSubmissionStillFinishesAndEmptyRoomHistoryIsPreserved() {
  ObjectNode r=start(lobby(5,List.of(1),4));String rid=r.path("id").asText();
  JsonNode receipt=call(coders.getFirst(),"SUBMIT",submitPayload(r));
  for(int i=0;i<5;i++)call(coders.get(i),"ROOM_LEAVE",data("roomId",rid));
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM rooms WHERE id=?",Integer.class,rid));
  assertEquals("UNRESOLVED",rooms.load(rid).path("state").asText());
  gradeNext(true);
  assertEquals("AC",db.one("SELECT status FROM submissions WHERE id=?",receipt.path("id").asText()).get("status"));
 }
 @Test void activeContestPreventsEditingItsProblemsAndRejectsDuplicates() {
  JsonNode q=createProblem(1,false);String pid=q.path("id").asText();
  var p=data("title","Stable contest","startsAt",db.now()-100,"endsAt",db.now()+120000,"problemIds",List.of(pid,pid));
  assertThrows(Store.Fault.class,()->call(author,"CONTEST_CREATE",p));
  p.set("problemIds",db.tree(List.of(pid)));call(author,"CONTEST_CREATE",p);
  assertThrows(Store.Fault.class,()->call(author,"QUESTION_SAVE",q));
 }
 @Test void disabledContestMemberDoesNotBlockSettlementAndFinalStandingsStayFrozen() {
  String pid=createProblem(1,false).path("id").asText();
  JsonNode c=call(author,"CONTEST_CREATE",data("title","Archive","startsAt",db.now()-100,"endsAt",db.now()+120000,"rated",true,"problemIds",List.of(pid)));
  String cid=c.path("id").asText();
  for(int i=0;i<2;i++)call(coders.get(i),"CONTEST_JOIN",data("contestId",cid));
  call(admin,"USER_SET",data("id",coders.get(1).id(),"enabled",false));
  ObjectNode ended=(ObjectNode)db.read((String)db.one("SELECT document FROM contests WHERE id=?",cid).get("document"));
  ended.put("endsAt",db.now()-1);db.sql.update("UPDATE contests SET document=? WHERE id=?",db.write(ended),cid);contests.settle();
  JsonNode first=call(author,"CONTEST_GET",data("contestId",cid));assertTrue(first.path("contest").path("settled").asBoolean());assertEquals(2,first.path("standings").size());
  call(admin,"USER_SET",data("id",coders.getFirst().id(),"role","AUTHOR"));
  assertEquals(first.path("standings"),call(author,"CONTEST_GET",data("contestId",cid)).path("standings"));
 }
 ObjectNode tiedCutoff() {
  ObjectNode r=start(lobby(6,List.of(1),5));long started=r.path("current").path("startedAt").asLong();
  for(int i=0;i<6;i++) {
   JsonNode ack=call(coders.get(i),"SUBMIT",submitPayload(r));
   db.sql.update("UPDATE submissions SET received_at=? WHERE id=?",started+(i==0?100:200),ack.path("id").asText());
  }
  while(true){JsonNode job=db.tree(judge.claim("test-worker"));if(!job.path("job").asBoolean())break;grade(job,true);}
  closeRound(r);return rooms.load(r.path("id").asText());
 }
 @Test void tieBreakRetainsOriginalRemainingSlots() {
  ObjectNode r=tiedCutoff();assertEquals(3,r.path("tieSlots").asInt());assertEquals(5,r.path("tiePlayers").size());
  r=nextRound(r);int i=0;
  for(var uid:r.path("current").path("players")) {
   JsonNode ack=call(identity.user(uid.asText()),"SUBMIT",submitPayload(r));
   db.sql.update("UPDATE submissions SET received_at=? WHERE id=?",r.path("current").path("startedAt").asLong()+100+(i++)*100,ack.path("id").asText());
  }
  while(true){JsonNode job=db.tree(judge.claim("test-worker"));if(!job.path("job").asBoolean())break;grade(job,true);}
  closeRound(r);r=rooms.load(r.path("id").asText());
  int alive=0;for(var player:r.path("players"))if(player.path("status").asText().equals("ALIVE"))alive++;
  assertEquals(4,alive);
 }
 @Test void submissionCannotBelongToBothRoomAndContestOrOrphanRound() {
  String pid=createProblem(1,false).path("id").asText();
  var p=data("problemId",pid,"source","print(5)","language","PY311","roomId","room","contestId","contest");
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"SUBMIT",p));
  p.remove(List.of("roomId","contestId"));p.put("roundId","orphan");
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"SUBMIT",p));
 }
 @Test void safeQualifierStillWinsWhenAllTiedPlayersFailTheTieBreak() {
  ObjectNode r=nextRound(tiedCutoff());String rid=r.path("id").asText();
  closeRound(r);r=rooms.load(rid);
  assertEquals("FINISHED",r.path("state").asText());assertEquals(coders.getFirst().id(),r.path("winnerId").asText());
 }
 @Test void forfeitedQualifierCannotReturnAsWinnerAfterTheTieBreak() {
  ObjectNode r=tiedCutoff();String rid=r.path("id").asText();
  call(coders.getFirst(),"ROOM_LEAVE",data("roomId",rid));r=nextRound(rooms.load(rid));
  closeRound(r);r=rooms.load(rid);assertEquals("UNRESOLVED",r.path("state").asText());assertFalse(r.has("winnerId"));
 }
 @Test void failedReauthenticationClearsOldSocketIdentity() throws Exception {
  try(Peer peer=new Peer()) {
   JsonNode login=peer.send("LOGIN",data("username","coder0","password","test-password-123"));
   assertTrue(peer.send("AUTH",data("token",login.path("data").path("token").asText())).path("ok").asBoolean());
   assertFalse(peer.send("AUTH",data("token","invalid")).path("ok").asBoolean());
   assertFalse(peer.send("ME",data()).path("ok").asBoolean());
  }
 }
 @Test void revokedSocketStopsReceivingPrivateEvents() throws Exception {
  try(Peer peer=new Peer()) {
   JsonNode login=peer.send("LOGIN",data("username","coder0","password","test-password-123"));
   assertTrue(peer.send("AUTH",data("token",login.path("data").path("token").asText())).path("ok").asBoolean());
   db.sql.update("DELETE FROM sessions WHERE user_id=?",coders.getFirst().id());
   db.event(coders.getFirst().id(),"private_after_revoke",Map.of("secret",true));clients.events();
   JsonNode event=peer.inbox.poll(5,TimeUnit.SECONDS);assertNotNull(event);assertEquals("session_revoked",event.path("event").asText());
   assertFalse(peer.send("ME",data()).path("ok").asBoolean());
  }
 }
 @Test void serverRejectsRoleEscalationAndForgedValidation() {
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"QUESTION_SAVE",fixture));
  assertThrows(Store.Fault.class,()->call(author,"USER_SET",data("id",coders.getFirst().id(),"role","ADMIN")));
  fixture.put("validatedVersion",1);JsonNode q=call(author,"QUESTION_SAVE",fixture);assertFalse(q.has("validatedVersion"));
 }
 @Test void mutationIdempotenceBindsPayload() {
  JsonNode q=createProblem(1,false);var p=data("problemId",q.path("id").asText(),"source","print(5)","language","PY311");String key=db.id();
  Object first=commands.execute(coders.getFirst(),"SUBMIT",p,key),again=commands.execute(coders.getFirst(),"SUBMIT",p,key);
  assertEquals(db.write(first),db.write(again));assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM submissions",Integer.class));
  p.put("source","print(6)");assertThrows(Store.Fault.class,()->commands.execute(coders.getFirst(),"SUBMIT",p,key));
 }
 @Test void adminAcNeverEntersAnyLeaderboard() {
  JsonNode q=createProblem(1,false);
  call(admin,"SUBMIT",data("problemId",q.path("id").asText(),"source","pass","language","PY311"));gradeNext(true);
  assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM solved WHERE user_id=?",Integer.class,admin.id()));
  for(String metric:List.of("elo","ac","wins")) assertFalse(db.write(catalog.leaderboard(metric)).contains(admin.id()));
  assertEquals(1200,identity.user(admin.id()).elo());
  for(int i=0;i<2;i++) {
   call(coders.getFirst(),"SUBMIT",data("problemId",q.path("id").asText(),"source","pass","language","PY311"));gradeNext(true);
  }
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM solved WHERE user_id=?",Integer.class,coders.getFirst().id()));
  JsonNode board=db.tree(catalog.leaderboard("ac"));
  assertEquals(coders.getFirst().id(),board.get(0).path("id").asText());assertEquals(1,board.get(0).path("ac").asInt());
 }
 @Test void changingAdminToCoderWhileGradingDoesNotRetroactivelyCountAdminSubmission() {
  JsonNode q=createProblem(1,false);
  call(admin,"SUBMIT",data("problemId",q.path("id").asText(),"source","pass","language","PY311"));
  db.sql.update("UPDATE users SET role='CODER' WHERE id=?",admin.id());gradeNext(true);
  assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM solved WHERE user_id=?",Integer.class,admin.id()));
 }
 @Test void frozenSnapshotAndVisibilityAreEnforced() {
  JsonNode q=createProblem(1,false);
  String publicDoc=db.write(catalog.get(coders.getFirst(),q.path("id").asText(),false));
  assertFalse(publicDoc.contains("sampleAnswer"));assertFalse(publicDoc.contains("-4 9"));
  JsonNode receipt=call(coders.getFirst(),"SUBMIT",data("problemId",q.path("id").asText(),"source","pass","language","PY311"));
  gradeNext(true);
  JsonNode detail=call(coders.getFirst(),"SUBMISSION_GET",data("id",receipt.path("id").asText()));
  assertTrue(detail.path("result").path("cases").get(1).path("hidden").asBoolean());assertFalse(detail.has("snapshot"));
  assertThrows(Store.Fault.class,()->call(coders.get(1),"SUBMISSION_GET",data("id",receipt.path("id").asText())));
 }
 @Test void defaultLevelsAndServerLockCannotBeBypassed() {
  ObjectNode r=lobby(5,List.of(1,3),4);String id=r.path("id").asText();
  assertThrows(Store.Fault.class,()->call(coders.get(1),"ROOM_CONFIG",data("roomId",id,"selectedDifficulties",List.of(2))));
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"ROOM_CONFIG",data("roomId",id,"selectedDifficulties",List.of())));
  r=start(r);assertTrue(List.of(1,3).contains(r.path("current").path("difficulty").asInt()));
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"ROOM_CONFIG",data("roomId",id,"selectedDifficulties",List.of(2))));
  assertEquals(4,r.path("bank").size());assertFalse(rooms.publicState(r).has("bank"));
 }
 @Test void shortageIsReportedWithoutExpandingLevels() {
  ObjectNode r=lobby(5,List.of(5),1);
  for(int i=0;i<5;i++)createProblem(1,true);
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"ROOM_START",data("roomId",r.path("id").asText())));
  assertEquals("LOBBY",rooms.load(r.path("id").asText()).path("state").asText());
 }
 @Test void concurrentAdmissionNeverConsumesMoreThanTwoAttempts() throws Exception {
  ObjectNode r=start(lobby(5,List.of(1),4));ObjectNode payload=submitPayload(r);
  ExecutorService pool=Executors.newFixedThreadPool(8);var futures=new ArrayList<Future<Boolean>>();
  try{
   for(int i=0;i<8;i++)futures.add(pool.submit(()->{try{call(coders.getFirst(),"SUBMIT",payload);return true;}catch(Store.Fault ex){return false;}}));
   int accepted=0;for(var f:futures)if(f.get(10,TimeUnit.SECONDS))accepted++;
   assertEquals(2,accepted);
  }finally{pool.shutdownNow();}
 }
 @Test void lateWorkerCompletionWaitsAndDoesNotDetermineElimination() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();long started=r.path("current").path("startedAt").asLong();
  for(int i=0;i<5;i++){var receipt=call(coders.get(i),"SUBMIT",submitPayload(r));db.sql.update("UPDATE submissions SET received_at=? WHERE id=?",started+100+i*20,receipt.path("id").asText());}
  var jobs=new ArrayList<JsonNode>();for(int i=0;i<5;i++)jobs.add(db.tree(judge.claim("test-worker")));
  ((ObjectNode)r.path("current")).put("deadline",db.now()-1);writeRoom(r);
  rooms.advance(r);r=rooms.load(id);rooms.advance(r);assertEquals("ROUND_GRADING",rooms.load(id).path("state").asText());
  Collections.reverse(jobs);for(var job:jobs)grade(job,true);
  rooms.advance(rooms.load(id));r=rooms.load(id);
  assertEquals("ROUND_RESULT",r.path("state").asText());assertEquals(coders.getFirst().id(),r.path("standings").get(0).path("userId").asText());
  assertEquals(3,java.util.stream.StreamSupport.stream(r.path("players").spliterator(),false).filter(p->p.path("status").asText().equals("ALIVE")).count());
 }
 @Test void expiredLeaseCannotOverwriteNewWorkerResult() {
  JsonNode q=createProblem(1,false);call(coders.getFirst(),"SUBMIT",data("problemId",q.path("id").asText(),"source","pass","language","PY311"));
  JsonNode old=db.tree(judge.claim("test-worker"));db.sql.update("UPDATE submissions SET lease_until=0 WHERE id=?",old.path("id").asText());judge.recover();
  JsonNode fresh=db.tree(judge.claim("test-worker"));assertNotEquals(old.path("leaseToken"),fresh.path("leaseToken"));
  assertFalse(db.tree(judge.complete("test-worker",data("id",old.path("id").asText(),"leaseToken",old.path("leaseToken").asText(),"systemError",true))).path("accepted").asBoolean());
  grade(fresh,true);assertEquals("AC",db.one("SELECT status FROM submissions WHERE id=?",fresh.path("id").asText()).get("status"));
 }
 @Test void allZeroEndsWithoutWinner() {
  ObjectNode r=start(lobby(5,List.of(3),4));String id=r.path("id").asText();r.put("state","ROUND_GRADING");writeRoom(r);rooms.advance(r);assertEquals("UNRESOLVED",rooms.load(id).path("state").asText());
 }
 @Test void lateJoinerBecomesSpectatorAndCannotSubmit() {
  ObjectNode r=start(lobby(5,List.of(1),4));
  JsonNode joined=call(coders.get(5),"ROOM_JOIN",data("roomId",r.path("id").asText()));
  assertEquals("SPECTATOR",joined.path("players").get(5).path("status").asText());
  assertThrows(Store.Fault.class,()->call(coders.get(5),"SUBMIT",submitPayload(r)));
 }
 @Test void draftsAndMultilineSurviveRoundTrip() {
  JsonNode q=createProblem(1,false);String source="a = '\\t'\nprint(a)\n\n";
  call(coders.getFirst(),"DRAFT_SAVE",data("problemId",q.path("id").asText(),"source",source,"language","PY311"));
  assertEquals(source,call(coders.getFirst(),"DRAFT_GET",data("problemId",q.path("id").asText())).get(0).path("source_code").asText());
 }
 @Test void disabledAccountCanBeReenabled() {
  call(admin,"USER_SET",data("id",coders.getFirst().id(),"role","CODER","enabled",false));
  assertThrows(Store.Fault.class,()->identity.user(coders.getFirst().id()));
  call(admin,"USER_SET",data("id",coders.getFirst().id(),"role","CODER","enabled",true));
  assertTrue(identity.user(coders.getFirst().id()).coder());
 }
 void closeRound(ObjectNode r) {
  r=rooms.load(r.path("id").asText());
  if(!List.of("ROUND_ACTIVE","ROUND_GRADING").contains(r.path("state").asText()))return;
  ((ObjectNode)r.path("current")).put("deadline",0);writeRoom(r);rooms.advance(r);rooms.advance(rooms.load(r.path("id").asText()));
 }
 ObjectNode nextRound(ObjectNode r) {
  r.put("nextAt",0);writeRoom(r);rooms.advance(r);return rooms.load(r.path("id").asText());
 }
 void everyoneAc(ObjectNode r) {
  int index=0;
  for(var player:r.path("players"))if(player.path("status").asText().equals("ALIVE")) {
   User u=identity.user(player.path("id").asText());var receipt=call(u,"SUBMIT",submitPayload(r));
   db.sql.update("UPDATE submissions SET received_at=? WHERE id=?",r.path("current").path("startedAt").asLong()+1000+(index++)*50,receipt.path("id").asText());
  }
  while(true){var job=db.tree(judge.claim("test-worker"));if(!job.path("job").asBoolean())break;grade(job,true);}
 }
 @Test void completeMatchUpdatesWinsOnceWithoutChangingAnyElo() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();
  Map<String,Integer> ratings=new HashMap<>();for(int i=0;i<6;i++){int elo=950+i*137;db.sql.update("UPDATE users SET elo=? WHERE id=?",elo,coders.get(i).id());ratings.put(coders.get(i).id(),elo);}
  call(coders.get(5),"ROOM_JOIN",data("roomId",id));
  for(int round=0;round<3;round++){everyoneAc(r);closeRound(r);r=rooms.load(id);if(!r.path("state").asText().equals("FINISHED"))r=nextRound(r);}
  assertEquals("FINISHED",r.path("state").asText());assertEquals(coders.getFirst().id(),r.path("winnerId").asText());
  assertEquals(1,identity.user(coders.getFirst().id()).wins());
  for(User coder:coders)assertEquals(ratings.get(coder.id()).intValue(),identity.user(coder.id()).elo());
  rooms.advance(r);assertEquals(1,identity.user(coders.getFirst().id()).wins());
 }
 @Test void passwordChangeChecksCurrentPasswordAndRevokesAllSessions() {
  User u=coders.getFirst();String old=(String)identity.login(data("username",u.username(),"password","test-password-123")).get("token");
  String other=(String)identity.login(data("username",u.username(),"password","test-password-123")).get("token");
  assertThrows(Store.Fault.class,()->call(u,"PASSWORD_CHANGE",data("currentPassword","wrong","newPassword","new-password-123")));
  assertEquals(u.id(),identity.authenticate(old).id());
  assertThrows(Store.Fault.class,()->call(u,"PASSWORD_CHANGE",data("currentPassword","test-password-123","newPassword","short")));
  assertThrows(Store.Fault.class,()->call(u,"PASSWORD_CHANGE",data("currentPassword","test-password-123","newPassword","ậ".repeat(25))));
  assertThrows(Store.Fault.class,()->call(u,"PASSWORD_CHANGE",data("currentPassword","test-password-123","newPassword","test-password-123")));
  assertTrue(call(u,"PASSWORD_CHANGE",data("currentPassword","test-password-123","newPassword","new-password-123")).path("changed").asBoolean());
  assertThrows(Store.Fault.class,()->identity.authenticate(old));assertThrows(Store.Fault.class,()->identity.authenticate(other));
  assertThrows(Store.Fault.class,()->identity.login(data("username",u.username(),"password","test-password-123")));
  assertNotNull(identity.login(data("username",u.username(),"password","new-password-123")).get("token"));
  assertNotNull(identity.login(data("username",coders.get(1).username(),"password","test-password-123")).get("token"));
 }
 @Test void progressIsBoundedMonotonicPrivateAndRestrictedToActiveLease() {
  String pid=createProblem(1,false).path("id").asText();User u=coders.getFirst();
  String id=call(u,"SUBMIT",data("problemId",pid,"source","pass","language","PY311")).path("id").asText();
  JsonNode job=db.tree(judge.claim("test-worker"));String lease=job.path("leaseToken").asText();int total=job.path("runner").path("tests").size();
  assertFalse(db.tree(judge.progress("other-worker",data("id",id,"leaseToken",lease,"currentTest",1,"completedTests",0))).path("accepted").asBoolean());
  assertTrue(db.tree(judge.progress("test-worker",data("id",id,"leaseToken",lease,"currentTest",2,"completedTests",1))).path("accepted").asBoolean());
  judge.progress("test-worker",data("id",id,"leaseToken",lease,"currentTest",1,"completedTests",0));
  var detail=call(u,"SUBMISSION_GET",data("id",id));assertEquals(2,detail.path("current_test").asInt());assertEquals(1,detail.path("completed_tests").asInt());assertEquals(total,detail.path("total_tests").asInt());assertFalse(detail.has("lease_token"));
  assertThrows(Store.Fault.class,()->call(coders.get(1),"SUBMISSION_GET",data("id",id)));
  assertThrows(Store.Fault.class,()->judge.progress("test-worker",data("id",id,"leaseToken",lease,"currentTest",total+1,"completedTests",total)));
  grade(job,true);assertEquals(total,call(u,"SUBMISSION_GET",data("id",id)).path("completed_tests").asInt());
  assertFalse(db.tree(judge.progress("test-worker",data("id",id,"leaseToken",lease,"currentTest",2,"completedTests",1))).path("accepted").asBoolean());
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM events WHERE user_id=? AND type='submission_progress'",Integer.class,u.id()));
 }
 @Test void historyPaginationIncludesOldRowsAndKeepsAccountAndFilterBoundaries() {
  String pid=createProblem(1,false).path("id").asText();User u=coders.getFirst();
  for(int i=0;i<107;i++)db.sql.update("INSERT INTO submissions(id,user_id,problem_id,request_id,source_code,language,mode,received_at,status,snapshot) VALUES(?,?,?,?,?,?,?,?,?,?)",db.id(),i<105?u.id():coders.get(1).id(),pid,db.id(),"pass","PY311","OFFICIAL",i,i%2==0?"AC":"WA","{}");
  var first=call(u,"SUBMISSIONS_PAGE",data("page",1,"pageSize",20));assertEquals(105,first.path("total").asInt());assertEquals(6,first.path("totalPages").asInt());assertEquals(20,first.path("items").size());
  var last=call(u,"SUBMISSIONS_PAGE",data("page",99,"pageSize",20));assertEquals(6,last.path("page").asInt());assertEquals(5,last.path("items").size());assertEquals(0,last.path("items").get(4).path("received_at").asInt());
  var ac=call(u,"SUBMISSIONS_PAGE",data("page",1,"pageSize",50,"filter","ac"));assertEquals(53,ac.path("total").asInt());for(var s:ac.path("items"))assertEquals("AC",s.path("status").asText());
  assertEquals(100,call(u,"SUBMISSIONS",data()).size());
  assertThrows(Store.Fault.class,()->call(u,"SUBMISSIONS_PAGE",data("pageSize",500)));
 }
 @Test void perProblemRankingUsesBestAcPerCoderWithoutRevealingSources() {
  String pid=createProblem(1,false).path("id").asText();
  int index=0;String bestId="";
  for(User u:List.of(coders.getFirst(),coders.getFirst(),coders.get(1),admin,author)) {
   String id=call(u,"SUBMIT",data("problemId",pid,"source","pass","language","PY311")).path("id").asText();gradeNext(true);
   var result=(ObjectNode)db.read((String)db.one("SELECT result FROM submissions WHERE id=?",id).get("result"));
   for(var c:result.path("cases"))((ObjectNode)c).put("timeMs",index==0?50:index==1?0.5:1);
   db.sql.update("UPDATE submissions SET result=? WHERE id=?",db.write(result),id);if(index++==1)bestId=id;
  }
  var ranked=call(coders.get(2),"PROBLEM_RANKING",data("problemId",pid));assertEquals(2,ranked.size());
  assertEquals(coders.getFirst().id(),ranked.get(0).path("userId").asText());assertEquals(1,ranked.get(0).path("rank").asInt());
  assertEquals(bestId,ranked.get(0).path("submissionId").asText());
  assertFalse(ranked.toString().contains("source_code"));assertFalse(ranked.toString().contains("expected"));assertFalse(ranked.toString().contains("stdout"));
  db.sql.update("UPDATE users SET enabled=FALSE WHERE id=?",coders.getFirst().id());assertEquals(1,call(coders.get(2),"PROBLEM_RANKING",data("problemId",pid)).size());
  ObjectNode q=fixture.deepCopy();((ObjectNode)q.path("general")).put("status","draft");String draft=call(author,"QUESTION_SAVE",q).path("id").asText();
  assertThrows(Store.Fault.class,()->call(coders.get(2),"PROBLEM_RANKING",data("problemId",draft)));
 }
 @Test void finalWithoutAcHasNoWinner() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();for(int i=0;i<2;i++){everyoneAc(r);closeRound(r);r=nextRound(rooms.load(id));}closeRound(r);assertEquals("UNRESOLVED",rooms.load(id).path("state").asText());
 }
 @Test void emptySourcesAndOutOfRangeLanguageCannotEnterQueue() {
  JsonNode q=createProblem(1,false);
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"SUBMIT",data("problemId",q.path("id").asText(),"source"," ","language","PY311")));
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"SUBMIT",data("problemId",q.path("id").asText(),"source","x","language","CPP23")));
  assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM submissions",Integer.class));
 }
 class Peer implements java.net.http.WebSocket.Listener,AutoCloseable {
  java.net.http.WebSocket ws;BlockingQueue<JsonNode> inbox=new LinkedBlockingQueue<>();StringBuilder text=new StringBuilder();
  Peer() throws Exception{this("/ws");}
  Peer(String path) throws Exception{ws=java.net.http.HttpClient.newHttpClient().newWebSocketBuilder().buildAsync(java.net.URI.create("ws://127.0.0.1:"+port+path),this).get(5,TimeUnit.SECONDS);}
  public void onOpen(java.net.http.WebSocket w){w.request(1);}
  public CompletionStage<?> onText(java.net.http.WebSocket w,CharSequence data,boolean last){text.append(data);if(last){inbox.add(db.read(text.toString()));text.setLength(0);}w.request(1);return CompletableFuture.completedFuture(null);}
  JsonNode send(String type,JsonNode p)throws Exception{String id=db.id();ws.sendText(db.write(Map.of("v",1,"type",type,"requestId",id,"payload",p)),true).join();for(int i=0;i<20;i++){var m=inbox.poll(5,TimeUnit.SECONDS);assertNotNull(m);if(m.path("requestId").asText().equals(id))return m;}throw new AssertionError("No ACK");}
  public void close(){ws.abort();}
 }
 @Test void realWebSocketAuthAuthorizationReplayAndSnapshot() throws Exception {
  String token;
  try(Peer peer=new Peer()){
   assertFalse(peer.send("PROBLEMS",data()).path("ok").asBoolean());
   var login=peer.send("LOGIN",data("username","coder0","password","test-password-123"));assertTrue(login.path("ok").asBoolean());token=login.path("data").path("token").asText();
   assertTrue(peer.send("AUTH",data("token",token)).path("ok").asBoolean());
   assertFalse(peer.send("CATEGORY_SAVE",data("name","Escalation","description","")).path("ok").asBoolean());
  }
  call(author,"CATEGORY_SAVE",data("name","Replay category","description","while disconnected"));
  try(Peer peer=new Peer()){
   assertTrue(peer.send("AUTH",data("token",token,"lastSeq",0)).path("ok").asBoolean());
   clients.events();JsonNode event=peer.inbox.poll(5,TimeUnit.SECONDS);assertNotNull(event);assertEquals("catalog_changed",event.path("event").asText());
   var snapshot=peer.send("SYNC",data());assertTrue(snapshot.path("ok").asBoolean());assertEquals(coders.getFirst().id(),snapshot.path("data").path("user").path("id").asText());
  }
 }
 @Test void workerSocketReportsRealProgressUsingItsLease() throws Exception {
  String pid=createProblem(1,false).path("id").asText();
  String id=call(coders.getFirst(),"SUBMIT",data("problemId",pid,"source","pass","language","PY311")).path("id").asText();
  try(Peer peer=new Peer("/worker-ws")) {
   assertFalse(peer.send("CLAIM",data()).path("ok").asBoolean());
   assertTrue(peer.send("WORKER_AUTH",data("token","test-worker-token-long-enough-1234567890","workerId","test-worker")).path("ok").asBoolean());
   var job=peer.send("CLAIM",data()).path("data");assertEquals(id,job.path("id").asText());
   var response=peer.send("PROGRESS",data("id",id,"leaseToken",job.path("leaseToken").asText(),"currentTest",1,"completedTests",0));
   assertTrue(response.path("data").path("accepted").asBoolean());
   var mine=call(coders.getFirst(),"SUBMISSIONS",data()).get(0);assertEquals(1,mine.path("current_test").asInt());assertEquals(job.path("runner").path("tests").size(),mine.path("total_tests").asInt());
   grade(job,true);
  }
 }
 @Test void passwordChangeOverSocketRequiresReauthenticationAndLimitsAttempts() throws Exception {
  try(Peer peer=new Peer()) {
   String token=peer.send("LOGIN",data("username","coder0","password","test-password-123")).path("data").path("token").asText();
   assertTrue(peer.send("AUTH",data("token",token)).path("ok").asBoolean());
   assertTrue(peer.send("PASSWORD_CHANGE",data("currentPassword","test-password-123","newPassword","changed-password-123")).path("ok").asBoolean());
   assertFalse(peer.send("ME",data()).path("ok").asBoolean());
   String fresh=peer.send("LOGIN",data("username","coder0","password","changed-password-123")).path("data").path("token").asText();
   assertTrue(peer.send("AUTH",data("token",fresh)).path("ok").asBoolean());
   for(int i=0;i<4;i++)assertFalse(peer.send("PASSWORD_CHANGE",data("currentPassword","wrong-password","newPassword","another-password-123")).path("ok").asBoolean());
   var blocked=peer.send("PASSWORD_CHANGE",data("currentPassword","changed-password-123","newPassword","another-password-123"));
   assertFalse(blocked.path("ok").asBoolean());assertTrue(blocked.path("error").path("message").asText().contains("5"));
   assertDoesNotThrow(()->identity.authenticate(fresh));
  }
 }
 @Test void contestRegistrationFinalizationAndEloExcludeAdmin() {
  JsonNode q=createProblem(1,false);
  JsonNode c=call(author,"CONTEST_CREATE",data("title","Rated test","startsAt",db.now()-100,"endsAt",db.now()+120000,"rated",true,"problemIds",List.of(q.path("id").asText())));
  String cid=c.path("id").asText();call(coders.get(0),"CONTEST_JOIN",data("contestId",cid));call(coders.get(1),"CONTEST_JOIN",data("contestId",cid));
  for(User u:List.of(coders.get(0),coders.get(1),admin)) {
   call(u,"SUBMIT",data("contestId",cid,"problemId",q.path("id").asText(),"language","PY311","source","pass"));gradeNext(!u.id().equals(coders.get(1).id()));
  }
  ObjectNode ended=(ObjectNode)c.deepCopy();ended.set("participants",db.tree(List.of(coders.get(0).id(),coders.get(1).id())));ended.put("endsAt",db.now()-1);
  db.sql.update("UPDATE contests SET document=? WHERE id=?",db.write(ended),cid);contests.settle();
  assertTrue(identity.user(coders.get(0).id()).elo()>1200);assertTrue(identity.user(coders.get(1).id()).elo()<1200);assertEquals(1200,identity.user(admin.id()).elo());
  int rating=identity.user(coders.get(0).id()).elo();contests.settle();assertEquals(rating,identity.user(coders.get(0).id()).elo());
  assertThrows(Store.Fault.class,()->call(coders.get(0),"SUBMIT",data("contestId",cid,"problemId",q.path("id").asText(),"language","PY311","source","pass")));
 }
 @Test void approvalGatesPrivateContestProblems() {
  ObjectNode q=fixture.deepCopy();((ObjectNode)q.path("general")).put("status","draft");JsonNode saved=call(author,"QUESTION_SAVE",q);String pid=saved.path("id").asText();
  JsonNode c=call(author,"CONTEST_CREATE",data("title","Private","startsAt",db.now()-100,"endsAt",db.now()+120000,"approvalRequired",true,"problemIds",List.of(pid)));String cid=c.path("id").asText();
  call(coders.getFirst(),"CONTEST_JOIN",data("contestId",cid));assertThrows(Store.Fault.class,()->call(coders.getFirst(),"QUESTION_GET",data("id",pid)));
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"CONTEST_APPROVE",data("contestId",cid,"userId",coders.getFirst().id(),"approve",true)));
  call(author,"CONTEST_APPROVE",data("contestId",cid,"userId",coders.getFirst().id(),"approve",true));assertTrue(call(coders.getFirst(),"QUESTION_GET",data("id",pid)).has("general"));
 }
 @Test void onlyAcSurvivesEvenWhenOthersEarnPartialPoints() {
  ObjectNode r=start(lobby(5,List.of(1),4));String id=r.path("id").asText();for(int i=0;i<5;i++){call(coders.get(i),"SUBMIT",submitPayload(r));gradeNext(i==0);}closeRound(r);r=rooms.load(id);assertEquals("FINISHED",r.path("state").asText());assertEquals(coders.getFirst().id(),r.path("winnerId").asText());
 }

 @Test void localizesOnlyUnmodifiedSeedProblems() throws Exception {
  var entry=db.json.readTree(getClass().getResourceAsStream("/dataset-localization.json")).get(0);
  ObjectNode original=fixture.deepCopy();((ObjectNode)original.path("general")).put("questionName",entry.path("oldTitle").asText()).put("questionText",entry.path("oldText").asText());
  var saved=call(author,"QUESTION_SAVE",original);String id=saved.path("id").asText();
  ObjectNode edited=fixture.deepCopy();((ObjectNode)edited.path("general")).put("questionName","Authored title").put("questionText","Authored statement");var other=call(author,"QUESTION_SAVE",edited);
  var migration=new vn.codegrade.db.SeedLocalization(db);migration.apply();migration.apply();
  assertEquals(entry.path("title").asText(),db.one("SELECT title FROM problems WHERE id=?",id).get("title"));
  assertEquals("Authored title",db.one("SELECT title FROM problems WHERE id=?",other.path("id").asText()).get("title"));
 }
 @Test void auditedBankUpgradePreservesIdsUserDataAndOldSubmissionSnapshots() throws Exception {
  var baseline=db.json.readTree(getClass().getResourceAsStream("/dataset-upgrade-5.5.json")).get(17);
  ObjectNode old=(ObjectNode)baseline.path("baseline").deepCopy();
  db.sql.update("INSERT INTO categories VALUES('arithmetic','Số học','Số học')");
  var saved=db.tree(catalog.save(author,old));String id=saved.path("id").asText(),code=saved.path("publicId").asText();
  call(coders.getFirst(),"BOOKMARK_SET",data("problemId",id,"starred",true));
  var receipt=call(coders.getFirst(),"SUBMIT",data("problemId",id,"language","PY311","source","print(10)"));
  String snapshot=(String)db.one("SELECT snapshot FROM submissions WHERE id=?",receipt.path("id").asText()).get("snapshot");
  var upgrade=new vn.codegrade.db.SeedBankUpgrade(db);upgrade.apply();upgrade.apply();
  var updated=catalog.document(id);assertEquals(code,updated.path("publicId").asText());assertEquals(2,updated.path("version").asInt());
  assertEquals("CPP11",updated.path("answer").path("language").asText());assertTrue(updated.path("general").path("questionText").asText().contains("C(a+b, a)"));
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM bookmarks WHERE problem_id=?",Integer.class,id));
  assertEquals(snapshot,db.one("SELECT snapshot FROM submissions WHERE id=?",receipt.path("id").asText()).get("snapshot"));
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM submissions WHERE request_id=?",Integer.class,"seed-v55:"+baseline.path("key").asText()));
  assertFalse(updated.has("validatedVersion"));
 }
 @Test void auditedBankUpgradeDoesNotOverwriteAuthorEditsOrLaterVersions() throws Exception {
  var baseline=db.json.readTree(getClass().getResourceAsStream("/dataset-upgrade-5.5.json")).get(0).path("baseline");
  db.sql.update("INSERT INTO categories VALUES('arithmetic','Số học','Số học')");
  ObjectNode changed=baseline.deepCopy();((ObjectNode)changed.path("answer")).put("sampleAnswer","custom reference");
  var saved=db.tree(catalog.save(author,changed));
  ObjectNode later=(ObjectNode)db.tree(catalog.save(author,baseline));later=(ObjectNode)db.tree(catalog.save(author,later));
  new vn.codegrade.db.SeedBankUpgrade(db).apply();
  assertEquals("custom reference",catalog.document(saved.path("id").asText()).path("answer").path("sampleAnswer").asText());
  assertEquals(baseline.path("answer"),catalog.document(later.path("id").asText()).path("answer"));
  assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM submissions",Integer.class));
 }
 @Test void auditedBankDefersActiveRoomAndAcceptsExactEnglishBaseline() throws Exception {
  var baseline=db.json.readTree(getClass().getResourceAsStream("/dataset-upgrade-5.5.json")).get(0);
  db.sql.update("INSERT INTO categories VALUES('arithmetic','Số học','Số học')");
  ObjectNode old=(ObjectNode)baseline.path("baseline").deepCopy();((ObjectNode)old.path("general")).put("questionName",baseline.path("englishTitle").asText()).put("questionText",baseline.path("englishText").asText());
  String id=db.tree(catalog.save(author,old)).path("id").asText(),roomId=db.id();
  db.sql.update("INSERT INTO rooms(id,invite_code,state,version,document,updated_at) VALUES(?,?,?,?,?,?)",roomId,"PINNED","ROUND_ACTIVE",1,db.write(data("used",List.of(id))),db.now());
  var upgrade=new vn.codegrade.db.SeedBankUpgrade(db);upgrade.apply();assertEquals(1,catalog.document(id).path("version").asInt());
  db.sql.update("DELETE FROM rooms WHERE id=?",roomId);upgrade.apply();assertEquals(2,catalog.document(id).path("version").asInt());
 }
 @Test void problemCodesStayStableAndAreSearchable() {
  ObjectNode first=(ObjectNode)createProblem(1,false);String code=first.path("publicId").asText();
  assertTrue(code.matches("CG-[0-9]{4,}"));
  ObjectNode edited=first.deepCopy();edited.put("publicId","CG-9999");((ObjectNode)edited.path("general")).put("questionName","Renamed question");
  var saved=call(author,"QUESTION_SAVE",edited);assertEquals(code,saved.path("publicId").asText());assertEquals(code,catalog.document(first.path("id").asText()).path("publicId").asText());
  var results=call(coders.getFirst(),"PROBLEMS",data("search",code.toLowerCase(Locale.ROOT)));assertEquals(1,results.size());assertEquals(first.path("id").asText(),results.get(0).path("id").asText());
  var safe=call(coders.getFirst(),"QUESTION_GET",data("id",first.path("id").asText()));assertEquals(code,safe.path("publicId").asText());assertFalse(safe.has("answer"));assertFalse(safe.has("testcases"));
  assertNotEquals(code,createProblem(1,false).path("publicId").asText());assertEquals("CG-10000",Catalog.publicId(10000));
 }
 void moreCoders(int count) {
  while(coders.size()<count){int i=coders.size();coders.add(identity.user(identity.create("extra"+i,"Extra "+i,"test-password-123","CODER")));}
 }
 ObjectNode matched(String mode) {
  for(int i=0;i<4;i++)createProblem(1,true);
  JsonNode found=null;for(int i=0;i<5;i++)found=call(coders.get(i),"MATCH_QUEUE_JOIN",data("mode",mode));
  String id=found.path("roomId").asText();assertFalse(id.isBlank());
  for(int i=0;i<5;i++)call(coders.get(i),"MATCH_ACCEPT",data("roomId",id));
  ObjectNode r=rooms.load(id);assertEquals("COUNTDOWN",r.path("state").asText());
  return nextRound(r);
 }
 @Test void practiceSupportsEverySizeFromTwoToTenWithNoRankChanges() {
  moreCoders(10);for(int i=0;i<6;i++)createProblem(1,true);
  for(int n=2;n<=10;n++) {
   ObjectNode r=(ObjectNode)call(coders.getFirst(),"ROOM_CREATE",data("capacity",n,"name","Practice "+n));
   for(int i=1;i<n;i++)r=(ObjectNode)call(coders.get(i),"ROOM_JOIN",data("roomId",r.path("code").asText()));
   assertEquals(n,r.path("players").size());r=start(r);String rid=r.path("id").asText();
   for(int rounds=0;rounds<6&&!r.path("state").asText().equals("FINISHED");rounds++){everyoneAc(r);r=rooms.load(rid);if(!r.path("state").asText().equals("FINISHED"))r=nextRound(r);}
   assertEquals("FINISHED",r.path("state").asText());assertEquals(n,r.path("results").size());
   for(int i=0;i<n;i++)assertEquals(1000,progression.get(coders.get(i).id()).path("rating").asInt());
  }
  assertEquals(30,db.sql.queryForObject("SELECT SUM(exp) FROM reward_events WHERE user_id=? AND kind='PRACTICE'",Integer.class,coders.getFirst().id()));
 }
 @Test void normalRequiresFiveAndLeavesSixthWaiting() {
  for(int i=0;i<4;i++)assertEquals("WAITING",call(coders.get(i),"MATCH_QUEUE_JOIN",data("mode","NORMAL")).path("state").asText());
  assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM rooms",Integer.class));
  var found=call(coders.get(4),"MATCH_QUEUE_JOIN",data("mode","NORMAL"));assertEquals("MATCH_FOUND",found.path("state").asText());
  assertEquals(5,found.path("room").path("players").size());
  assertEquals("WAITING",call(coders.get(5),"MATCH_QUEUE_JOIN",data("mode","NORMAL")).path("state").asText());
  String rid=found.path("roomId").asText();for(int i=0;i<4;i++)call(coders.get(i),"MATCH_ACCEPT",data("roomId",rid));
  assertEquals("LOBBY",rooms.load(rid).path("state").asText());
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"ROOM_START",data("roomId",rid)));
  assertThrows(Store.Fault.class,()->call(coders.get(5),"ROOM_JOIN",data("roomId",rid)));
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"ROOM_CREATE",data("mode","NORMAL")));
  call(coders.get(4),"MATCH_DECLINE",data());
  assertEquals("CLOSED",rooms.load(rid).path("state").asText());
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM rooms WHERE state='LOBBY'",Integer.class));
 }
 @Test void tenAndFifteenQueueEntriesCreateOnlyDistinctFivePlayerRooms() throws Exception {
  moreCoders(15);
  var pool=Executors.newFixedThreadPool(8);
  try {var jobs=new ArrayList<Future<?>>();for(var u:coders)jobs.add(pool.submit(()->call(u,"MATCH_QUEUE_JOIN",data("mode","NORMAL"))));for(var j:jobs)j.get(20,TimeUnit.SECONDS);}
  finally{pool.shutdownNow();}
  assertEquals(3,db.sql.queryForObject("SELECT COUNT(*) FROM rooms",Integer.class));
  Set<String> seen=new HashSet<>();for(var row:db.sql.queryForList("SELECT document FROM rooms")) {var r=db.read((String)row.get("document"));assertEquals(5,r.path("players").size());for(var p:r.path("players"))assertTrue(seen.add(p.path("id").asText()));}
 }
 @Test void rankedChecksWholeGroupSpreadAtEveryTenSecondBoundaryAndCapsAt400() {
  int[] ratings={1200,1300,1400,1450,1580};
  for(int i=0;i<5;i++){progression.get(coders.get(i).id());db.sql.update("UPDATE progression SET rating=? WHERE user_id=?",ratings[i],coders.get(i).id());call(coders.get(i),"MATCH_QUEUE_JOIN",data("mode","RANKED"));}
  for(int seconds:new int[]{0,10,20}) {
   db.sql.update("UPDATE match_queue SET joined_at=?,last_seen=?",db.now()-seconds*1000L,db.now());matchmaking.tick();
   assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM rooms",Integer.class));
  }
  db.sql.update("UPDATE match_queue SET joined_at=?,last_seen=?",db.now()-30_001,db.now());matchmaking.tick();
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM rooms",Integer.class));
  String rid=call(coders.getFirst(),"MATCH_SNAPSHOT",data()).path("roomId").asText();call(coders.getFirst(),"MATCH_DECLINE",data());
  db.sql.update("UPDATE match_queue SET state='WAITING',room_id=NULL,rating=CASE WHEN user_id=? THEN 1701 ELSE 1200 END,joined_at=?,last_seen=?",coders.get(4).id(),db.now()-1_000_000,db.now());
  matchmaking.tick();assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM rooms WHERE state='LOBBY'",Integer.class));
  assertEquals(400,call(coders.getFirst(),"MATCH_QUEUE_STATUS",data()).path("ratingRange").asInt());
 }
 @Test void rankedCompatibleFiveMatchImmediatelyAndReplayDoesNotDuplicate() {
  String rid=db.id();JsonNode last=null;
  for(int i=0;i<5;i++)last=db.tree(commands.execute(coders.get(i),"MATCH_QUEUE_JOIN",data("mode","RANKED"),i==4?rid:db.id()));
  assertEquals("MATCH_FOUND",last.path("state").asText());
  assertEquals(last.toString(),db.tree(commands.execute(coders.get(4),"MATCH_QUEUE_JOIN",data("mode","RANKED"),rid)).toString());
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM rooms",Integer.class));
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"MATCH_QUEUE_JOIN",data("mode","NORMAL")));
 }
 @Test void matchTimeoutRequeuesAcceptedPlayersAndKeepsQueueAcrossServiceRestart() {
  JsonNode last=null;for(int i=0;i<5;i++)last=call(coders.get(i),"MATCH_QUEUE_JOIN",data("mode","NORMAL"));String rid=last.path("roomId").asText();
  for(int i=0;i<4;i++)call(coders.get(i),"MATCH_ACCEPT",data("roomId",rid));
  ObjectNode r=rooms.load(rid);r.put("acceptDeadline",0);writeRoom(r);
  new vn.codegrade.room.Matchmaking(db,rooms,progression,identity).tick();
  assertEquals("CLOSED",rooms.load(rid).path("state").asText());
  assertEquals(4,db.sql.queryForObject("SELECT COUNT(*) FROM match_queue WHERE state='WAITING'",Integer.class));
  assertEquals("WAITING",call(coders.getFirst(),"MATCH_SNAPSHOT",data()).path("state").asText());
  assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM reward_events",Integer.class));
 }
 @Test void normalAndRankedSettlementAwardsExpExactlyOnceAndPreservesContestElo() {
  for(String mode:List.of("NORMAL","RANKED")) {
   ObjectNode r=matched(mode);String rid=r.path("id").asText();
   for(int round=0;round<5&&!r.path("state").asText().equals("FINISHED");round++){everyoneAc(r);r=rooms.load(rid);if(!r.path("state").asText().equals("FINISHED"))r=nextRound(r);}
   assertEquals("FINISHED",r.path("state").asText());assertEquals(5,r.path("results").size());
   assertEquals(300,db.sql.queryForObject("SELECT SUM(exp) FROM match_results WHERE room_id=?",Integer.class,rid));
   db.atomic(()->{progression.settle(rooms.load(rid));return null;});
   assertEquals(5,db.sql.queryForObject("SELECT COUNT(*) FROM reward_events WHERE event_key=?",Integer.class,"match:"+rid));
   assertEquals(1200,identity.user(coders.getFirst().id()).elo());
   int rating=progression.get(coders.getFirst().id()).path("rating").asInt();assertEquals(mode.equals("RANKED")?1016:1000,rating);
  }
 }
 @Test void firstIndependentAcAwardsExpButExamplesAndReplayDoNot() {
  var q=createProblem(6,false);var p=data("problemId",q.path("id").asText(),"source","pass","language","PY311");
  call(coders.getFirst(),"RUN_EXAMPLES",p);gradeNext(true);assertEquals(0,progression.get(coders.getFirst().id()).path("exp").asInt());
  String rid=db.id();commands.execute(coders.getFirst(),"SUBMIT",p,rid);gradeNext(true);commands.execute(coders.getFirst(),"SUBMIT",p,rid);
  call(coders.getFirst(),"SUBMIT",p);gradeNext(true);assertEquals(150,progression.get(coders.getFirst().id()).path("exp").asInt());
 }
 @Test void competitiveSubmissionClearsLegacyDraftAndNeverReturnsProofs() {
  ObjectNode r=start(lobby(2,List.of(1),3));String pid=r.path("current").path("problemId").asText();
  call(coders.getFirst(),"DRAFT_SAVE",data("problemId",pid,"language","PY311","source","old code"));
  var ack=call(coders.getFirst(),"SUBMIT",submitPayload(r));assertFalse(ack.has("receipt"));
  assertEquals(0,call(coders.getFirst(),"DRAFT_GET",data("problemId",pid)).size());
  assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM receipts",Integer.class));
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"RECEIPT_GET",data("id",ack.path("id").asText())));
  assertThrows(Store.Fault.class,()->call(coders.getFirst(),"DRAFT_SAVE",data("roomId",r.path("id").asText(),"problemId",pid,"language","PY311","source","late code")));
  assertEquals("print(sum(map(int,input().split())))",db.one("SELECT source_code FROM submissions WHERE id=?",ack.path("id").asText()).get("source_code"));
 }
 @Test void bankExpansionIsIdempotentAndPreservesAuthorConflictsAndSnapshots() throws Exception {
  var baseline=(ObjectNode)db.json.readTree(getClass().getResourceAsStream("/dataset-upgrade-6.json")).get(0).deepCopy();
  db.sql.update("INSERT INTO categories VALUES('arithmetic','Số học','Số học')");
  var saved=(ObjectNode)createProblem(1,false);String id=saved.path("id").asText(),code=saved.path("publicId").asText();
  baseline.put("id",id).put("version",7);db.sql.update("UPDATE problems SET version=7,document=? WHERE id=?",db.write(baseline),id);
  var expansion=new vn.codegrade.db.SeedBankExpansion(db,catalog,identity);expansion.apply();expansion.apply();
  assertEquals(201,db.sql.queryForObject("SELECT COUNT(*) FROM problems",Integer.class));
  assertEquals(8,catalog.document(id).path("version").asInt());assertEquals(5,catalog.document(id).path("testcases").size());assertEquals(code,catalog.document(id).path("publicId").asText());
  var changed=(ObjectNode)catalog.document(id);((ObjectNode)changed.path("general")).put("questionName","AUTHOR changed title");call(author,"QUESTION_SAVE",changed);expansion.apply();
  assertEquals("AUTHOR changed title",catalog.document(id).path("general").path("questionName").asText());
  assertEquals(1,db.sql.queryForObject("SELECT COUNT(*) FROM audit WHERE action='SEED_V6_CONFLICT' AND entity_id=?",Integer.class,id));
 }
 @Test void rankedWindowsIncludeTheirBoundaryAndExcludeTheNextPoint() {
  for(int[] c:List.of(new int[]{0,150,1},new int[]{0,151,0},new int[]{10,250,1},new int[]{10,251,0},new int[]{20,350,1},new int[]{20,351,0},new int[]{30,400,1},new int[]{30,401,0})) {
   db.sql.update("DELETE FROM match_queue");db.sql.update("DELETE FROM rooms");
   for(int i=0;i<5;i++){progression.get(coders.get(i).id());db.sql.update("UPDATE progression SET rating=? WHERE user_id=?",1000+(i==4?c[1]:0),coders.get(i).id());call(coders.get(i),"MATCH_QUEUE_JOIN",data("mode","RANKED"));}
   db.sql.update("UPDATE match_queue SET joined_at=?",db.now()-c[0]*1000L);matchmaking.tick();
   assertEquals(c[2],db.sql.queryForObject("SELECT COUNT(*) FROM rooms WHERE state='LOBBY'",Integer.class),Arrays.toString(c));
  }
 }
 @Test void tiesSplitOccupiedRewardsAndCancelledMatchesNeverReward() {
  var ids=coders.subList(0,5).stream().map(User::id).toList();
  var r=data("id",db.id(),"state","UNRESOLVED","mode","RANKED","participants",ids,"winnerId",ids.getFirst());
  db.atomic(()->{progression.settle(r);return null;});assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM reward_events",Integer.class));
  r.put("state","FINISHED");db.atomic(()->{progression.settle(r);return null;});
  assertEquals(300,db.sql.queryForObject("SELECT SUM(exp) FROM match_results",Integer.class));
  for(int i=1;i<5;i++){var result=db.one("SELECT * FROM match_results WHERE user_id=?",ids.get(i));assertEquals(2,((Number)result.get("placement")).intValue());assertEquals(50,((Number)result.get("exp")).intValue());assertEquals(996,((Number)result.get("rating_after")).intValue());}
 }
 @Test void multipleConnectionsAndAcceptCancelRaceCannotDuplicateMembership() throws Exception {
  var pool=Executors.newFixedThreadPool(2);
  try {
   var joins=new ArrayList<Future<Boolean>>();for(int i=0;i<2;i++)joins.add(pool.submit(()->{try{call(coders.getFirst(),"MATCH_QUEUE_JOIN",data("mode","NORMAL"));return true;}catch(Store.Fault e){return false;}}));
   int count=0;for(var f:joins)if(f.get())count++;assertEquals(1,count);
   JsonNode found=null;for(int i=1;i<5;i++)found=call(coders.get(i),"MATCH_QUEUE_JOIN",data("mode","NORMAL"));String rid=found.path("roomId").asText();
   for(int i=0;i<3;i++)call(coders.get(i),"MATCH_ACCEPT",data("roomId",rid));
   var accept=pool.submit(()->{try{call(coders.get(3),"MATCH_ACCEPT",data("roomId",rid));}catch(Store.Fault ignored){}});
   var cancel=pool.submit(()->call(coders.get(4),"MATCH_DECLINE",data()));accept.get();cancel.get();
   assertEquals("CLOSED",rooms.load(rid).path("state").asText());assertEquals(4,db.sql.queryForObject("SELECT COUNT(*) FROM match_queue WHERE state='WAITING'",Integer.class));
  }finally{pool.shutdownNow();}
 }
 @Test void validationBacklogCannotStarveRealCompetitiveSubmissions() {
  ObjectNode r=start(lobby(2,List.of(1),3));var extra=createProblem(1,false);call(author,"QUESTION_VALIDATE",data("id",extra.path("id").asText()));
  db.sql.update("UPDATE submissions SET received_at=0 WHERE status='QUEUED'");
  var ack=call(coders.getFirst(),"SUBMIT",submitPayload(r));var job=db.tree(judge.claim("test-worker"));assertEquals(ack.path("id").asText(),job.path("id").asText());
 }
 @Test void legacySolvedProblemCannotBeFarmedAfterInstallingProgression() {
  var q=createProblem(1,false);String pid=q.path("id").asText();db.sql.update("INSERT INTO solved VALUES(?,?)",coders.getFirst().id(),pid);
  call(coders.getFirst(),"SUBMIT",data("problemId",pid,"language","PY311","source","pass"));gradeNext(true);
  assertEquals(0,progression.get(coders.getFirst().id()).path("exp").asInt());
 }
 @Test void leavingAfterEliminationCannotImprovePlacement() {
  ObjectNode r=start(lobby(5,List.of(1),4));String rid=r.path("id").asText();everyoneAc(r);r=nextRound(rooms.load(rid));
  call(coders.get(4),"ROOM_LEAVE",data("roomId",rid));
  everyoneAc(r);r=nextRound(rooms.load(rid));everyoneAc(r);r=rooms.load(rid);assertEquals("FINISHED",r.path("state").asText());
  assertEquals(4,db.one("SELECT placement FROM match_results WHERE room_id=? AND user_id=?",rid,coders.get(4).id()).get("placement"));
 }
 @Test void retiredProofCommandCannotReplayLegacySignedResponse() {
  String rid=db.id();var p=data("id","legacy");String fingerprint=Store.hash("RECEIPT_GET"+commands.canonical(p));
  db.sql.update("INSERT INTO commands VALUES(?,?,?,?,?)",coders.getFirst().id(),rid,fingerprint,"{\"signature\":\"old\",\"payload\":\"old\"}",db.now());
  assertThrows(Store.Fault.class,()->commands.execute(coders.getFirst(),"RECEIPT_GET",p,rid));
  var stripped=Commands.withoutProofs(data("receipt",data("signature","old"),"nested",data("certificate",data("signature","old"))));assertFalse(stripped.has("receipt"));assertFalse(stripped.path("nested").has("certificate"));
 }
 @Test void earlierInfrastructureFailureVoidsFinalRatherThanChargingRankLoss() {
  ObjectNode r=start(lobby(2,List.of(1),3));call(coders.getFirst(),"SUBMIT",submitPayload(r));var first=db.tree(judge.claim("test-worker"));
  call(coders.get(1),"SUBMIT",submitPayload(r));var second=db.tree(judge.claim("test-worker"));grade(second,true);
  for(int i=0;i<3;i++) {judge.complete("test-worker",data("id",first.path("id").asText(),"leaseToken",first.path("leaseToken").asText(),"systemError",true));if(i<2)first=db.tree(judge.claim("test-worker"));}
  var current=rooms.load(r.path("id").asText());assertEquals("RESCUE",current.path("nextKind").asText());assertFalse(current.has("winnerId"));assertEquals(0,db.sql.queryForObject("SELECT COUNT(*) FROM reward_events",Integer.class));
 }
 @Test void existingFrozenRoomKeepsItsLegacyTestsUntilTheMatchEnds() throws Exception {
  ObjectNode r=start(lobby(2,List.of(1),3));var original=db.json.readTree(getClass().getResourceAsStream("/dataset-upgrade-6.json")).get(0);
  ((ObjectNode)r.path("frozenProblem")).set("testcases",original.path("testcases"));writeRoom(r);
  var ack=call(coders.getFirst(),"SUBMIT",submitPayload(r));var frozen=db.read((String)db.one("SELECT snapshot FROM submissions WHERE id=?",ack.path("id").asText()).get("snapshot"));
  assertEquals(original.path("testcases").size(),frozen.path("testcases").size());assertTrue(frozen.path("testcases").size()>5);
 }
 @Test void deferredContestProblemStillWorksInIndependentPractice() throws Exception {
  ObjectNode q=(ObjectNode)createProblem(1,false);String pid=q.path("id").asText();var baseline=db.json.readTree(getClass().getResourceAsStream("/dataset-upgrade-6.json")).get(0);
  q.set("testcases",baseline.path("testcases"));db.sql.update("UPDATE problems SET document=? WHERE id=?",db.write(q),pid);
  var c=data("startsAt",db.now()-1000,"endsAt",db.now()+60000,"problemIds",List.of(pid));db.sql.update("INSERT INTO contests VALUES(?,?,?)",db.id(),author.id(),db.write(c));
  var ack=call(coders.getFirst(),"SUBMIT",data("problemId",pid,"source","pass","language","PY311"));
  var snapshot=db.read((String)db.one("SELECT snapshot FROM submissions WHERE id=?",ack.path("id").asText()).get("snapshot"));assertEquals(baseline.path("testcases").size(),snapshot.path("testcases").size());
 }
}
