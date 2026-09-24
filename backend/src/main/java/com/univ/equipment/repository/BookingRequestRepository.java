package com.univ.equipment.repository;

import com.univ.equipment.model.BookingRequest;
import com.univ.equipment.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRequestRepository extends JpaRepository<BookingRequest, Long> {
    List<BookingRequest> findByRequesterId(Long requesterId);
    List<BookingRequest> findByFacultySupervisorId(Long facultySupervisorId);
    List<BookingRequest> findByStatus(BookingStatus status);
}
