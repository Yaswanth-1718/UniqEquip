package com.univ.equipment.repository;

import com.univ.equipment.model.NotificationType;
import com.univ.equipment.model.UserNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {

    List<UserNotification> findByUserIdAndDeliveredAtIsNotNullOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndDeliveredAtIsNotNullAndReadFalse(Long userId);

    List<UserNotification> findByDeliveredAtIsNullAndScheduledForLessThanEqual(LocalDateTime now);

    Optional<UserNotification> findByBookingIdAndUserIdAndType(Long bookingId, Long userId, NotificationType type);

    List<UserNotification> findByBookingIdAndTypeAndDeliveredAtIsNull(Long bookingId, NotificationType type);

    List<UserNotification> findByBookingId(Long bookingId);
}
