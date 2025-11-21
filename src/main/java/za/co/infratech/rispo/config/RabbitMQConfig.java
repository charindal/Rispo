package za.co.infratech.rispo.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Queue names
    public static final String RATING_CALCULATION_QUEUE = "rating-calculation-queue";
    public static final String NOTIFICATION_QUEUE = "notification-queue";
    
    // Exchange names
    public static final String RISPO_EXCHANGE = "rispo-exchange";
    
    // Routing keys
    public static final String RATING_CALCULATION_ROUTING_KEY = "rating.calculate";
    public static final String NOTIFICATION_ROUTING_KEY = "notification.send";

    // Declare exchange
    @Bean
    public TopicExchange rispoExchange() {
        return new TopicExchange(RISPO_EXCHANGE);
    }

    // Declare queues
    @Bean
    public Queue ratingCalculationQueue() {
        return QueueBuilder.durable(RATING_CALCULATION_QUEUE)
                .withArgument("x-dead-letter-exchange", RISPO_EXCHANGE + "-dlx")
                .build();
    }

    @Bean
    public Queue notificationQueue() {
        return QueueBuilder.durable(NOTIFICATION_QUEUE)
                .withArgument("x-dead-letter-exchange", RISPO_EXCHANGE + "-dlx")
                .build();
    }

    // Bind queues to exchange with routing keys
    @Bean
    public Binding ratingCalculationBinding() {
        return BindingBuilder
                .bind(ratingCalculationQueue())
                .to(rispoExchange())
                .with(RATING_CALCULATION_ROUTING_KEY);
    }

    @Bean
    public Binding notificationBinding() {
        return BindingBuilder
                .bind(notificationQueue())
                .to(rispoExchange())
                .with(NOTIFICATION_ROUTING_KEY);
    }

    // Message converter for JSON serialization
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // Configure RabbitTemplate with JSON converter
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
