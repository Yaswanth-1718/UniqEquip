package com.univ.equipment.repository;

import com.univ.equipment.model.EmailNotification;
import com.univ.equipment.model.EmailNotificationStatus;
import com.univ.equipment.model.EmailNotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailNotificationRepository extends JpaRepository<EmailNotification, Long> {

    List<EmailNotification> findByStatusAndScheduledForLessThanEqual(
            EmailNotificationStatus status, LocalDateTime now);

    List<EmailNotification> findByStatusAndNextAttemptAtLessThanEqual(
            EmailNotificationStatus status, LocalDateTime now);

    List<EmailNotification> findByBookingId(Long bookingId);

    Optional<EmailNotification> findByBookingIdAndType(Long bookingId, EmailNotificationType type);

    List<EmailNotification> findByBookingIdAndStatus(Long bookingId, EmailNotificationStatus status);

    long countByStatus(EmailNotificationStatus status);
}
