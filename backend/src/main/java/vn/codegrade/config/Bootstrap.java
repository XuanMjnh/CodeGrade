package vn.codegrade.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import vn.codegrade.service.SeedService;

@Component
public class Bootstrap implements ApplicationRunner {
  private final SeedService seed;

  public Bootstrap(SeedService seed) {
    this.seed = seed;
  }

  @Override
  public void run(ApplicationArguments args) throws Exception {
    seed.run(args);
  }
}
