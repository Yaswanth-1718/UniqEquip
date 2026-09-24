package com.univ.equipment.controller;

import com.univ.equipment.model.BookingRequest;
import com.univ.equipment.model.BookingStatus;
import com.univ.equipment.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    public ResponseEntity<List<BookingRequest>> getAllBookings(
            @RequestParam(required = false) Long requesterId,
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) BookingStatus status) {
        if (requesterId != null) {
            return ResponseEntity.ok(bookingService.getBookingsByRequester(requesterId));
        }
        if (facultyId != null) {
            return ResponseEntity.ok(bookingService.getBookingsByFaculty(facultyId));
        }
        if (status != null) {
            return ResponseEntity.ok(bookingService.getBookingsByStatus(status));
        }
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingRequest> getBookingById(@PathVariable Long id) {
        return bookingService.getBookingById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<BookingRequest> createBooking(@RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @PostMapping("/{id}/faculty-endorse")
    public ResponseEntity<BookingRequest> facultyEndorse(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        boolean endorse = Boolean.TRUE.equals(payload.get("endorse"));
        String notes = (String) payload.getOrDefault("notes", "");
        return ResponseEntity.ok(bookingService.facultyEndorse(id, endorse, notes));
    }

    @PostMapping("/{id}/admin-approve")
    public ResponseEntity<BookingRequest> adminApprove(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        boolean approve = Boolean.TRUE.equals(payload.get("approve"));
        String notes = (String) payload.getOrDefault("notes", "");
        return ResponseEntity.ok(bookingService.adminApprove(id, approve, notes));
    }

    @PostMapping("/{id}/issue")
    public ResponseEntity<BookingRequest> issueEquipment(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.issueEquipment(id));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<BookingRequest> returnEquipment(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.returnEquipment(id));
    }
}
