package com.univ.equipment.service;

import com.univ.equipment.model.*;
import com.univ.equipment.repository.BookingRequestRepository;
import com.univ.equipment.repository.EquipmentRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AnalyticsService {

    private final EquipmentRepository equipmentRepository;
    private final BookingRequestRepository bookingRepository;

    public AnalyticsService(EquipmentRepository equipmentRepository, BookingRequestRepository bookingRepository) {
        this.equipmentRepository = equipmentRepository;
        this.bookingRepository = bookingRepository;
    }

    public Map<String, Object> getDashboardMetrics() {
        List<Equipment> allEquipment = equipmentRepository.findAll();
        List<BookingRequest> allBookings = bookingRepository.findAll();

        long totalEquipmentUnits = allEquipment.stream().mapToInt(Equipment::getTotalQuantity).sum();
        long availableUnits = allEquipment.stream().mapToInt(Equipment::getAvailableQuantity).sum();
        long inUseUnits = totalEquipmentUnits - availableUnits;

        long pendingFacultyCount = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.PENDING_FACULTY).count();
        long pendingAdminCount = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.PENDING_ADMIN).count();
        long approvedCount = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.APPROVED).count();
        long issuedCount = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.ISSUED).count();
        long returnedCount = allBookings.stream().filter(b -> b.getStatus() == BookingStatus.RETURNED).count();

        Map<String, Long> categoryShare = new HashMap<>();
        for (Equipment e : allEquipment) {
            String catName = e.getCategory().name();
            categoryShare.put(catName, categoryShare.getOrDefault(catName, 0L) + e.getTotalQuantity());
        }

        Map<String, Long> eventTypeShare = new HashMap<>();
        for (BookingRequest b : allBookings) {
            eventTypeShare.put(b.getEventType(), eventTypeShare.getOrDefault(b.getEventType(), 0L) + 1);
        }

        double utilizationRate = totalEquipmentUnits > 0 ? (double) inUseUnits / totalEquipmentUnits * 100.0 : 0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalEquipmentItems", allEquipment.size());
        metrics.put("totalEquipmentUnits", totalEquipmentUnits);
        metrics.put("availableUnits", availableUnits);
        metrics.put("inUseUnits", inUseUnits);
        metrics.put("totalBookingsCount", allBookings.size());
        metrics.put("pendingFacultyCount", pendingFacultyCount);
        metrics.put("pendingAdminCount", pendingAdminCount);
        metrics.put("approvedCount", approvedCount);
        metrics.put("issuedCount", issuedCount);
        metrics.put("returnedCount", returnedCount);
        metrics.put("utilizationRate", Math.round(utilizationRate * 10.0) / 10.0);
        metrics.put("categoryShare", categoryShare);
        metrics.put("eventTypeShare", eventTypeShare);

        return metrics;
    }
}
