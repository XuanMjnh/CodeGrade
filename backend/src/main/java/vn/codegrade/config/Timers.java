package vn.codegrade.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
@Configuration
@EnableScheduling
@ConditionalOnProperty(name="app.scheduling",havingValue="true",matchIfMissing=true)
public class Timers {}
