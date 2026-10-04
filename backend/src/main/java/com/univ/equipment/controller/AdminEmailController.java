package com.univ.equipment.controller;

import com.univ.equipment.service.EmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * ADMIN-ONLY email utilities (SMTP test). Requires the X-User-Role: ADMIN
 * header so it can never be used as a public mail relay.
 */
@RestController
@RequestMapping("/api/v1/admin/email")
@CrossOrigin(origins = "*")
public class AdminEmailController {

    private final EmailService emailService;

    public AdminEmailController(EmailService emailService) {
        this.emailService = emailService;
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
        // Deliberately never exposes MAIL_PASSWORD or any env value.
        return ResponseEntity.ok(Map.of("configured", emailService.isMailConfigured()));
    }
}
