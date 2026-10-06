package com.univ.equipment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * In-app notification for a user. A row may exist before its time
 * (scheduledFor in the future, deliveredAt null) but is only visible to
 * the user once deliveredAt is set. Deduplicated by
 * (booking_id, user_id, type).
 */
@Entity
@Table(name = "user_notifications",
        uniqueConstraints = @UniqueConstraint(columnNames = {"booking_id", "user_id", "type"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private NotificationPriority priority = NotificationPriority.INFO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean read = false;

    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime scheduledFor;

    private LocalDateTime deliveredAt;

    private String actionUrl;
}
