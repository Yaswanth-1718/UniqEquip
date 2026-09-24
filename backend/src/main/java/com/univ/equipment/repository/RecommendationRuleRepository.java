package com.univ.equipment.repository;

import com.univ.equipment.model.RecommendationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRuleRepository extends JpaRepository<RecommendationRule, Long> {
    List<RecommendationRule> findByEventType(String eventType);
}
