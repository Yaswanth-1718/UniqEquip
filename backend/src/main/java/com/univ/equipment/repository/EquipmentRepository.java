package com.univ.equipment.repository;

import com.univ.equipment.model.Equipment;
import com.univ.equipment.model.EquipmentCategory;
import com.univ.equipment.model.EquipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, Long> {
    List<Equipment> findByCategory(EquipmentCategory category);
    List<Equipment> findByStatus(EquipmentStatus status);

    @Query("SELECT e FROM Equipment e WHERE LOWER(e.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Equipment> searchEquipment(@Param("query") String query);
}
