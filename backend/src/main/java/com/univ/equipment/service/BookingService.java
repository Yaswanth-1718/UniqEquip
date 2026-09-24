package com.univ.equipment.service;

import com.univ.equipment.model.*;
import com.univ.equipment.repository.BookingRequestRepository;
import com.univ.equipment.repository.EquipmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BookingService {

    private final BookingRequestRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;

    public BookingService(BookingRequestRepository bookingRepository, EquipmentRepository equipmentRepository) {
        this.bookingRepository = bookingRepository;
        this.equipmentRepository = equipmentRepository;
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
        return bookingRepository.save(request);
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
        return bookingRepository.save(request);
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
        return bookingRepository.save(request);
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
        return bookingRepository.save(request);
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
        return bookingRepository.save(request);
    }
}
