package com.univ.equipment.service;

import com.univ.equipment.model.BookingRequest;
import com.univ.equipment.model.BookingStatus;
import com.univ.equipment.model.EmailNotification;
import com.univ.equipment.model.EmailNotificationStatus;
import com.univ.equipment.model.EmailNotificationType;
import com.univ.equipment.model.User;
import com.univ.equipment.repository.BookingRequestRepository;
import com.univ.equipment.repository.EmailNotificationRepository;
import com.univ.equipment.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Owns the email_notifications table. Every method swallows its own
 * exceptions (logging them) so email problems can never break booking
 * or admin operations. Each state-changing entry point runs in its own
 * transaction, independent of any surrounding booking transaction.
 */
@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    /** Scheduler retries a FAILED notification at most this many times. */
    public static final int MAX_ATTEMPTS = 3;
    /** Minutes to wait before retrying a failed send. */
    private static final long RETRY_DELAY_MINUTES = 10;

    private final EmailNotificationRepository notificationRepository;
    private final BookingRequestRepository bookingRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public EmailNotificationService(EmailNotificationRepository notificationRepository,
                                    BookingRequestRepository bookingRepository,
                                    UserRepository userRepository,
                                    EmailService emailService) {
        this.notificationRepository = notificationRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // ------------------------------------------------------------------
    // Booking lifecycle hooks (called by BookingService after save)
    // ------------------------------------------------------------------

    /** Booking just created: confirmation (sent now) + future reminders. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookingCreated(BookingRequest booking) {
        try {
            Recipient recipient = resolveRecipient(booking);
            createAndSend(booking.getId(), EmailNotificationType.BOOKING_CONFIRMATION,
                    recipient, LocalDateTime.now(), booking);
            if (booking.getStartDate() != null) {
                LocalDateTime startReminderAt = booking.getStartDate().minusHours(1);
                if (startReminderAt.isAfter(LocalDateTime.now())) {
                    createPending(booking.getId(), EmailNotificationType.START_REMINDER,
                            recipient, startReminderAt);
                }
            }
            if (booking.getEndDate() != null) {
                LocalDateTime returnReminderAt = booking.getEndDate().minusHours(1);
                if (returnReminderAt.isAfter(LocalDateTime.now())) {
                    createPending(booking.getId(), EmailNotificationType.RETURN_REMINDER,
                            recipient, returnReminderAt);
                }
            }
        } catch (Exception e) {
            log.error("Failed to queue notifications for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    /** Admin approved: queue/send BOOKING_APPROVED. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookingApproved(BookingRequest booking) {
        try {
            Recipient recipient = resolveRecipient(booking);
            createAndSend(booking.getId(), EmailNotificationType.BOOKING_APPROVED,
                    recipient, LocalDateTime.now(), booking);
        } catch (Exception e) {
            log.error("Failed to queue approval email for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    /** Faculty/admin rejected: send BOOKING_REJECTED, cancel future reminders. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onBookingRejected(BookingRequest booking, String notes) {
        try {
            Recipient recipient = resolveRecipient(booking);
            EmailNotification n = createPending(booking.getId(), EmailNotificationType.BOOKING_REJECTED,
                    recipient, LocalDateTime.now());
            if (n != null) {
                attemptSend(n, booking, notes);
            }
            cancelFutureReminders(booking.getId());
        } catch (Exception e) {
            log.error("Failed to queue rejection email for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    /** Equipment issued: make sure a return reminder exists. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEquipmentIssued(BookingRequest booking) {
        try {
            if (booking.getEndDate() == null) {
                return;
            }
            LocalDateTime returnReminderAt = booking.getEndDate().minusHours(1);
            if (!returnReminderAt.isAfter(LocalDateTime.now())) {
                return;
            }
            if (notificationRepository.findByBookingIdAndType(
                    booking.getId(), EmailNotificationType.RETURN_REMINDER).isPresent()) {
                return;
            }
            Recipient recipient = resolveRecipient(booking);
            createPending(booking.getId(), EmailNotificationType.RETURN_REMINDER,
                    recipient, returnReminderAt);
        } catch (Exception e) {
            log.error("Failed to ensure return reminder for booking {}: {}", booking.getId(), e.getMessage());
        }
    }

    /** Equipment returned early: cancel the pending return reminder. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onEquipmentReturned(Long bookingId) {
        try {
            cancelOne(bookingId, EmailNotificationType.RETURN_REMINDER);
        } catch (Exception e) {
            log.error("Failed to cancel return reminder for booking {}: {}", bookingId, e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // Scheduler support: each notification processed in its own tx
    // ------------------------------------------------------------------

    /** IDs of notifications the scheduler should attempt right now. */
    @Transactional(readOnly = true)
    public List<Long> findDueNotificationIds(LocalDateTime now) {
        List<Long> due = notificationRepository
                .findByStatusAndScheduledForLessThanEqual(EmailNotificationStatus.PENDING, now)
                .stream().map(EmailNotification::getId).toList();
        List<Long> retries = notificationRepository
                .findByStatusAndNextAttemptAtLessThanEqual(EmailNotificationStatus.FAILED, now)
                .stream()
                .filter(n -> n.getAttemptCount() == null || n.getAttemptCount() < MAX_ATTEMPTS)
                .map(EmailNotification::getId).toList();
        return java.util.stream.Stream.concat(due.stream(), retries.stream()).toList();
    }

    /**
     * Process one due notification: validate against current booking state,
     * send, and mark SENT/FAILED/CANCELLED. Never sends twice: only
     * PENDING (or FAILED-awaiting-retry) rows are picked up, and a SENT row
     * is never eligible again.
     */
    @Transactional
    public void processDueNotification(Long notificationId) {
        Optional<EmailNotification> opt = notificationRepository.findById(notificationId);
        if (opt.isEmpty()) {
            return;
        }
        EmailNotification n = opt.get();
        if (n.getStatus() == EmailNotificationStatus.SENT
                || n.getStatus() == EmailNotificationStatus.CANCELLED) {
            return;
        }

        Optional<BookingRequest> bookingOpt = bookingRepository.findById(n.getBookingId());
        if (bookingOpt.isEmpty()) {
            markCancelled(n, "Booking no longer exists.");
            return;
        }
        BookingRequest booking = bookingOpt.get();

        if (!isStillValid(n.getType(), booking)) {
            markCancelled(n, "No longer applicable for booking status " + booking.getStatus() + ".");
            return;
        }

        attemptSend(n, booking, null);
    }

    /** Admin manual retry of a FAILED notification (sends immediately). */
    @Transactional
    public EmailNotification retry(Long notificationId) {
        EmailNotification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));
        if (n.getStatus() == EmailNotificationStatus.SENT) {
            throw new RuntimeException("Notification already SENT; retry is not allowed without explicit confirmation flow.");
        }
        n.setStatus(EmailNotificationStatus.PENDING);
        n.setScheduledFor(LocalDateTime.now());
        n.setNextAttemptAt(null);
        n.setErrorMessage(null);
        notificationRepository.save(n);
        BookingRequest booking = bookingRepository.findById(n.getBookingId()).orElse(null);
        attemptSend(n, booking, null);
        return notificationRepository.findById(notificationId).orElse(n);
    }

    // ------------------------------------------------------------------
    // Queries for admin UI / booking details
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<EmailNotification> findAll() {
        return notificationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<EmailNotification> findByBookingId(Long bookingId) {
        return notificationRepository.findByBookingId(bookingId);
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /**
     * Send one notification. The booking entity is passed in by lifecycle
     * hooks (it may not be committed yet, so it must NOT be reloaded);
     * scheduler/retry paths load it first and pass null when it is gone.
     */
    private void attemptSend(EmailNotification n, BookingRequest booking, String notes) {
        try {
            if (booking == null) {
                booking = bookingRepository.findById(n.getBookingId()).orElse(null);
            }
            if (booking == null) {
                markCancelled(n, "Booking no longer exists.");
                return;
            }
            switch (n.getType()) {
                case BOOKING_CONFIRMATION ->
                        emailService.sendBookingConfirmation(booking, n.getRecipientEmail(), n.getRecipientName());
                case BOOKING_APPROVED ->
                        emailService.sendBookingApproved(booking, n.getRecipientEmail(), n.getRecipientName());
                case BOOKING_REJECTED ->
                        emailService.sendBookingRejected(booking, n.getRecipientEmail(), n.getRecipientName(),
                                notes != null ? notes : coalesceNotes(booking));
                case START_REMINDER ->
                        emailService.sendStartReminder(booking, n.getRecipientEmail(), n.getRecipientName());
                case RETURN_REMINDER ->
                        emailService.sendReturnReminder(booking, n.getRecipientEmail(), n.getRecipientName());
            }
            n.setStatus(EmailNotificationStatus.SENT);
            n.setSentAt(LocalDateTime.now());
            n.setAttemptCount((n.getAttemptCount() == null ? 0 : n.getAttemptCount()) + 1);
            n.setNextAttemptAt(null);
            n.setErrorMessage(null);
            notificationRepository.save(n);
            log.info("Notification {} ({}) sent to {}", n.getId(), n.getType(), n.getRecipientEmail());
        } catch (Exception e) {
            int attempts = (n.getAttemptCount() == null ? 0 : n.getAttemptCount()) + 1;
            n.setAttemptCount(attempts);
            n.setStatus(EmailNotificationStatus.FAILED);
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            n.setErrorMessage(msg.length() > 900 ? msg.substring(0, 900) : msg);
            n.setNextAttemptAt(attempts < MAX_ATTEMPTS
                    ? LocalDateTime.now().plusMinutes(RETRY_DELAY_MINUTES) : null);
            notificationRepository.save(n);
            log.warn("Notification {} ({}) FAILED (attempt {}): {}", n.getId(), n.getType(), attempts, msg);
        }
    }

    /** Idempotent creation: the (booking_id, type) unique constraint is the backstop. */
    private EmailNotification createPending(Long bookingId, EmailNotificationType type,
                                            Recipient recipient, LocalDateTime scheduledFor) {
        Optional<EmailNotification> existing =
                notificationRepository.findByBookingIdAndType(bookingId, type);
        if (existing.isPresent()) {
            return existing.get();
        }
        EmailNotification n = EmailNotification.builder()
                .bookingId(bookingId)
                .recipientEmail(recipient.email())
                .recipientName(recipient.name())
                .type(type)
                .scheduledFor(scheduledFor)
                .status(EmailNotificationStatus.PENDING)
                .attemptCount(0)
                .createdAt(LocalDateTime.now())
                .build();
        try {
            return notificationRepository.save(n);
        } catch (Exception e) {
            // Lost a race with another creator; return the winner.
            return notificationRepository.findByBookingIdAndType(bookingId, type).orElse(null);
        }
    }

    private void createAndSend(Long bookingId, EmailNotificationType type,
                               Recipient recipient, LocalDateTime scheduledFor,
                               BookingRequest booking) {
        EmailNotification n = createPending(bookingId, type, recipient, scheduledFor);
        if (n != null && n.getStatus() == EmailNotificationStatus.PENDING) {
            attemptSend(n, booking, null);
        }
    }

    private void cancelFutureReminders(Long bookingId) {
        cancelOne(bookingId, EmailNotificationType.START_REMINDER);
        cancelOne(bookingId, EmailNotificationType.RETURN_REMINDER);
    }

    private void cancelOne(Long bookingId, EmailNotificationType type) {
        notificationRepository.findByBookingIdAndType(bookingId, type).ifPresent(n -> {
            if (n.getStatus() == EmailNotificationStatus.PENDING
                    || n.getStatus() == EmailNotificationStatus.FAILED) {
                markCancelled(n, "Cancelled: booking " + type.name() + " no longer applicable.");
            }
        });
    }

    private void markCancelled(EmailNotification n, String reason) {
        n.setStatus(EmailNotificationStatus.CANCELLED);
        n.setErrorMessage(reason);
        notificationRepository.save(n);
        log.info("Notification {} ({}) CANCELLED: {}", n.getId(), n.getType(), reason);
    }

    /**
     * A reminder is only sent while it still makes sense.
     * In particular the return reminder requires ISSUED:
     * REJECTED / RETURNED bookings (and APPROVED-but-never-issued ones)
     * never get a return reminder.
     */
    private boolean isStillValid(EmailNotificationType type, BookingRequest booking) {
        BookingStatus status = booking.getStatus();
        return switch (type) {
            case BOOKING_CONFIRMATION -> true;
            case BOOKING_APPROVED -> status != BookingStatus.REJECTED;
            case BOOKING_REJECTED -> status == BookingStatus.REJECTED;
            case START_REMINDER -> status != BookingStatus.REJECTED
                    && status != BookingStatus.RETURNED
                    && (booking.getEndDate() == null || booking.getEndDate().isAfter(LocalDateTime.now()));
            case RETURN_REMINDER -> status == BookingStatus.ISSUED;
        };
    }

    /** Resolve the requester's real email via UserRepository; never ask the user to retype it. */
    private Recipient resolveRecipient(BookingRequest booking) {
        if (booking.getRequesterId() != null) {
            Optional<User> user = userRepository.findById(booking.getRequesterId());
            if (user.isPresent() && user.get().getEmail() != null && !user.get().getEmail().isBlank()) {
                return new Recipient(user.get().getEmail(), user.get().getName());
            }
        }
        throw new IllegalStateException(
                "No email address found for requesterId " + booking.getRequesterId());
    }

    private String coalesceNotes(BookingRequest booking) {
        if (booking.getAdminNotes() != null && !booking.getAdminNotes().isBlank()) {
            return booking.getAdminNotes();
        }
        return booking.getFacultyNotes();
    }

    private record Recipient(String email, String name) {
    }
}
