package com.univ.equipment.controller;

import com.univ.equipment.service.EmailService;
import com.univ.equipment.service.N8nNotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * ADMIN-ONLY email utilities (SMTP/n8n test). Requires the X-User-Role: ADMIN
 * header so it can never be used as a public mail relay.
 */
@RestController
@RequestMapping("/api/v1/admin/email")
@CrossOrigin(origins = "*")
public class AdminEmailController {

    private final EmailService emailService;
    private final N8nNotificationService n8nNotificationService;

    @Value("${n8n.enabled:false}")
    private boolean n8nEnabled;

    public AdminEmailController(EmailService emailService,
                                N8nNotificationService n8nNotificationService) {
        this.emailService = emailService;
        this.n8nNotificationService = n8nNotificationService;
    }

    @PostMapping("/test")
    public ResponseEntity<?> sendTestEmail(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody Map<String, Object> payload) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required.");
        }
        Object recipient = payload.get("recipient");
        if (recipient == null || String.valueOf(recipient).isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Recipient email is required."));
        }
        if (n8nEnabled) {
            // n8n owns delivery; the TEST_EMAIL branch lives in the n8n workflow.
            // URL/secret stay server-side; the browser never sees them.
            try {
                n8nNotificationService.sendTestEmail(String.valueOf(recipient).trim());
                if (!n8nNotificationService.isWebhookConfigured()) {
                    return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                            .body(Map.of("message", "n8n webhook is not configured (N8N_WEBHOOK_URL / N8N_WEBHOOK_SECRET missing)."));
                }
                return ResponseEntity.ok(Map.of("message", "Test email event sent to n8n for " + recipient));
            } catch (Exception e) {
                String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body(Map.of("message", "Failed to send test email via n8n: " + msg));
            }
        }
        Object subject = payload.get("subject");
        try {
            emailService.sendTestEmail(String.valueOf(recipient).trim(),
                    subject == null ? null : String.valueOf(subject));
            return ResponseEntity.ok(Map.of("message", "Test email sent to " + recipient));
        } catch (Exception e) {
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Failed to send test email: " + msg));
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> mailStatus(
            @RequestHeader(value = "X-User-Role", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required.");
        }
        // Deliberately never exposes secrets or any env value.
        if (n8nEnabled) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("provider", "n8n");
            body.put("webhookConfigured", n8nNotificationService.isWebhookConfigured());
            body.put("configured", n8nNotificationService.isWebhookConfigured());
            if (!n8nNotificationService.isWebhookConfigured()) {
                body.put("message", "N8N_WEBHOOK_URL or N8N_WEBHOOK_SECRET missing");
            }
            return ResponseEntity.ok(body);
        }
        return ResponseEntity.ok(Map.of("configured", emailService.isMailConfigured()));
    }
}
