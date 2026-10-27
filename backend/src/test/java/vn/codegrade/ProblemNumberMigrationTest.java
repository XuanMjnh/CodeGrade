package vn.codegrade;
import org.junit.jupiter.api.Test;
import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.junit.jupiter.api.Assertions.*;
class ProblemNumberMigrationTest {
 @Test void backfillsOldProblemsWithoutChangingTheirIdsOrDocuments(){
  var source=new JdbcDataSource();source.setURL("jdbc:h2:mem:migration_codes;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1");
  Flyway.configure().dataSource(source).locations("classpath:db/migration").target("3").load().migrate();var sql=new JdbcTemplate(source);
  sql.update("INSERT INTO users(id,username,display_name,password_hash,role,created_at) VALUES('author','author','Author','test','AUTHOR',0)");
  sql.update("INSERT INTO categories VALUES('test','Test','Test')");
  for(int i=0;i<2;i++)sql.update("INSERT INTO problems(id,author_id,category_id,title,difficulty,status,survival,version,document,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)","old-"+i,"author","test","Title"+i,1,"ready",false,1,"{\"saved\":true}",20-i*10);
  Flyway.configure().dataSource(source).locations("classpath:db/migration").load().migrate();
  assertEquals(1L,sql.queryForObject("SELECT number FROM problem_numbers WHERE problem_id='old-1'",Long.class));
  assertEquals(2L,sql.queryForObject("SELECT number FROM problem_numbers WHERE problem_id='old-0'",Long.class));
  assertEquals("{\"saved\":true}",sql.queryForObject("SELECT document FROM problems WHERE id='old-0'",String.class));
  assertEquals(0,Flyway.configure().dataSource(source).locations("classpath:db/migration").load().migrate().migrationsExecuted);
 }
}
