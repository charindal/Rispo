package za.co.infratech.rispo.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        // Create ObjectMapper with JavaTimeModule for LocalDateTime support
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        // Default cache configuration (5 minutes)
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(5))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer(objectMapper))
                )
                .disableCachingNullValues();

        // Specific cache configurations with different TTLs
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // Player profile cache - 5 minutes (frequently accessed, changes rarely)
        cacheConfigurations.put("players", defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // Club player list cache - 10 minutes (medium frequency, more stable)
        cacheConfigurations.put("clubPlayers", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        
        // Challenge counts cache - 1 minute (changes frequently)
        cacheConfigurations.put("challengeCounts", defaultConfig.entryTtl(Duration.ofMinutes(1)));
        
        // Player challenges list - 2 minutes (updated often)
        cacheConfigurations.put("playerChallenges", defaultConfig.entryTtl(Duration.ofMinutes(2)));
        
        // Tournament data - 15 minutes (changes less frequently)
        cacheConfigurations.put("tournaments", defaultConfig.entryTtl(Duration.ofMinutes(15)));
        
        // Match history - 5 minutes
        cacheConfigurations.put("matches", defaultConfig.entryTtl(Duration.ofMinutes(5)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}
