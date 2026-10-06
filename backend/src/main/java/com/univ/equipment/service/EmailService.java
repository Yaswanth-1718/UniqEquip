package com.univ.equipment.service;

import com.univ.equipment.model.BookingItem;
import com.univ.equipment.model.BookingRequest;
import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

/**
 * Sends booking emails via Gmail SMTP. Never throws when mail is
 * unconfigured or SMTP fails: callers record the outcome in the
 * email_notifications table instead, so bookings always succeed.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a z");

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String fromAddress;

    @Value("${app.mail.from-name:UniqEquip}")
    private String fromName;

    @Value("${app.timezone:Asia/Kolkata}")
    private String timezoneId;

    @Value("${n8n.enabled:false}")
    private boolean n8nEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @PostConstruct
    public void checkConfiguration() {
        if (n8nEnabled) {
            log.info("n8n mode is active: booking emails are delivered by n8n, local SMTP flow is dormant.");
            return;
        }
        if (!isMailConfigured()) {
            log.warn("MAIL_USERNAME / MAIL_PASSWORD are not set. Booking emails will be recorded as FAILED "
                    + "and retried later; bookings themselves are unaffected. "
                    + "See README for Gmail App Password setup.");
        } else {
            log.info("Email sending configured (host=smtp.gmail.com, from={}).", fromAddress);
        }
    }

    public boolean isMailConfigured() {
        if (mailSender instanceof JavaMailSenderImpl impl) {
            return impl.getUsername() != null && !impl.getUsername().isBlank()
                    && impl.getPassword() != null && !impl.getPassword().isBlank();
        }
        return fromAddress != null && !fromAddress.isBlank();
    }

    public ZoneId zone() {
        try {
            return ZoneId.of(timezoneId);
        } catch (Exception e) {
            return ZoneId.of("Asia/Kolkata");
        }
    }

    /** Formats like "Mon, 06 Oct 2026". */
    public String formatDate(LocalDateTime dt) {
        return dt == null ? "-" : dt.format(DATE_FMT);
    }

    /** Formats like "5:00 PM IST" in the configured application timezone. */
    public String formatTime(LocalDateTime dt) {
        if (dt == null) {
            return "-";
        }
        return dt.atZone(ZoneId.systemDefault()).withZoneSameInstant(zone()).format(TIME_FMT);
    }

    // ------------------------------------------------------------------
    // Public send methods (throw on failure; EmailNotificationService
    // catches and records FAILED so bookings never break)
    // ------------------------------------------------------------------

    public void sendBookingConfirmation(BookingRequest booking, String toEmail, String toName) throws Exception {
        String subject = "UniqEquip | Booking Request #" + booking.getId() + " Received";
        String statusNote = statusNoteFor(booking);
        String bodyHtml = layout("Booking Request Received",
                "<p>Hello " + esc(orName(toName, booking)) + ",</p>"
                        + "<p>Your equipment booking request has been received.</p>"
                        + bookingCard(booking)
                        + "<div class='callout'>" + esc(statusNote) + "</div>"
                        + "<p style='color:#6b7280;font-size:13px'>Booking ID: #" + booking.getId() + "<br>UniqEquip</p>");
        String bodyText = "Hello " + orName(toName, booking) + ",\n\n"
                + "Your equipment booking request has been received.\n\n"
                + bookingText(booking) + "\n" + statusNote + "\n\nBooking ID: #" + booking.getId() + "\nUniqEquip";
        send(toEmail, subject, bodyText, bodyHtml);
    }

    public void sendBookingApproved(BookingRequest booking, String toEmail, String toName) throws Exception {
        String subject = "UniqEquip | Booking #" + booking.getId() + " Approved";
        String bodyHtml = layout("Booking Approved",
                "<p>Hello " + esc(orName(toName, booking)) + ",</p>"
                        + "<p>Good news! Your equipment booking has been <strong>approved</strong>.</p>"
                        + bookingCard(booking)
                        + notesBlock("Admin Notes", booking.getAdminNotes())
                        + "<div class='callout ok'>Please collect the equipment as instructed and return it before "
                        + esc(formatTime(booking.getEndDate())) + " on " + esc(formatDate(booking.getEndDate())) + ".</div>"
                        + "<p style='color:#6b7280;font-size:13px'>Booking ID: #" + booking.getId() + "<br>UniqEquip</p>");
        String bodyText = "Hello " + orName(toName, booking) + ",\n\nYour equipment booking has been APPROVED.\n\n"
                + bookingText(booking) + "\nBooking ID: #" + booking.getId() + "\nUniqEquip";
        send(toEmail, subject, bodyText, bodyHtml);
    }

    public void sendBookingRejected(BookingRequest booking, String toEmail, String toName, String notes) throws Exception {
        String subject = "UniqEquip | Booking #" + booking.getId() + " Update";
        String bodyHtml = layout("Booking Update",
                "<p>Hello " + esc(orName(toName, booking)) + ",</p>"
                        + "<p>Your equipment booking request <strong>could not be approved</strong>.</p>"
                        + bookingCard(booking)
                        + notesBlock("Reviewer Notes", notes)
                        + "<p>Any scheduled reminders for this booking have been cancelled. "
                        + "You may submit a new request with adjusted dates or equipment.</p>"
                        + "<p style='color:#6b7280;font-size:13px'>Booking ID: #" + booking.getId() + "<br>UniqEquip</p>");
        String bodyText = "Hello " + orName(toName, booking) + ",\n\nYour equipment booking request could not be approved."
                + (notes != null && !notes.isBlank() ? "\nReviewer notes: " + notes : "") + "\n\n"
                + bookingText(booking) + "\nBooking ID: #" + booking.getId() + "\nUniqEquip";
        send(toEmail, subject, bodyText, bodyHtml);
    }

    /** Sent at startDate - 1 hour. Different from the return reminder. */
    public void sendStartReminder(BookingRequest booking, String toEmail, String toName) throws Exception {
        String subject = "UniqEquip | Your Equipment Booking Starts in 1 Hour";
        String bodyHtml = layout("Booking Starts in 1 Hour",
                "<p>Hello " + esc(orName(toName, booking)) + ",</p>"
                        + "<p>Your equipment booking for <strong>" + esc(booking.getEventTitle()) + "</strong> starts in about 1 hour.</p>"
                        + bookingCard(booking)
                        + "<div class='callout'>Please be present at <strong>" + esc(booking.getVenue())
                        + "</strong> by " + esc(formatTime(booking.getStartDate())) + ".</div>"
                        + "<p style='color:#6b7280;font-size:13px'>Booking ID: #" + booking.getId() + "<br>UniqEquip</p>");
        String bodyText = "Hello " + orName(toName, booking) + ",\n\nYour equipment booking for "
                + booking.getEventTitle() + " starts in about 1 hour.\n\n"
                + bookingText(booking) + "\nBooking ID: #" + booking.getId() + "\nUniqEquip";
        send(toEmail, subject, bodyText, bodyHtml);
    }

    /** Sent at endDate - 1 hour. Only valid while equipment is ISSUED. */
    public void sendReturnReminder(BookingRequest booking, String toEmail, String toName) throws Exception {
        String subject = "UniqEquip | 1 Hour Remaining for Booking #" + booking.getId();
        StringBuilder items = new StringBuilder();
        if (booking.getItems() != null) {
            for (BookingItem item : booking.getItems()) {
                items.append("<li>").append(esc(item.getEquipmentName())).append(" &times; ")
                        .append(item.getQuantityRequested()).append("</li>");
            }
        }
        String bodyHtml = layout("1 Hour Remaining",
                "<p>Hello " + esc(orName(toName, booking)) + ",</p>"
                        + "<p>Your equipment booking for <strong>" + esc(booking.getEventTitle()) + "</strong> has 1 hour remaining.</p>"
                        + "<div class='callout warn'><strong>Return deadline:<br>" + esc(formatTime(booking.getEndDate()))
                        + " on " + esc(formatDate(booking.getEndDate())) + "</strong></div>"
                        + "<p><strong>Equipment:</strong></p><ul>" + items + "</ul>"
                        + "<p>Please return all equipment to the designated equipment desk before "
                        + esc(formatTime(booking.getEndDate())) + ".</p>"
                        + "<p style='color:#6b7280;font-size:13px'>Booking ID: #" + booking.getId() + "<br>UniqEquip</p>");
        StringBuilder textItems = new StringBuilder();
        if (booking.getItems() != null) {
            for (BookingItem item : booking.getItems()) {
                textItems.append("- ").append(item.getEquipmentName()).append(" x ")
                        .append(item.getQuantityRequested()).append("\n");
            }
        }
        String bodyText = "Hello " + orName(toName, booking) + ",\n\nYour equipment booking for "
                + booking.getEventTitle() + " has 1 hour remaining.\n\nReturn deadline:\n"
                + formatTime(booking.getEndDate()) + " on " + formatDate(booking.getEndDate())
                + "\n\nEquipment:\n" + textItems
                + "\nPlease return all equipment to the designated equipment desk before "
                + formatTime(booking.getEndDate()) + ".\n\nBooking ID: #" + booking.getId() + "\n\nUniqEquip";
        send(toEmail, subject, bodyText, bodyHtml);
    }

    public void sendTestEmail(String toEmail, String subject) throws Exception {
        String finalSubject = (subject == null || subject.isBlank())
                ? "UniqEquip | Test Email" : subject;
        String bodyHtml = layout("Test Email",
                "<p>UniqEquip email configuration is working correctly.</p>"
                        + "<p style='color:#6b7280;font-size:13px'>Sent at " + esc(LocalDateTime.now().toString()) + "</p>");
        send(toEmail, finalSubject,
                "UniqEquip email configuration is working correctly.",
                bodyHtml);
    }

    // ------------------------------------------------------------------

    private void send(String to, String subject, String text, String html) throws Exception {
        if (!isMailConfigured()) {
            throw new IllegalStateException("Mail is not configured (MAIL_USERNAME / MAIL_PASSWORD missing).");
        }
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(text, html);
        if (fromAddress != null && !fromAddress.isBlank()) {
            if (fromName != null && !fromName.isBlank()) {
                helper.setFrom(fromAddress, fromName);
            } else {
                helper.setFrom(fromAddress);
            }
        }
        mailSender.send(message);
        log.info("Email sent to {} | {}", to, subject);
    }

    private String statusNoteFor(BookingRequest booking) {
        if (booking.getStatus() == null) {
            return "Your request is awaiting review.";
        }
        return switch (booking.getStatus()) {
            case PENDING_FACULTY -> "Your request is awaiting approval from your faculty supervisor (HOD). "
                    + "Equipment is not yet confirmed.";
            case PENDING_ADMIN -> "Your request has been endorsed by your faculty supervisor and is now awaiting admin approval. "
                    + "Equipment is not yet confirmed.";
            case APPROVED -> "Your request has been approved. Please follow dispatch instructions.";
            case ISSUED -> "Equipment has been issued for your event.";
            case RETURNED -> "Equipment has been returned. Thank you!";
            case REJECTED -> "This request was not approved. See reviewer notes.";
        };
    }

    private String bookingCard(BookingRequest booking) {
        StringBuilder items = new StringBuilder();
        if (booking.getItems() != null) {
            for (BookingItem item : booking.getItems()) {
                items.append("<tr><td>").append(esc(item.getEquipmentName()))
                        .append("</td><td style='text-align:right'>&times; ")
                        .append(item.getQuantityRequested()).append("</td></tr>");
            }
        }
        return "<table class='card' cellpadding='0' cellspacing='0'>"
                + row("Booking ID", "#" + booking.getId())
                + row("Event", booking.getEventTitle())
                + row("Date", formatDate(booking.getStartDate()))
                + row("Start Time", formatTime(booking.getStartDate()))
                + row("End Time", formatTime(booking.getEndDate()))
                + row("Venue", booking.getVenue())
                + row("Status", booking.getStatus() == null ? "-" : booking.getStatus().name().replace('_', ' '))
                + "<tr><td colspan='2' style='padding-top:8px'><strong>Requested equipment</strong></td></tr>"
                + "<tr><td colspan='2'><table cellpadding='0' cellspacing='0' width='100%'>" + items + "</table></td></tr>"
                + "</table>";
    }

    private String bookingText(BookingRequest booking) {
        StringBuilder sb = new StringBuilder();
        sb.append("Event: ").append(booking.getEventTitle()).append("\n");
        sb.append("Date: ").append(formatDate(booking.getStartDate())).append("\n");
        sb.append("Start: ").append(formatTime(booking.getStartDate())).append("\n");
        sb.append("End: ").append(formatTime(booking.getEndDate())).append("\n");
        sb.append("Venue: ").append(booking.getVenue()).append("\n");
        sb.append("Status: ").append(booking.getStatus()).append("\n");
        sb.append("Requested equipment:\n");
        if (booking.getItems() != null) {
            for (BookingItem item : booking.getItems()) {
                sb.append("- ").append(item.getEquipmentName()).append(" x ")
                        .append(item.getQuantityRequested()).append("\n");
            }
        }
        return sb.toString();
    }

    private String row(String label, Object value) {
        return "<tr><td style='color:#6b7280'>" + esc(label) + "</td><td style='text-align:right'><strong>"
                + esc(value == null ? "-" : value.toString()) + "</strong></td></tr>";
    }

    private String notesBlock(String title, String notes) {
        if (notes == null || notes.isBlank()) {
            return "";
        }
        return "<p><strong>" + esc(title) + ":</strong> " + esc(notes) + "</p>";
    }

    private String layout(String heading, String inner) {
        return "<!DOCTYPE html><html><body style='margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif'>"
                + "<div style='max-width:560px;margin:0 auto;padding:24px 12px'>"
                + "<div style='background:#111827;color:#f2ce63;padding:16px 20px;border-radius:8px 8px 0 0'>"
                + "<h2 style='margin:0;font-size:18px'>UniqEquip</h2>"
                + "<p style='margin:4px 0 0;font-size:12px;color:#d1d5db'>University Event Equipment Booking</p>"
                + "</div>"
                + "<div style='background:#ffffff;padding:20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px'>"
                + "<h3 style='margin-top:0;color:#111827'>" + esc(heading) + "</h3>"
                + "<div style='color:#1f2937;font-size:14px;line-height:1.6'>" + inner + "</div>"
                + "</div></div>"
                + "<style>.card{width:100%;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px;font-size:13px}"
                + ".card td{padding:3px 4px}.callout{background:#fef3c7;border-left:4px solid #e2b94a;padding:10px 12px;margin:12px 0;border-radius:4px}"
                + ".callout.ok{background:#d1fae5;border-left-color:#10b981}.callout.warn{background:#fef3c7;border-left-color:#f59e0b}</style>"
                + "</body></html>";
    }

    private String orName(String toName, BookingRequest booking) {
        if (toName != null && !toName.isBlank()) {
            return toName;
        }
        return booking.getRequesterName() != null ? booking.getRequesterName() : "there";
    }

    private String esc(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
