package vn.codegrade.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class TransactionRepository extends JdbcRepository {
  public TransactionRepository(JdbcTemplate jdbc) {
    super(jdbc);
  }

  public void lock(String scope) {
    jdbc.queryForObject(
        "SELECT scope FROM transaction_locks WHERE scope=? FOR UPDATE", String.class, scope);
  }
}
