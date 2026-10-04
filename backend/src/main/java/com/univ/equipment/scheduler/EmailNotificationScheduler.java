package com.univ.equipment.scheduler;

import com.univ.equipment.service.EmailNotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Picks up due email notifications about once a minute and processes each
 * in its own transaction. Idempotent: a notification that is already SENT
 * (or CANCELLED) is never sent again, even across restarts.
 *
 * NOTE (Render free tier): the service sleeps when idle, so this in-process
 * scheduler cannot fire at exact times while asleep. Exact-time delivery
 * needs an always-on instance or an external cron hitting a protected
 * endpoint; see README.
 */
@Component
public class EmailNotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationScheduler.class);

    private final EmailNotificationService notificationService;

    public EmailNotificationScheduler(EmailNotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Scheduled(fixedDelay = 60000)
    public void processDueNotifications() {
        try {
            List<Long> dueIds = notificationService.findDueNotificationIds(LocalDateTime.now());
            if (dueIds.isEmpty()) {
                return;
            }
            log.info("Email scheduler: {} notification(s) due.", dueIds.size());
            for (Long id : dueIds) {
                try {
                    notificationService.processDueNotification(id);
                } catch (Exception e) {
                    log.error("Scheduler failed to process notification {}: {}", id, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Email scheduler run failed: {}", e.getMessage());
        }
    }
}
