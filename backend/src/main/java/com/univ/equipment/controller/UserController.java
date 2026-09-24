package com.univ.equipment.controller;

import com.univ.equipment.model.Role;
import com.univ.equipment.model.User;
import com.univ.equipment.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private User sanitizeUser(User user) {
        if (user == null) {
            return null;
        }
        user.setPassword(null);
        return user;
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(@RequestParam(required = false) Role role) {
        if (role != null) {
            return ResponseEntity.ok(userRepository.findByRole(role).stream().map(this::sanitizeUser).toList());
        }
        return ResponseEntity.ok(userRepository.findAll().stream().map(this::sanitizeUser).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(this::sanitizeUser)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<User>> getPendingUsers() {
        List<User> pendingUsers = userRepository.findAll().stream()
                .filter(user -> "PENDING".equalsIgnoreCase(user.getStatus()))
                .map(this::sanitizeUser)
                .toList();
        return ResponseEntity.ok(pendingUsers);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, Object> payload) {
        String name = String.valueOf(payload.getOrDefault("name", "")).trim();
        String email = String.valueOf(payload.getOrDefault("email", "")).trim();
        String password = String.valueOf(payload.getOrDefault("password", ""));
        String department = String.valueOf(payload.getOrDefault("department", "")).trim();
        String roleValue = String.valueOf(payload.getOrDefault("role", "STUDENT"));

        if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Name, email, and password are required."));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered."));
        }

        Role role;
        try {
            role = Role.valueOf(roleValue);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role value."));
        }

        User newUser = User.builder()
                .name(name)
                .email(email)
                .password(password)
                .role(role)
                .status(role == Role.ADMIN ? "APPROVED" : "PENDING")
                .department(department)
                .phone(String.valueOf(payload.getOrDefault("phone", "")))
                .clubName(String.valueOf(payload.getOrDefault("clubName", "")))
                .build();

        User savedUser = userRepository.save(newUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(sanitizeUser(savedUser));
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, Object> payload) {
        String email = String.valueOf(payload.getOrDefault("email", "")).trim();
        String password = String.valueOf(payload.getOrDefault("password", ""));
        String roleValue = String.valueOf(payload.getOrDefault("role", "STUDENT"));

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password."));
        }

        User user = userOpt.get();
        if (!password.equals(user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password."));
        }

        try {
            Role role = Role.valueOf(roleValue);
            if (user.getRole() != role) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Role mismatch."));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role value."));
        }

        if (!"APPROVED".equalsIgnoreCase(user.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Your account is pending Admin approval."));
        }

        return ResponseEntity.ok(sanitizeUser(user));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        boolean approve = Boolean.TRUE.equals(payload.get("approve"));
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));

        user.setStatus(approve ? "APPROVED" : "REJECTED");
        return ResponseEntity.ok(sanitizeUser(userRepository.save(user)));
    }
}
