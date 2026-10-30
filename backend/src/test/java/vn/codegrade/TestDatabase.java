package vn.codegrade;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import vn.codegrade.repository.ActivityRepository;
import vn.codegrade.support.ServiceContext;
import vn.codegrade.support.UnitOfWork;

/** SQL fixture access exists only in tests; production services use repositories. */
public class TestDatabase extends ServiceContext {
  public final JdbcTemplate sql;

  public TestDatabase(
      ObjectMapper json, UnitOfWork transactions, ActivityRepository activity, JdbcTemplate sql) {
    super(json, transactions, activity);
    this.sql = sql;
  }

  public Map<String, Object> one(String query, Object... args) {
    return sql.queryForList(query, args).getFirst();
  }
}
