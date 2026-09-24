package com.univ.equipment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "recommendation_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecommendationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ruleName;

    private String eventType; // Hackathon, Seminar, Workshop, Technical Symposium, Conference, Cultural Event

    private Integer minAudience;

    private Integer maxAudience;

    private String venueType; // Indoor Auditorium, Computer Lab, Open Air Theatre, Conference Room, Outdoor Grounds

    @Column(length = 2000)
    private String recommendedItemsJson; // JSON array of equipment name/ids and suggested quantities

    @Column(length = 1000)
    private String explanation;
}
