package vn.codegrade.config;

import org.springframework.context.annotation.*;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.servlet.config.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;
import vn.codegrade.protocol.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@Configuration
@EnableWebSocket
public class NetworkConfig implements WebSocketConfigurer,WebMvcConfigurer {
    private final ClientSocket clients; private final WorkerSocket workers;
    @Value("${app.origins}") String origins;
    public NetworkConfig(ClientSocket clients,WorkerSocket workers) { this.clients=clients; this.workers=workers; }
    @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry r) {
        r.addHandler(clients,"/ws").setAllowedOrigins(origins.split(","));
        r.addHandler(workers,"/worker-ws").setAllowedOrigins(origins.split(","));
    }
    @Bean public ServletServerContainerFactoryBean webSocketContainer() {
        var c=new ServletServerContainerFactoryBean();
        c.setMaxTextMessageBufferSize(32*1024*1024); c.setMaxSessionIdleTimeout(60_000L); return c;
    }
    @Override public void addResourceHandlers(ResourceHandlerRegistry r) {
        r.addResourceHandler("/**").addResourceLocations("classpath:/static/").setCachePeriod(0);
    }
    @RestController static class StaticApi {
        @GetMapping("/api/health") public Object health() { return Map.of("status","UP","service","CodeGrade Network"); }
        @GetMapping("/api/meta") public Object meta() {
            return Map.of("protocolVersion",1,"roles",List.of("ADMIN","AUTHOR","CODER"),"difficulties",List.of(1,2,3,4,5,6),
                "languages",List.of("CPP11","CPP17","CPP20","PY311"),
                "questionTypes",List.of(Map.of("id","python3","description","Python 3.11: định nghĩa hàm, testcode được nối sau bài làm"),
                    Map.of("id","python3_program","description","Python 3.11: chương trình stdin/stdout"),
                    Map.of("id","cpp_program","description","C++11/17/20: chương trình stdin/stdout"),
                    Map.of("id","cpp_function","description","C++11/17/20: hàm, testcode đặt trong main")));
        }
    }
}
