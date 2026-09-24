package com.univ.equipment.service;

import com.univ.equipment.model.Equipment;
import com.univ.equipment.model.EquipmentCategory;
import com.univ.equipment.model.EquipmentStatus;
import com.univ.equipment.repository.EquipmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;

    public EquipmentService(EquipmentRepository equipmentRepository) {
        this.equipmentRepository = equipmentRepository;
    }

    public List<Equipment> getAllEquipment() {
        return equipmentRepository.findAll();
    }

    public Optional<Equipment> getEquipmentById(Long id) {
        return equipmentRepository.findById(id);
    }

    public List<Equipment> getEquipmentByCategory(EquipmentCategory category) {
        return equipmentRepository.findByCategory(category);
    }

    public List<Equipment> searchEquipment(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllEquipment();
        }
        return equipmentRepository.searchEquipment(query);
    }

    @Transactional
    public Equipment saveEquipment(Equipment equipment) {
        if (equipment.getAvailableQuantity() == null) {
            equipment.setAvailableQuantity(equipment.getTotalQuantity());
        }
        if (equipment.getStatus() == null) {
            equipment.setStatus(equipment.getAvailableQuantity() > 0 ? EquipmentStatus.AVAILABLE : EquipmentStatus.MAINTENANCE);
        }
        return equipmentRepository.save(equipment);
    }

    @Transactional
    public Equipment updateStatus(Long id, EquipmentStatus status) {
        Equipment equip = equipmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Equipment not found: " + id));
        equip.setStatus(status);
        return equipmentRepository.save(equip);
    }

    @Transactional
    public void deleteEquipment(Long id) {
        equipmentRepository.deleteById(id);
    }
}
