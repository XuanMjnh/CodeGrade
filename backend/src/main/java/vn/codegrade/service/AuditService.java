package vn.codegrade.service;

import static vn.codegrade.model.Validation.require;

import org.springframework.stereotype.Service;
import vn.codegrade.model.User;
import vn.codegrade.repository.ActivityRepository;
import vn.codegrade.support.ServiceContext;

@Service
public class AuditService {
  private final ActivityRepository activity;
  private final ServiceContext context;

  public AuditService(ActivityRepository activity, ServiceContext context) {
    this.activity = activity;
    this.context = context;
  }

  public Object list(User user, boolean summary) {
    require(user.admin(), "Cần quyền admin");
    var rows = activity.listAudit(summary);
    if (!summary)
      for (var row : rows)
        row.put(
            "payload",
            context.write(CommandService.withoutProofs(context.read((String) row.get("payload")))));
    return rows;
  }
}
