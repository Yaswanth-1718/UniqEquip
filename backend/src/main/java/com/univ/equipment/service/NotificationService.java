package com.univ.equipment.service;

import com.univ.equipment.model.BookingRequest;
import com.univ.equipment.model.BookingStatus;
import com.univ.equipment.model.NotificationPriority;
import com.univ.equipment.model.NotificationType;
import com.univ.equipment.model.UserNotification;
import com.univ.equipment.repository.BookingRequestRepository;
import com.univ.equipment.repository.UserNotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

/**
 * Central place for building in-app user notifications. All lifecycle entry
 * points swallow their own failures so notification problems can never break
 * booking operations. Each runs in its own transaction.
 */
@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a");

    private final UserNotificationRepository notificationRepository;
    private final BookingRequestRepository bookingRepository;

    @Value("${app.timezone:Asia/Kolkata}")
    private String timezoneId;

    public NotificationService(UserNotificationRepository notificationRepository,
                               BookingRequestRepository bookingRepository) {
        this.notificationRepository = notificationRepository;
        this.bookingRepository = bookingRepository;
    }

    private ZoneId zone() {
        try {
            return ZoneId.of(timezoneId);
        } catch (Exception e) {
            return ZoneId.of("Asia/Kolkata");
        }
    }

    private String timeOf(LocalDateTime dt) {
        if (dt == null) {
            return "-";
        }
        return dt.atZone(zone()).format(TIME_FMT);
    }

    // ------------------------------------------------------------------
    // Booking lifecycle hooks (called by BookingService after save)
    // ------------------------------------------------------------------

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyBookingCreated(BookingRequest booking) {
        try {
            deliver(booking, NotificationType.BOOKING_CREATED, NotificationPriority.INFO,
                    "Booking Request Submitted",
                    "Your booking request for \"" + booking.getEventTitle()
                            + "\" has been submitted successfully and is awaiting faculty approval.",
                    LocalDateTime.now());
            scheduleStartReminder(booking);
            scheduleReturnReminder(booking);
        } catch (Exception e) {
            log.error("notifyBookingCreated failed for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyFacultyApproved(BookingRequest booking) {
        try {
            deliver(booking, NotificationType.BOOKING_FACULTY_APPROVED, NotificationPriority.INFO,
                    "Faculty Approval Received",
                    "Your booking request for \"" + booking.getEventTitle()
                            + "\" has been approved by faculty and is now waiting for admin approval.",
                    LocalDateTime.now());
        } catch (Exception e) {
            log.error("notifyFacultyApproved failed for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyBookingApproved(BookingRequest booking) {
        try {
            deliver(booking, NotificationType.BOOKING_APPROVED, NotificationPriority.SUCCESS,
                    "Booking Approved",
                    "Your equipment booking for \"" + booking.getEventTitle() + "\" has been approved.",
                    LocalDateTime.now());
        } catch (Exception e) {
            log.error("notifyBookingApproved failed for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyBookingRejected(BookingRequest booking, String notes) {
        try {
            String message = "Your booking request for \"" + booking.getEventTitle() + "\" was rejected.";
            if (notes != null && !notes.isBlank()) {
                message += " Reason: " + notes;
            }
            deliver(booking, NotificationType.BOOKING_REJECTED, NotificationPriority.ERROR,
                    "Booking Rejected", message, LocalDateTime.now());
            cancelFutureReminders(booking.getId());
        } catch (Exception e) {
            log.error("notifyBookingRejected failed for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyEquipmentIssued(BookingRequest booking) {
        try {
            deliver(booking, NotificationType.EQUIPMENT_ISSUED, NotificationPriority.SUCCESS,
                    "Equipment Issued",
                    "Your equipment for \"" + booking.getEventTitle()
                            + "\" has been issued. Please return it before " + timeOf(booking.getEndDate()) + ".",
                    LocalDateTime.now());
            ensureReturnReminder(booking);
        } catch (Exception e) {
            log.error("notifyEquipmentIssued failed for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifyEquipmentReturned(BookingRequest booking) {
        try {
            deliver(booking, NotificationType.EQUIPMENT_RETURNED, NotificationPriority.SUCCESS,
                    "Equipment Returned Successfully",
                    "The equipment for booking #" + booking.getId() + " has been returned successfully.",
                    LocalDateTime.now());
            cancelPendingReminders(booking.getId(), NotificationType.RETURN_REMINDER);
        } catch (Exception e) {
            log.error("notifyEquipmentReturned failed for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // Reminder scheduling (rows exist before their time, undelivered)
    // ------------------------------------------------------------------

    public void scheduleStartReminder(BookingRequest booking) {
        if (booking.getStartDate() == null) {
            return;
        }
        LocalDateTime at = booking.getStartDate().minusHours(1);
        if (!at.isAfter(LocalDateTime.now())) {
            return;
        }
        schedule(booking, NotificationType.START_REMINDER, NotificationPriority.WARNING,
                "Booking Starts in 1 Hour",
                "Your equipment booking for \"" + booking.getEventTitle()
                        + "\" starts at " + timeOf(booking.getStartDate()) + ".",
                at);
    }

    public void scheduleReturnReminder(BookingRequest booking) {
        if (booking.getEndDate() == null) {
            return;
        }
        LocalDateTime at = booking.getEndDate().minusHours(1);
        if (!at.isAfter(LocalDateTime.now())) {
            return;
        }
        schedule(booking, NotificationType.RETURN_REMINDER, NotificationPriority.WARNING,
                "1 Hour Remaining",
                "You have 1 hour remaining. Please return the equipment before "
                        + timeOf(booking.getEndDate()) + ".",
                at);
    }

    public void ensureReturnReminder(BookingRequest booking) {
        if (booking.getEndDate() == null
                || !booking.getEndDate().minusHours(1).isAfter(LocalDateTime.now())) {
            return;
        }
        if (notificationRepository.findByBookingIdAndUserIdAndType(
                booking.getId(), booking.getRequesterId(), NotificationType.RETURN_REMINDER).isPresent()) {
            return;
        }
        scheduleReturnReminder(booking);
    }

    public void cancelFutureReminders(Long bookingId) {
        cancelPendingReminders(bookingId, NotificationType.START_REMINDER);
        cancelPendingReminders(bookingId, NotificationType.RETURN_REMINDER);
    }

    // ------------------------------------------------------------------
    // Scheduler support
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<Long> findDueNotificationIds(LocalDateTime now) {
        return notificationRepository.findByDeliveredAtIsNullAndScheduledForLessThanEqual(now)
                .stream().map(UserNotification::getId).toList();
    }

    /** Deliver one due reminder (own transaction). Invalid ones are deleted. */
    @Transactional
    public void processDueNotification(Long notificationId) {
        Optional<UserNotification> opt = notificationRepository.findById(notificationId);
        if (opt.isEmpty()) {
            return;
        }
        UserNotification n = opt.get();
        if (n.getDeliveredAt() != null) {
            return; // already delivered: never deliver twice
        }
        Optional<BookingRequest> bookingOpt = bookingRepository.findById(n.getBookingId());
        if (bookingOpt.isEmpty()) {
            notificationRepository.delete(n);
            return;
        }
        if (!isStillValid(n.getType(), bookingOpt.get())) {
            notificationRepository.delete(n);
            log.info("Reminder {} ({}) removed: no longer applicable.", n.getId(), n.getType());
            return;
        }
        n.setDeliveredAt(LocalDateTime.now());
        notificationRepository.save(n);
    }

    // ------------------------------------------------------------------
    // User API
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<UserNotification> getDelivered(Long userId) {
        return notificationRepository.findByUserIdAndDeliveredAtIsNotNullOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndDeliveredAtIsNotNullAndReadFalse(userId);
    }

    @Transactional
    public UserNotification markAsRead(Long id, Long userId) {
        UserNotification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
        requireOwner(n, userId);
        n.setRead(true);
        return notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<UserNotification> unread = notificationRepository
                .findByUserIdAndDeliveredAtIsNotNullOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !Boolean.TRUE.equals(n.getRead())).toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void deleteNotification(Long id, Long userId) {
        UserNotification n = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + id));
        requireOwner(n, userId);
        notificationRepository.delete(n);
    }

    // ------------------------------------------------------------------
    // Admin support
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<UserNotification> findAll() {
        return notificationRepository.findAll();
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /** Immediate notification: visible to the user right away. */
    private void deliver(BookingRequest booking, NotificationType type, NotificationPriority priority,
                         String title, String message, LocalDateTime at) {
        if (notificationRepository.findByBookingIdAndUserIdAndType(
                booking.getId(), booking.getRequesterId(), type).isPresent()) {
            return; // never create duplicates
        }
        try {
            notificationRepository.save(build(booking, type, priority, title, message, at, at));
        } catch (Exception e) {
            // Lost a uniqueness race; the existing row wins.
            log.debug("Notification row already exists for booking {} type {}.", booking.getId(), type);
        }
    }

    /** Future reminder: stored now, visible only after the scheduler delivers it. */
    private void schedule(BookingRequest booking, NotificationType type, NotificationPriority priority,
                          String title, String message, LocalDateTime at) {
        if (notificationRepository.findByBookingIdAndUserIdAndType(
                booking.getId(), booking.getRequesterId(), type).isPresent()) {
            return; // never create duplicates
        }
        try {
            notificationRepository.save(build(booking, type, priority, title, message, at, null));
        } catch (Exception e) {
            log.debug("Reminder row already exists for booking {} type {}.", booking.getId(), type);
        }
    }

    private UserNotification build(BookingRequest booking, NotificationType type, NotificationPriority priority,
                                   String title, String message, LocalDateTime scheduledFor,
                                   LocalDateTime deliveredAt) {
        return UserNotification.builder()
                .userId(booking.getRequesterId())
                .bookingId(booking.getId())
                .title(title)
                .message(message)
                .type(type)
                .priority(priority)
                .read(false)
                .createdAt(LocalDateTime.now())
                .scheduledFor(scheduledFor)
                .deliveredAt(deliveredAt)
                .actionUrl("tracker")
                .build();
    }

    private void cancelPendingReminders(Long bookingId, NotificationType type) {
        try {
            List<UserNotification> pending =
                    notificationRepository.findByBookingIdAndTypeAndDeliveredAtIsNull(bookingId, type);
            if (!pending.isEmpty()) {
                notificationRepository.deleteAll(pending);
                log.info("Cancelled {} pending {} reminder(s) for booking {}.",
                        pending.size(), type, bookingId);
            }
        } catch (Exception e) {
            log.error("cancelPendingReminders failed for booking {}: {}", bookingId, e.getMessage());
        }
    }

    private boolean isStillValid(NotificationType type, BookingRequest booking) {
        BookingStatus status = booking.getStatus();
        return switch (type) {
            case START_REMINDER -> status != BookingStatus.REJECTED && status != BookingStatus.RETURNED;
            case RETURN_REMINDER -> status == BookingStatus.ISSUED;
            default -> true;
        };
    }

    private void requireOwner(UserNotification n, Long userId) {
        if (userId == null || !userId.equals(n.getUserId())) {
            throw new RuntimeException("You can only manage your own notifications.");
        }
    }
}
