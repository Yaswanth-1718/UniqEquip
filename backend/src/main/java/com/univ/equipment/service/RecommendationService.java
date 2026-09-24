package com.univ.equipment.service;

import com.univ.equipment.model.Equipment;
import com.univ.equipment.model.RecommendationRule;
import com.univ.equipment.repository.EquipmentRepository;
import com.univ.equipment.repository.RecommendationRuleRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RecommendationService {

    private final RecommendationRuleRepository ruleRepository;
    private final EquipmentRepository equipmentRepository;

    public RecommendationService(RecommendationRuleRepository ruleRepository, EquipmentRepository equipmentRepository) {
        this.ruleRepository = ruleRepository;
        this.equipmentRepository = equipmentRepository;
    }

    public Map<String, Object> evaluateRecommendation(String eventType, Integer audienceCount, String venueType) {
        List<RecommendationRule> rules = ruleRepository.findAll();
        List<Equipment> allEquipment = equipmentRepository.findAll();

        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> recommendedItems = new ArrayList<>();
        List<String> reasoningNotes = new ArrayList<>();

        int matchedRulesCount = 0;

        for (RecommendationRule rule : rules) {
            boolean eventMatch = rule.getEventType().equalsIgnoreCase(eventType) || rule.getEventType().equalsIgnoreCase("ALL");
            boolean venueMatch = rule.getVenueType().equalsIgnoreCase(venueType) || rule.getVenueType().equalsIgnoreCase("ALL");
            boolean audienceMatch = (rule.getMinAudience() == null || audienceCount >= rule.getMinAudience()) &&
                                    (rule.getMaxAudience() == null || audienceCount <= rule.getMaxAudience());

            if (eventMatch && venueMatch && audienceMatch) {
                matchedRulesCount++;
                reasoningNotes.add(rule.getExplanation());
            }
        }

        // Rule logic to calculate quantities based on venue, event type and audience size:
        for (Equipment equip : allEquipment) {
            int suggestedQty = 0;
            String reason = "";

            String categoryStr = equip.getCategory().name();
            String nameLower = equip.getName().toLowerCase();

            if (eventType.equalsIgnoreCase("Hackathon")) {
                if (nameLower.contains("switch") || nameLower.contains("router")) {
                    suggestedQty = Math.min((int) Math.ceil(audienceCount / 25.0), equip.getAvailableQuantity());
                    reason = "Critical for high-density student coding network traffic (" + audienceCount + " participants)";
                } else if (nameLower.contains("extension") || nameLower.contains("power")) {
                    suggestedQty = Math.min((int) Math.ceil(audienceCount / 5.0), equip.getAvailableQuantity());
                    reason = "Laptop charging hubs for multi-hour hackathon endurance";
                } else if (nameLower.contains("projector")) {
                    suggestedQty = venueType.contains("Lab") ? 2 : 1;
                    reason = "For problem statement brief and live mentor announcements";
                } else if (nameLower.contains("pa system") || nameLower.contains("speaker")) {
                    suggestedQty = 1;
                    reason = "For opening ceremony and countdown timers";
                }
            } else if (eventType.equalsIgnoreCase("Seminar") || eventType.equalsIgnoreCase("Workshop") || eventType.equalsIgnoreCase("Conference")) {
                if (nameLower.contains("mic") || nameLower.contains("microphone")) {
                    suggestedQty = 3;
                    reason = "1 Podium mic for keynote speaker, 2 wireless handhelds for audience Q&A";
                } else if (nameLower.contains("projector") || nameLower.contains("screen")) {
                    suggestedQty = 1;
                    reason = "High-definition slide presentation display";
                } else if (nameLower.contains("podium")) {
                    suggestedQty = 1;
                    reason = "Professional speaker address stage podium";
                } else if (nameLower.contains("laser pointer")) {
                    suggestedQty = 1;
                    reason = "Slide navigation & presentation clicker";
                }
            } else if (eventType.equalsIgnoreCase("Cultural Event") || eventType.equalsIgnoreCase("Technical Symposium")) {
                if (nameLower.contains("sound") || nameLower.contains("speaker") || nameLower.contains("pa")) {
                    suggestedQty = (audienceCount > 300) ? 4 : 2;
                    reason = "High-output audio amplification for large venue acoustics";
                } else if (nameLower.contains("light") || nameLower.contains("spotlight") || nameLower.contains("led")) {
                    suggestedQty = 4;
                    reason = "Stage illumination & performance ambiance";
                } else if (nameLower.contains("mic")) {
                    suggestedQty = 4;
                    reason = "Performer vocal wireless microphones & lapels";
                } else if (nameLower.contains("banner") || nameLower.contains("stand") || nameLower.contains("tent")) {
                    suggestedQty = 2;
                    reason = "Registration counter & event branding backdrop";
                }
            }

            if (suggestedQty > 0) {
                Map<String, Object> itemMap = new HashMap<>();
                itemMap.put("equipmentId", equip.getId());
                itemMap.put("equipmentName", equip.getName());
                itemMap.put("category", equip.getCategory().name());
                itemMap.put("suggestedQuantity", Math.min(suggestedQty, equip.getAvailableQuantity()));
                itemMap.put("availableQuantity", equip.getAvailableQuantity());
                itemMap.put("reason", reason);
                itemMap.put("imageUrl", equip.getImageUrl());
                recommendedItems.add(itemMap);
            }
        }

        if (reasoningNotes.isEmpty()) {
            reasoningNotes.add("Generated package based on standard equipment density rules for " + audienceCount + " attendees in " + venueType + ".");
        }

        result.put("eventType", eventType);
        result.put("audienceCount", audienceCount);
        result.put("venueType", venueType);
        result.put("matchedRulesCount", matchedRulesCount);
        result.put("reasoningNotes", reasoningNotes);
        result.put("recommendedItems", recommendedItems);

        return result;
    }
}
