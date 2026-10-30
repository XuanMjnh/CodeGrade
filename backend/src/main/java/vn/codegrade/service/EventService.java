package vn.codegrade.service;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import vn.codegrade.repository.ActivityRepository;

/** Event feed use cases exposed to the transport layer. */
@Service
public class EventService {
  private final ActivityRepository activity;

  public EventService(ActivityRepository activity) {
    this.activity = activity;
  }

  public long head() {
    return activity.headSequence();
  }

  public List<Map<String, Object>> poll(long after, String user) {
    return activity.findEventsAfter(after, user);
  }
}
