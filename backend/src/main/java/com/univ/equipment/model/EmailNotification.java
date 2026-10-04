package com.univ.equipment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Database-backed record of a booking email notification.
 * The database is the source of truth for pending reminder jobs, so a
 * restart never loses scheduled reminders and a reminder is never sent twice.
 */
@Entity
@Table(name = "email_notifications",
        uniqueConstraints = @UniqueConstraint(columnNames = {"booking_id", "type"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(nullable = false)
    private String recipientEmail;

    private String recipientName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmailNotificationType type;

    @Column(nullable = false)
    private LocalDateTime scheduledFor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EmailNotificationStatus status = EmailNotificationStatus.PENDING;

    private LocalDateTime sentAt;

    @Builder.Default
    private Integer attemptCount = 0;

    /** Earliest time a FAILED notification may be retried by the scheduler. */
    private LocalDateTime nextAttemptAt;

    @Column(length = 1000)
    private String errorMessage;

    private LocalDateTime createdAt;
}
