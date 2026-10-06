package com.univ.equipment.scheduler;

import com.univ.equipment.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Delivers due in-app reminders about once a minute. Each notification is
 * processed in its own transaction; already-delivered rows are never touched
 * again. Overdue reminders (e.g. after the service slept) are delivered on
 * the next run as long as they are still valid, so nothing is lost.
 */
@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);

    private final NotificationService notificationService;

    public NotificationScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelay = 60000)
    public void deliverDueNotifications() {
        try {
            List<Long> dueIds = notificationService.findDueNotificationIds(LocalDateTime.now());
            if (dueIds.isEmpty()) {
                return;
            }
            log.info("Notification scheduler: {} reminder(s) due.", dueIds.size());
            for (Long id : dueIds) {
                try {
                    notificationService.processDueNotification(id);
                } catch (Exception e) {
                    log.error("Scheduler failed to process notification {}: {}", id, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Notification scheduler run failed: {}", e.getMessage());
        }
    }
}
