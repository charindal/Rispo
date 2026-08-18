package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.config.RabbitMQConfig;
import za.co.infratech.rispo.dto.request.RatingCalculationMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageConsumerService {

    private final RatingEngine ratingEngine;

    @RabbitListener(queues = RabbitMQConfig.RATING_CALCULATION_QUEUE)
    @CacheEvict(value = {"players", "matches"}, allEntries = true)
    public void handleRatingCalculation(RatingCalculationMessage message) {
        log.info("Received rating calculation message for match {}: type={}",
                message.getMatchId(), message.getCalculationType());
        
        try {
            // Process rating calculation asynchronously
            ratingEngine.processMatchRating(message.getMatchId());
            
            log.info("Successfully processed rating calculation for match {}", message.getMatchId());
        } catch (Exception e) {
            String errorMsg = e.getMessage();
            
            // Handle idempotent cases - these are not real errors, just duplicate processing
            if (errorMsg != null && (errorMsg.contains("Match has already been rated") 
                    || errorMsg.contains("Match not found"))) {
                log.warn("Skipping rating calculation for match {}: {} (not retrying)",
                        message.getMatchId(), errorMsg);
                return; // Acknowledge message without retrying
            }
            
            log.error("Failed to process rating calculation for match {}: {}",
                    message.getMatchId(), e.getMessage(), e);
            // Message will be retried or moved to DLQ based on RabbitMQ configuration
            throw new RuntimeException("Rating calculation failed", e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_QUEUE)
    public void handleNotification(String notificationMessage) {
        log.info("Received notification message: {}", notificationMessage);
        
        try {
            // For now just log it - can be expanded to send emails, push notifications, etc.
            log.info("Processing notification: {}", notificationMessage);
            
            // Future: Parse JSON and send actual emails/SMS/push notifications
            
        } catch (Exception e) {
            log.error("Failed to process notification: {}", e.getMessage(), e);
        }
    }
}
