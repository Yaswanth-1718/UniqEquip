package com.univ.equipment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "booking_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String eventTitle;

    @Column(nullable = false)
    private String eventType; // Hackathon, Seminar, Workshop, Technical Symposium, Conference, Cultural Event

    @Column(nullable = false)
    private String venue; // Indoor Auditorium, Computer Lab, Open Air Theatre, Conference Room, Outdoor Grounds

    private Integer expectedAudience;

    @Column(nullable = false)
    private LocalDateTime startDate;

    @Column(nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false)
    private Long requesterId;

    private String requesterName;

    private String requesterRole;

    private Long facultySupervisorId;

    private String facultySupervisorName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status;

    @Column(length = 1000)
    private String purpose;

    @Column(length = 1000)
    private String facultyNotes;

    @Column(length = 1000)
    private String adminNotes;

    private LocalDateTime createdAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "booking_request_id")
    @Builder.Default
    private List<BookingItem> items = new ArrayList<>();
}
