package com.univ.equipment.controller;

import com.univ.equipment.model.BookingItem;
import com.univ.equipment.model.BookingRequest;
import com.univ.equipment.model.BookingStatus;
import com.univ.equipment.model.EmailNotification;
import com.univ.equipment.model.Equipment;
import com.univ.equipment.model.EquipmentCategory;
import com.univ.equipment.model.EquipmentStatus;
import com.univ.equipment.model.RecommendationRule;
import com.univ.equipment.model.Role;
import com.univ.equipment.model.User;
import com.univ.equipment.repository.BookingRequestRepository;
import com.univ.equipment.repository.EmailNotificationRepository;
import com.univ.equipment.repository.RecommendationRuleRepository;
import com.univ.equipment.repository.UserRepository;
import com.univ.equipment.service.EmailNotificationService;
import com.univ.equipment.service.EquipmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * ADMIN-ONLY visual database manager backend. Explicit per-table endpoints
 * only — there is intentionally NO arbitrary-SQL endpoint. The frontend
 * hides this section from non-admins, and every call additionally requires
 * the X-User-Role: ADMIN header (the strongest check available in this
 * app's current localStorage-role auth model).
 */
@RestController
@RequestMapping("/api/v1/admin/database")
@CrossOrigin(origins = "*")
public class AdminDatabaseController {

    private final UserRepository userRepository;
    private final EquipmentService equipmentService;
    private final BookingRequestRepository bookingRepository;
    private final RecommendationRuleRepository ruleRepository;
    private final EmailNotificationRepository notificationRepository;
    private final EmailNotificationService notificationService;

    public AdminDatabaseController(UserRepository userRepository,
                                   EquipmentService equipmentService,
                                   BookingRequestRepository bookingRepository,
                                   RecommendationRuleRepository ruleRepository,
                                   EmailNotificationRepository notificationRepository,
                                   EmailNotificationService notificationService) {
        this.userRepository = userRepository;
        this.equipmentService = equipmentService;
        this.bookingRepository = bookingRepository;
        this.ruleRepository = ruleRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
    }

    private void requireAdmin(String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required.");
        }
    }

    // ---------------- summary ----------------

    @GetMapping("/summary")
    public ResponseEntity<?> summary(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        List<Map<String, Object>> tables = new ArrayList<>();
        tables.add(card("users", "Users", "app_users", userRepository.count()));
        tables.add(card("equipment", "Equipment", "equipment", equipmentService.getAllEquipment().size()));
        tables.add(card("bookings", "Bookings", "booking_requests", bookingRepository.count()));
        tables.add(card("booking-items", "Booking Items", "booking_items", countBookingItems()));
        tables.add(card("recommendation-rules", "Recommendation Rules", "recommendation_rules", ruleRepository.count()));
        tables.add(card("email-notifications", "Email Notifications", "email_notifications", notificationRepository.count()));
        return ResponseEntity.ok(Map.of("tables", tables));
    }

    private Map<String, Object> card(String key, String label, String table, long rows) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("key", key);
        m.put("label", label);
        m.put("table", table);
        m.put("rows", rows);
        return m;
    }

    // ---------------- users (password never exposed) ----------------

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        return ResponseEntity.ok(userRepository.findAll().stream().map(this::sanitize).toList());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestHeader(value = "X-User-Role", required = false) String role,
                                        @RequestBody Map<String, Object> payload) {
        requireAdmin(role);
        String name = str(payload.get("name"));
        String email = str(payload.get("email"));
        String password = str(payload.get("password"));
        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email and password are required."));
        }
        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "Email already registered."));
        }
        User user = User.builder()
                .name(name).email(email).password(password)
                .role(parseRole(str(payload.getOrDefault("role", "STUDENT"))))
                .status(str(payload.getOrDefault("status", "PENDING")))
                .department(str(payload.get("department")))
                .clubName(str(payload.get("clubName")))
                .phone(str(payload.get("phone")))
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(sanitize(userRepository.save(user)));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@RequestHeader(value = "X-User-Role", required = false) String role,
                                        @PathVariable Long id,
                                        @RequestBody Map<String, Object> payload) {
        requireAdmin(role);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
        if (payload.containsKey("name")) user.setName(str(payload.get("name")));
        if (payload.containsKey("email")) user.setEmail(str(payload.get("email")));
        if (payload.containsKey("role")) user.setRole(parseRole(str(payload.get("role"))));
        if (payload.containsKey("status")) user.setStatus(str(payload.get("status")));
        if (payload.containsKey("department")) user.setDepartment(str(payload.get("department")));
        if (payload.containsKey("clubName")) user.setClubName(str(payload.get("clubName")));
        if (payload.containsKey("phone")) user.setPhone(str(payload.get("phone")));
        // Password is only changed when a new non-blank value is explicitly supplied.
        if (payload.containsKey("password") && !str(payload.get("password")).isBlank()) {
            user.setPassword(str(payload.get("password")));
        }
        return ResponseEntity.ok(sanitize(userRepository.save(user)));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@RequestHeader(value = "X-User-Role", required = false) String role,
                                        @PathVariable Long id) {
        requireAdmin(role);
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id);
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private User sanitize(User user) {
        if (user != null) {
            user.setPassword(null); // never leak password hashes/plaintext to the browser
        }
        return user;
    }

    private Role parseRole(String value) {
        try {
            return Role.valueOf(value);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + value);
        }
    }

    // ---------------- equipment (reuses EquipmentService) ----------------

    @GetMapping("/equipment")
    public ResponseEntity<?> listEquipment(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        return ResponseEntity.ok(equipmentService.getAllEquipment());
    }

    @PostMapping("/equipment")
    public ResponseEntity<?> createEquipment(@RequestHeader(value = "X-User-Role", required = false) String role,
                                             @RequestBody Equipment equipment) {
        requireAdmin(role);
        return ResponseEntity.status(HttpStatus.CREATED).body(equipmentService.saveEquipment(equipment));
    }

    @PutMapping("/equipment/{id}")
    public ResponseEntity<?> updateEquipment(@RequestHeader(value = "X-User-Role", required = false) String role,
                                             @PathVariable Long id,
                                             @RequestBody Equipment equipment) {
        requireAdmin(role);
        if (equipmentService.getEquipmentById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipment not found: " + id);
        }
        equipment.setId(id);
        return ResponseEntity.ok(equipmentService.saveEquipment(equipment));
    }

    @DeleteMapping("/equipment/{id}")
    public ResponseEntity<?> deleteEquipment(@RequestHeader(value = "X-User-Role", required = false) String role,
                                             @PathVariable Long id) {
        requireAdmin(role);
        equipmentService.deleteEquipment(id);
        return ResponseEntity.noContent().build();
    }

    // ---------------- bookings ----------------

    @GetMapping("/bookings")
    public ResponseEntity<?> listBookings(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        return ResponseEntity.ok(bookingRepository.findAll());
    }

    @GetMapping("/bookings/{id}")
    public ResponseEntity<?> getBooking(@RequestHeader(value = "X-User-Role", required = false) String role,
                                        @PathVariable Long id) {
        requireAdmin(role);
        return bookingRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/bookings/{id}")
    public ResponseEntity<?> updateBooking(@RequestHeader(value = "X-User-Role", required = false) String role,
                                           @PathVariable Long id,
                                           @RequestBody Map<String, Object> payload) {
        requireAdmin(role);
        BookingRequest booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found: " + id));
        if (payload.containsKey("eventTitle")) booking.setEventTitle(str(payload.get("eventTitle")));
        if (payload.containsKey("eventType")) booking.setEventType(str(payload.get("eventType")));
        if (payload.containsKey("venue")) booking.setVenue(str(payload.get("venue")));
        if (payload.containsKey("expectedAudience")) booking.setExpectedAudience(num(payload.get("expectedAudience")));
        if (payload.containsKey("status")) {
            try {
                booking.setStatus(BookingStatus.valueOf(str(payload.get("status"))));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value.");
            }
        }
        if (payload.containsKey("purpose")) booking.setPurpose(str(payload.get("purpose")));
        if (payload.containsKey("facultyNotes")) booking.setFacultyNotes(str(payload.get("facultyNotes")));
        if (payload.containsKey("adminNotes")) booking.setAdminNotes(str(payload.get("adminNotes")));
        return ResponseEntity.ok(bookingRepository.save(booking));
    }

    @DeleteMapping("/bookings/{id}")
    public ResponseEntity<?> deleteBooking(@RequestHeader(value = "X-User-Role", required = false) String role,
                                           @PathVariable Long id) {
        requireAdmin(role);
        BookingRequest booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found: " + id));
        // Booking items cascade via orphanRemoval; notifications are standalone rows: delete explicitly.
        notificationService.findByBookingId(id).forEach(n -> notificationRepository.deleteById(n.getId()));
        bookingRepository.delete(booking);
        return ResponseEntity.noContent().build();
    }

    // ---------------- booking items (owned by bookings; edited through them) ----------------

    @GetMapping("/booking-items")
    public ResponseEntity<?> listBookingItems(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (BookingRequest booking : bookingRepository.findAll()) {
            if (booking.getItems() == null) {
                continue;
            }
            for (BookingItem item : booking.getItems()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("id", item.getId());
                row.put("bookingId", booking.getId());
                row.put("eventTitle", booking.getEventTitle());
                row.put("equipmentId", item.getEquipmentId());
                row.put("equipmentName", item.getEquipmentName());
                row.put("category", item.getCategory());
                row.put("quantityRequested", item.getQuantityRequested());
                rows.add(row);
            }
        }
        return ResponseEntity.ok(rows);
    }

    @DeleteMapping("/booking-items/{itemId}")
    public ResponseEntity<?> deleteBookingItem(@RequestHeader(value = "X-User-Role", required = false) String role,
                                               @PathVariable Long itemId) {
        requireAdmin(role);
        for (BookingRequest booking : bookingRepository.findAll()) {
            if (booking.getItems() != null
                    && booking.getItems().removeIf(i -> itemId.equals(i.getId()))) {
                bookingRepository.save(booking);
                return ResponseEntity.noContent().build();
            }
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking item not found: " + itemId);
    }

    // ---------------- recommendation rules ----------------

    @GetMapping("/recommendation-rules")
    public ResponseEntity<?> listRules(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requireAdmin(role);
        return ResponseEntity.ok(ruleRepository.findAll());
    }

    @PostMapping("/recommendation-rules")
    public ResponseEntity<?> createRule(@RequestHeader(value = "X-User-Role", required = false) String role,
                                        @RequestBody RecommendationRule rule) {
        requireAdmin(role);
        rule.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(ruleRepository.save(rule));
    }

    @PutMapping("/recommendation-rules/{id}")
    public ResponseEntity<?> updateRule(@RequestHeader(value = "X-User-Role", required = false) String role,
                                        @PathVariable Long id,
                                        @RequestBody RecommendationRule rule) {
        requireAdmin(role);
        if (!ruleRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found: " + id);
        }
        rule.setId(id);
        return ResponseEntity.ok(ruleRepository.save(rule));
    }

    @DeleteMapping("/recommendation-rules/{id}")
    public ResponseEntity<?> deleteRule(@RequestHeader(value = "X-User-Role", required = false) String role,
                                        @PathVariable Long id) {
        requireAdmin(role);
        ruleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------------- email notifications ----------------

    @GetMapping("/email-notifications")
    public ResponseEntity<?> listNotifications(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) Long bookingId) {
        requireAdmin(role);
        if (bookingId != null) {
            return ResponseEntity.ok(notificationService.findByBookingId(bookingId));
        }
        return ResponseEntity.ok(notificationService.findAll());
    }

    @PostMapping("/email-notifications/{id}/retry")
    public ResponseEntity<?> retryNotification(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        requireAdmin(role);
        try {
            return ResponseEntity.ok(notificationService.retry(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/email-notifications/{id}/cancel")
    public ResponseEntity<?> cancelNotification(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        requireAdmin(role);
        EmailNotification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found: " + id));
        n.setStatus(com.univ.equipment.model.EmailNotificationStatus.CANCELLED);
        return ResponseEntity.ok(notificationRepository.save(n));
    }

    // ---------------- helpers ----------------

    private long countBookingItems() {
        long count = 0;
        for (BookingRequest booking : bookingRepository.findAll()) {
            if (booking.getItems() != null) {
                count += booking.getItems().size();
            }
        }
        return count;
    }

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private Integer num(Object value) {
        if (value == null || String.valueOf(value).isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @SuppressWarnings("unused")
    private EquipmentCategory parseCategory(String value) {
        try {
            return EquipmentCategory.valueOf(value);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid category: " + value);
        }
    }

    @SuppressWarnings("unused")
    private EquipmentStatus parseEquipmentStatus(String value) {
        try {
            return EquipmentStatus.valueOf(value);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid equipment status: " + value);
        }
    }
}
