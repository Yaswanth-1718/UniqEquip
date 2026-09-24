package com.univ.equipment.controller;

import com.univ.equipment.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @PostMapping("/evaluate")
    public ResponseEntity<Map<String, Object>> evaluateRecommendation(@RequestBody Map<String, Object> req) {
        String eventType = (String) req.getOrDefault("eventType", "Seminar");
        Integer audienceCount = req.get("audienceCount") != null ? Integer.parseInt(req.get("audienceCount").toString()) : 100;
        String venueType = (String) req.getOrDefault("venueType", "Indoor Auditorium");

        Map<String, Object> recommendation = recommendationService.evaluateRecommendation(eventType, audienceCount, venueType);
        return ResponseEntity.ok(recommendation);
    }
}
