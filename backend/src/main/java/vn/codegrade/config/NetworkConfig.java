package vn.codegrade.config;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;
import vn.codegrade.controller.ClientSocketController;
import vn.codegrade.controller.WorkerSocketController;

@Configuration
@EnableWebSocket
public class NetworkConfig implements WebSocketConfigurer, WebMvcConfigurer {
  private final ClientSocketController clients;
  private final WorkerSocketController workers;

  @Value("${app.origins}")
  String origins;

  public NetworkConfig(ClientSocketController clients, WorkerSocketController workers) {
    this.clients = clients;
    this.workers = workers;
  }

  @Override
  public void registerWebSocketHandlers(WebSocketHandlerRegistry r) {
    r.addHandler(clients, "/ws").setAllowedOrigins(origins.split(","));
    r.addHandler(workers, "/worker-ws").setAllowedOrigins(origins.split(","));
  }

  @Bean
  public ServletServerContainerFactoryBean webSocketContainer() {
    var c = new ServletServerContainerFactoryBean();
    c.setMaxTextMessageBufferSize(32 * 1024 * 1024);
    c.setMaxSessionIdleTimeout(60_000L);
    return c;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry r) {
    r.addResourceHandler("/**").addResourceLocations("classpath:/static/").setCachePeriod(0);
  }
}
