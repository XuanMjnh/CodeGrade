package vn.codegrade;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import vn.codegrade.worker.WorkerMain;

@SpringBootApplication
public class Application {
  public static void main(String[] args) throws Exception {
    if (args.length > 0 && args[0].equals("--worker")) {
      WorkerMain.run();
      return;
    }
    SpringApplication.run(Application.class, args);
  }
}
