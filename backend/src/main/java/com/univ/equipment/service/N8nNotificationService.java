package com.univ.equipment.service;

import com.univ.equipment.model.BookingItem;
import com.univ.equipment.model.BookingRequest;
import com.univ.equipment.model.User;
import com.univ.equipment.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Forwards booking lifecycle events to the n8n webhook, which owns actual
 * email delivery and reminder scheduling in production. Never throws: a
 * webhook failure is logged and the booking transaction is unaffected.
 * The secret is sent as a header and is never logged.
 */
@Service
public class N8nNotificationService {

    private static final Logger log = LoggerFactory.getLogger(N8nNotificationService.class);
    private static final String SECRET_HEADER = "X-UNIEQUIP-SECRET";

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${n8n.enabled:false}")
    private boolean n8nEnabled;

    @Value("${n8n.webhook.url:}")
    private String webhookUrl;

    @Value("${n8n.webhook.secret:}")
    private String webhookSecret;

    @Value("${app.timezone:Asia/Kolkata}")
    private String timezoneId;

    public N8nNotificationService(UserRepository userRepository) {
        this.userRepository = userRepository;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isEnabled() {
        return n8nEnabled;
    }

    public boolean isWebhookConfigured() {
        return n8nEnabled && webhookUrl != null && !webhookUrl.isBlank()
                && webhookSecret != null && !webhookSecret.isBlank();
    }

    public void sendBookingCreated(BookingRequest booking) {
        sendEvent("BOOKING_CREATED", booking, null);
    }

    public void sendBookingApproved(BookingRequest booking) {
        sendEvent("BOOKING_APPROVED", booking, null);
    }

    public void sendBookingRejected(BookingRequest booking, String notes) {
        String reviewerNotes = (notes != null && !notes.isBlank()) ? notes : coalesceNotes(booking);
        sendEvent("BOOKING_REJECTED", booking, reviewerNotes);
    }

    public void sendEquipmentReturned(BookingRequest booking) {
        sendEvent("EQUIPMENT_RETURNED", booking, null);
    }

    public void sendTestEmail(String recipientEmail) {
        if (!n8nEnabled) {
            return;
        }
        if (!isWebhookConfigured()) {
            log.warn("n8n TEST_EMAIL skipped: N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET missing.");
            return;
        }
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("event", "TEST_EMAIL");
        payload.put("recipientEmail", recipientEmail);
        payload.put("requesterName", "UniqEquip Admin");
        post(payload);
    }

    // ------------------------------------------------------------------

    private void sendEvent(String event, BookingRequest booking, String reviewerNotes) {
        try {
            if (!n8nEnabled) {
                return;
            }
            if (!isWebhookConfigured()) {
                log.warn("n8n {} event for booking {} skipped: N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET missing.",
                        event, booking.getId());
                return;
            }
            Optional<User> user = booking.getRequesterId() == null
                    ? Optional.empty()
                    : userRepository.findById(booking.getRequesterId());
            String email = user.map(User::getEmail).orElse(null);
            String name = user.map(User::getName)
                    .orElse(booking.getRequesterName());
            if (email == null || email.isBlank()) {
                log.warn("n8n {} event for booking {} skipped: no email for requesterId {}.",
                        event, booking.getId(), booking.getRequesterId());
                return;
            }
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("event", event);
            payload.put("bookingId", booking.getId());
            payload.put("requesterId", booking.getRequesterId());
            payload.put("requesterName", name);
            payload.put("requesterEmail", email);
            payload.put("eventTitle", booking.getEventTitle());
            payload.put("venue", booking.getVenue());
            payload.put("status", booking.getStatus() == null ? null : booking.getStatus().name());
            payload.put("startDateIso", toIsoWithOffset(booking.getStartDate()));
            payload.put("endDateIso", toIsoWithOffset(booking.getEndDate()));
            payload.put("items", toItemMaps(booking.getItems()));
            if (reviewerNotes != null && !reviewerNotes.isBlank()) {
                payload.put("reviewerNotes", reviewerNotes);
            }
            post(payload);
        } catch (Exception e) {
            // Never break the booking flow because of n8n.
            log.error("n8n {} event for booking {} failed (booking unaffected): {}",
                    event, booking.getId(), e.getMessage());
        }
    }

    /** ISO-8601 with offset, e.g. 2026-10-08T15:00:00+05:30, in APP_TIMEZONE. */
    private String toIsoWithOffset(java.time.LocalDateTime dt) {
        try {
            if (dt == null) {
                return null;
            }
            return dt.atZone(ZoneId.of(timezoneId)).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        } catch (Exception e) {
            return null;
        }
    }

    private List<Map<String, Object>> toItemMaps(List<BookingItem> items) {
        if (items == null) {
            return List.of();
        }
        return items.stream().map(item -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("equipmentId", item.getEquipmentId());
            m.put("equipmentName", item.getEquipmentName());
            m.put("category", item.getCategory());
            m.put("quantityRequested", item.getQuantityRequested());
            return m;
        }).toList();
    }

    private void post(Map<String, Object> payload) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set(SECRET_HEADER, webhookSecret);
            org.springframework.http.HttpEntity<Map<String, Object>> entity =
                    new org.springframework.http.HttpEntity<>(payload, headers);
            restTemplate.postForEntity(webhookUrl, entity, String.class);
            log.info("n8n event {} accepted for booking {}.", payload.get("event"), payload.get("bookingId"));
        } catch (Exception e) {
            // Never break the booking flow because of n8n. Secret never logged.
            log.error("n8n {} event delivery failed (booking unaffected): {}",
                    payload.get("event"), e.getMessage());
        }
    }

    private String coalesceNotes(BookingRequest booking) {
        if (booking.getAdminNotes() != null && !booking.getAdminNotes().isBlank()) {
            return booking.getAdminNotes();
        }
        return booking.getFacultyNotes();
    }
}
