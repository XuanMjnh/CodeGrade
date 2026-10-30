package vn.codegrade;

import org.junit.jupiter.api.Test;
import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.junit.jupiter.api.Assertions.*;

class InitialSchemaMigrationTest {
 @Test void createsCurrentSchemaAndPreservesDataOnRestart() {
  var source=new JdbcDataSource();
  source.setURL("jdbc:h2:mem:initial_schema;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
  var flyway=Flyway.configure().dataSource(source).locations("classpath:db/migration").load();
  assertEquals(1,flyway.migrate().migrationsExecuted);
  assertEquals(1,flyway.info().applied().length);
  var sql=new JdbcTemplate(source);
  String hash="h".repeat(255);
  sql.update("INSERT INTO users(id,username,display_name,password_hash,role,created_at) VALUES('author','author','Author',?,'AUTHOR',0)",hash);
  assertEquals(hash,sql.queryForObject("SELECT password_hash FROM users WHERE id='author'",String.class));
  assertEquals("",sql.queryForObject("SELECT email FROM users WHERE id='author'",String.class));
  sql.update("INSERT INTO categories VALUES('test','Test','Test')");
  sql.update("INSERT INTO problems(id,author_id,category_id,title,difficulty,status,survival,version,document,created_at) VALUES('problem','author','test','Title',1,'ready',false,1,'{}',0)");
  sql.update("INSERT INTO problem_numbers(problem_id) VALUES('problem')");
  assertEquals(1L,sql.queryForObject("SELECT number FROM problem_numbers WHERE problem_id='problem'",Long.class));
  sql.update("INSERT INTO submissions(id,user_id,problem_id,request_id,source_code,language,mode,received_at,status,snapshot) VALUES('submission','author','problem','request','pass','PY311','PRACTICE',0,'QUEUED','{}')");
  assertFalse(sql.queryForObject("SELECT rank_eligible FROM submissions WHERE id='submission'",Boolean.class));
  for(String column:java.util.List.of("admission_order","current_test","completed_tests","total_tests"))
   assertEquals(0L,sql.queryForObject("SELECT "+column+" FROM submissions WHERE id='submission'",Long.class));
  sql.update("INSERT INTO progression(user_id) VALUES('author')");
  assertEquals(1000,sql.queryForObject("SELECT rating FROM progression WHERE user_id='author'",Integer.class));
  assertEquals(0,flyway.migrate().migrationsExecuted);
  assertEquals("{}",sql.queryForObject("SELECT snapshot FROM submissions WHERE id='submission'",String.class));
  assertEquals(1,sql.queryForObject("SELECT COUNT(*) FROM problem_numbers",Integer.class));
 }
}
