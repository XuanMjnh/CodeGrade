package vn.codegrade.repository;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import vn.codegrade.model.DomainException;

/** JDBC is confined to the persistence layer. Repositories expose parameterized operations. */
public abstract class JdbcRepository {
  protected final JdbcTemplate jdbc;

  protected JdbcRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  protected Map<String, Object> one(String sql, Object... parameters) {
    return jdbc.query(
        sql,
        rs -> {
          if (!rs.next()) throw new DomainException("NOT_FOUND", "Không tìm thấy dữ liệu");
          var row = new org.springframework.jdbc.core.ColumnMapRowMapper().mapRow(rs, 0);
          if (rs.next()) throw new IllegalStateException("Expected one database row");
          return row;
        },
        parameters);
  }
}
