package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.config.RabbitMQConfig;
import za.co.infratech.rispo.dto.request.RatingCalculationMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageProducerService {

    private final RabbitTemplate rabbitTemplate;

    public void sendRatingCalculationMessage(RatingCalculationMessage message) {
        log.info("Publishing rating calculation message for match {}: player1={}, player2={}, winner={}",
                message.getMatchId(), message.getPlayer1Id(), message.getPlayer2Id(), message.getWinnerId());
        
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.RISPO_EXCHANGE,
                RabbitMQConfig.RATING_CALCULATION_ROUTING_KEY,
                message
        );
        
        log.debug("Rating calculation message published to queue");
    }

    public void sendNotification(String recipient, String subject, String message) {
        log.info("Publishing notification to {}: {}", recipient, subject);
        
        // Simple notification structure - can be expanded later
        String notificationMessage = String.format("{\"recipient\":\"%s\",\"subject\":\"%s\",\"message\":\"%s\"}",
                recipient, subject, message);
        
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.RISPO_EXCHANGE,
                RabbitMQConfig.NOTIFICATION_ROUTING_KEY,
                notificationMessage
        );
        
        log.debug("Notification published to queue");
    }
}
