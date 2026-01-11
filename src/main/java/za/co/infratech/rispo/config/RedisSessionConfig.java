package za.co.infratech.rispo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;

/**
 * Redis Session Configuration
 * Enables distributed session management for horizontal scaling
 * Sessions are stored in Redis and shared across all application instances
 */
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800) // 30 minutes
public class RedisSessionConfig {
    // Spring Session will automatically configure Redis session repository
    // No additional beans needed - it's all auto-configured
}
