package com.univ.equipment.service;

import com.univ.equipment.model.*;
import com.univ.equipment.repository.BookingRequestRepository;
import com.univ.equipment.repository.EquipmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRequestRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final EmailNotificationService emailNotificationService;
    private final N8nNotificationService n8nNotificationService;

    public BookingService(BookingRequestRepository bookingRepository,
                          EquipmentRepository equipmentRepository,
                          EmailNotificationService emailNotificationService,
                          N8nNotificationService n8nNotificationService) {
        this.bookingRepository = bookingRepository;
        this.equipmentRepository = equipmentRepository;
        this.emailNotificationService = emailNotificationService;
        this.n8nNotificationService = n8nNotificationService;
    }

    public List<BookingRequest> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Optional<BookingRequest> getBookingById(Long id) {
        return bookingRepository.findById(id);
    }

    public List<BookingRequest> getBookingsByRequester(Long requesterId) {
        return bookingRepository.findByRequesterId(requesterId);
    }

    public List<BookingRequest> getBookingsByFaculty(Long facultyId) {
        return bookingRepository.findByFacultySupervisorId(facultyId);
    }

    public List<BookingRequest> getBookingsByStatus(BookingStatus status) {
        return bookingRepository.findByStatus(status);
    }

    @Transactional
    public BookingRequest createBooking(BookingRequest request) {
        request.setCreatedAt(LocalDateTime.now());
        if (request.getStatus() == null) {
            request.setStatus(BookingStatus.PENDING_FACULTY);
        }
        BookingRequest saved = bookingRepository.save(request);
        // Email must never break booking creation: the notification service
        // runs in its own transaction and swallows its own failures.
        try {
            emailNotificationService.onBookingCreated(saved);
        } catch (Exception e) {
            log.error("Post-booking notification hook failed for booking {}: {}",
                    saved.getId(), e.getMessage());
        }
        // n8n owns delivery when enabled; it never throws into this transaction.
        try {
            n8nNotificationService.sendBookingCreated(saved);
        } catch (Exception e) {
            log.error("n8n BOOKING_CREATED hook failed for booking {}: {}",
                    saved.getId(), e.getMessage());
        }
        return saved;
    }

    @Transactional
    public BookingRequest facultyEndorse(Long bookingId, boolean endorse, String notes) {
        BookingRequest request = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking request not found: " + bookingId));

        request.setFacultyNotes(notes);
        if (endorse) {
            request.setStatus(BookingStatus.PENDING_ADMIN);
        } else {
            request.setStatus(BookingStatus.REJECTED);
        }
        BookingRequest saved = bookingRepository.save(request);
        if (!endorse) {
            try {
                emailNotificationService.onBookingRejected(saved, notes);
            } catch (Exception e) {
                log.error("Rejection notification hook failed for booking {}: {}",
                        saved.getId(), e.getMessage());
            }
            try {
                n8nNotificationService.sendBookingRejected(saved, notes);
            } catch (Exception e) {
                log.error("n8n BOOKING_REJECTED hook failed for booking {}: {}",
                        saved.getId(), e.getMessage());
            }
        }
        return saved;
    }

    @Transactional
    public BookingRequest adminApprove(Long bookingId, boolean approve, String notes) {
        BookingRequest request = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking request not found: " + bookingId));

        request.setAdminNotes(notes);
        if (approve) {
            request.setStatus(BookingStatus.APPROVED);
        } else {
            request.setStatus(BookingStatus.REJECTED);
        }
        BookingRequest saved = bookingRepository.save(request);
        try {
            if (approve) {
                emailNotificationService.onBookingApproved(saved);
            } else {
                emailNotificationService.onBookingRejected(saved, notes);
            }
        } catch (Exception e) {
            log.error("Approval notification hook failed for booking {}: {}",
                    saved.getId(), e.getMessage());
        }
        try {
            if (approve) {
                n8nNotificationService.sendBookingApproved(saved);
            } else {
                n8nNotificationService.sendBookingRejected(saved, notes);
            }
        } catch (Exception e) {
            log.error("n8n approval hook failed for booking {}: {}",
                    saved.getId(), e.getMessage());
        }
        return saved;
    }

    @Transactional
    public BookingRequest issueEquipment(Long bookingId) {
        BookingRequest request = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking request not found: " + bookingId));

        if (request.getStatus() != BookingStatus.APPROVED) {
            throw new RuntimeException("Cannot issue equipment for non-approved booking");
        }

        // Decrement equipment inventory
        for (BookingItem item : request.getItems()) {
            Equipment equipment = equipmentRepository.findById(item.getEquipmentId()).orElse(null);
            if (equipment != null) {
                int newAvailable = Math.max(0, equipment.getAvailableQuantity() - item.getQuantityRequested());
                equipment.setAvailableQuantity(newAvailable);
                if (newAvailable == 0) {
                    equipment.setStatus(EquipmentStatus.IN_USE);
                }
                equipmentRepository.save(equipment);
            }
        }

        request.setStatus(BookingStatus.ISSUED);
        BookingRequest saved = bookingRepository.save(request);
        try {
            emailNotificationService.onEquipmentIssued(saved);
        } catch (Exception e) {
            log.error("Issue notification hook failed for booking {}: {}",
                    saved.getId(), e.getMessage());
        }
        return saved;
    }

    @Transactional
    public BookingRequest returnEquipment(Long bookingId) {
        BookingRequest request = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking request not found: " + bookingId));

        if (request.getStatus() != BookingStatus.ISSUED) {
            throw new RuntimeException("Cannot mark returned for non-issued booking");
        }

        // Restore equipment inventory
        for (BookingItem item : request.getItems()) {
            Equipment equipment = equipmentRepository.findById(item.getEquipmentId()).orElse(null);
            if (equipment != null) {
                int restoredAvailable = Math.min(equipment.getTotalQuantity(), equipment.getAvailableQuantity() + item.getQuantityRequested());
                equipment.setAvailableQuantity(restoredAvailable);
                if (restoredAvailable > 0) {
                    equipment.setStatus(EquipmentStatus.AVAILABLE);
                }
                equipmentRepository.save(equipment);
            }
        }

        request.setStatus(BookingStatus.RETURNED);
        BookingRequest saved = bookingRepository.save(request);
        try {
            emailNotificationService.onEquipmentReturned(saved.getId());
        } catch (Exception e) {
            log.error("Return notification hook failed for booking {}: {}",
                    saved.getId(), e.getMessage());
        }
        try {
            n8nNotificationService.sendEquipmentReturned(saved);
        } catch (Exception e) {
            log.error("n8n EQUIPMENT_RETURNED hook failed for booking {}: {}",
                    saved.getId(), e.getMessage());
        }
        return saved;
    }
}
