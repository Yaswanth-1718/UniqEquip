package com.univ.equipment.config;

import com.univ.equipment.model.*;
import com.univ.equipment.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EquipmentRepository equipmentRepository;
    private final RecommendationRuleRepository ruleRepository;
    private final BookingRequestRepository bookingRepository;

    public DataSeeder(UserRepository userRepository, EquipmentRepository equipmentRepository,
                      RecommendationRuleRepository ruleRepository, BookingRequestRepository bookingRepository) {
        this.userRepository = userRepository;
        this.equipmentRepository = equipmentRepository;
        this.ruleRepository = ruleRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            seedUsers();
        }
        if (equipmentRepository.count() == 0) {
            seedEquipment();
        }
        if (ruleRepository.count() == 0) {
            seedRules();
        }
        if (bookingRepository.count() == 0) {
            seedBookings();
        }
    }

    private void seedUsers() {
        User student = User.builder()
                .name("Alex Rivera")
                .email("alex.rivera@univ.edu")
                .password("student123")
                .role(Role.STUDENT)
                .status("APPROVED")
                .department("Computer Science & Engineering")
                .clubName("ACM Student Chapter")
                .phone("+1 (555) 234-5678")
                .build();

        User clubLead = User.builder()
                .name("Sophia Chen")
                .email("sophia.chen@univ.edu")
                .password("clublead123")
                .role(Role.CLUB_LEAD)
                .status("APPROVED")
                .department("Information Technology")
                .clubName("Robotics & AI Club")
                .phone("+1 (555) 876-5432")
                .build();

        User faculty = User.builder()
                .name("Dr. Marcus Vance")
                .email("marcus.vance@univ.edu")
                .password("faculty123")
                .role(Role.FACULTY)
                .status("APPROVED")
                .department("Computer Science & Engineering")
                .phone("+1 (555) 345-6789")
                .build();

        User admin = User.builder()
                .name("Elena Rostova")
                .email("elena.admin@univ.edu")
                .password("admin123")
                .role(Role.ADMIN)
                .status("APPROVED")
                .department("University Event Logistics Office")
                .phone("+1 (555) 999-0000")
                .build();

        userRepository.saveAll(Arrays.asList(student, clubLead, faculty, admin));
    }

    private void seedEquipment() {
        List<Equipment> items = Arrays.asList(
                // Audio / Visual
                Equipment.builder()
                        .name("Epson Pro 4K Laser Projector")
                        .modelCode("EP-4K-9000")
                        .category(EquipmentCategory.AUDIO_VISUAL)
                        .totalQuantity(8)
                        .availableQuantity(6)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Media Center Room 102")
                        .description("High-brightness 6000 lumens 4K UHD laser projector for main auditorium & halls.")
                        .specsJson("{\"Lumens\": 6000, \"Resolution\": \"4K UHD\", \"Inputs\": \"HDMI 2.1, DisplayPort, VGA\"}")
                        .imageUrl("https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&q=80")
                        .build(),
                Equipment.builder()
                        .name("JBL Portable PA System with Wireless Mics")
                        .modelCode("JBL-PASYS-800")
                        .category(EquipmentCategory.AUDIO_VISUAL)
                        .totalQuantity(12)
                        .availableQuantity(10)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Audio Locker 3B")
                        .description("Dual 15-inch active speakers, 1200W output, 4 wireless handheld microphones, Bluetooth connection.")
                        .specsJson("{\"Power\": \"1200 Watts\", \"Microphones\": \"4 Wireless VHF\", \"Coverage\": \"Up to 400 audience\"}")
                        .imageUrl("https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80")
                        .build(),
                Equipment.builder()
                        .name("Sennheiser Lavalier Wireless Mic Kit")
                        .modelCode("SEN-LAV-G4")
                        .category(EquipmentCategory.AUDIO_VISUAL)
                        .totalQuantity(15)
                        .availableQuantity(12)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Audio Locker 3A")
                        .description("Clip-on wireless lavalier mic pack ideal for keynote speakers, workshop hosts, and lectures.")
                        .specsJson("{\"Frequency\": \"516-558 MHz\", \"Battery Life\": \"8 Hours\", \"Transmitter\": \"Bodypack\"}")
                        .imageUrl("https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&q=80")
                        .build(),

                // Computing & Networking
                Equipment.builder()
                        .name("Cisco 48-Port Gigabit Switch Hub")
                        .modelCode("CSCO-SG350-48")
                        .category(EquipmentCategory.COMPUTING_NETWORKING)
                        .totalQuantity(10)
                        .availableQuantity(8)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Network Lab B")
                        .description("Managed 48-Port high speed switch with PoE support for multi-participant hackathons.")
                        .specsJson("{\"Ports\": 48, \"Speed\": \"1000 Mbps\", \"PoE Power\": \"370W\"}")
                        .imageUrl("https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&q=80")
                        .build(),
                Equipment.builder()
                        .name("Heavy Duty Extension Power Hub (20-Socket)")
                        .modelCode("PWR-DIST-20")
                        .category(EquipmentCategory.COMPUTING_NETWORKING)
                        .totalQuantity(25)
                        .availableQuantity(20)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Tech Store Room A")
                        .description("Surge-protected 20-socket power strip box with individual breakers for laptop clusters.")
                        .specsJson("{\"Sockets\": 20, \"Rating\": \"16 Amps\", \"Cable Length\": \"15 Meters\"}")
                        .imageUrl("https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&q=80")
                        .build(),
                Equipment.builder()
                        .name("Meta Quest 3 VR Headset Bundle")
                        .modelCode("MQ3-BUNDLE-5")
                        .category(EquipmentCategory.COMPUTING_NETWORKING)
                        .totalQuantity(6)
                        .availableQuantity(5)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("VR Innovation Lab")
                        .description("Virtual Reality immersive headset with controllers and link cables for tech symposiums.")
                        .specsJson("{\"Storage\": \"512GB\", \"Tracking\": \"6DoF\", \"Display\": \"4K+ Infinite Display\"}")
                        .imageUrl("https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=500&q=80")
                        .build(),

                // Lighting & Stage
                Equipment.builder()
                        .name("Chauvet DJ Stage LED PAR Light Rig")
                        .modelCode("CH-PAR-RGBW")
                        .category(EquipmentCategory.LIGHTING_STAGE)
                        .totalQuantity(16)
                        .availableQuantity(14)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Stage Depot 1")
                        .description("DMX controllable RGBW LED stage washes for cultural nights and awards ceremonies.")
                        .specsJson("{\"Channels\": \"DMX 8-CH\", \"Color\": \"Full RGBW Spectrum\", \"Mount\": \"Truss Clamp Included\"}")
                        .imageUrl("https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80")
                        .build(),
                Equipment.builder()
                        .name("Modular Aluminum Stage Riser (4x4 ft)")
                        .modelCode("STG-MOD-4X4")
                        .category(EquipmentCategory.LIGHTING_STAGE)
                        .totalQuantity(20)
                        .availableQuantity(16)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Stage Depot 2")
                        .description("Interlocking non-slip stage platform panels with adjustable legs (1ft to 3ft height).")
                        .specsJson("{\"Dimensions\": \"4ft x 4ft\", \"Load Capacity\": \"750 kg/sqm\", \"Surface\": \"Carpeted Black\"}")
                        .imageUrl("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80")
                        .build(),

                // Seating & Furniture
                Equipment.builder()
                        .name("Wooden Speaker Podium / Lectern")
                        .modelCode("POD-WOOD-PREM")
                        .category(EquipmentCategory.SEATING_FURNITURE)
                        .totalQuantity(5)
                        .availableQuantity(4)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Furniture Annex")
                        .description("Executive mahogany wooden podium with built-in mic holder and reading light.")
                        .specsJson("{\"Material\": \"Mahogany Wood\", \"Features\": \"Built-in cable management & reading lamp\"}")
                        .imageUrl("https://images.unsplash.com/photo-1577412647305-991150c7d163?w=500&q=80")
                        .build(),
                Equipment.builder()
                        .name("Folding Event Banquet Chairs (Set of 50)")
                        .modelCode("CHR-FLD-50")
                        .category(EquipmentCategory.SEATING_FURNITURE)
                        .totalQuantity(10)
                        .availableQuantity(8)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Furniture Warehouse B")
                        .description("Padded comfortable folding chairs stackable in transport carts.")
                        .specsJson("{\"Quantity per Set\": 50, \"Color\": \"Navy Blue Padded\", \"Weight Rating\": \"150 kg\"}")
                        .imageUrl("https://images.unsplash.com/photo-1503602642458-232111445657?w=500&q=80")
                        .build(),

                // Outdoor & Power
                Equipment.builder()
                        .name("Honda 10kVA Silent Diesel Generator")
                        .modelCode("GEN-HON-10KV")
                        .category(EquipmentCategory.OUTDOOR_POWER)
                        .totalQuantity(3)
                        .availableQuantity(2)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Facilities Yard")
                        .description("Silent emergency power supply generator for outdoor grounds and night festivals.")
                        .specsJson("{\"Power Output\": \"10.0 kVA\", \"Fuel\": \"Diesel\", \"Noise Level\": \"65 dB @ 7m\"}")
                        .imageUrl("https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80")
                        .build(),
                Equipment.builder()
                        .name("Outdoor Canopy Tent (20x20 ft)")
                        .modelCode("TNT-CAN-2020")
                        .category(EquipmentCategory.OUTDOOR_POWER)
                        .totalQuantity(8)
                        .availableQuantity(6)
                        .status(EquipmentStatus.AVAILABLE)
                        .location("Facilities Yard")
                        .description("Weatherproof pop-up canopy tent for outdoor registration counters and food stalls.")
                        .specsJson("{\"Size\": \"20ft x 20ft\", \"Frame\": \"Aluminum Heavy-duty\", \"Cover\": \"UV/Waterproof PVC\"}")
                        .imageUrl("https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&q=80")
                        .build()
        );

        equipmentRepository.saveAll(items);
    }

    private void seedRules() {
        RecommendationRule rule1 = RecommendationRule.builder()
                .ruleName("24-Hour Hackathon Starter Kit")
                .eventType("Hackathon")
                .minAudience(50)
                .maxAudience(500)
                .venueType("ALL")
                .explanation("High-density networking switches, high-amperage extension hubs, and PA system for countdown timers.")
                .build();

        RecommendationRule rule2 = RecommendationRule.builder()
                .ruleName("Academic Seminar & Keynote Pack")
                .eventType("Seminar")
                .minAudience(20)
                .maxAudience(250)
                .venueType("Indoor Auditorium")
                .explanation("Crystal clear laser projector, podium, keynote presentation clicker, and wireless lavalier microphone.")
                .build();

        RecommendationRule rule3 = RecommendationRule.builder()
                .ruleName("Cultural Night Stage Extravaganza")
                .eventType("Cultural Event")
                .minAudience(200)
                .maxAudience(1000)
                .venueType("Open Air Theatre")
                .explanation("High output PA speakers, RGBW LED stage lighting rig, modular stage risers, and high-capacity generator.")
                .build();

        ruleRepository.saveAll(Arrays.asList(rule1, rule2, rule3));
    }

    private void seedBookings() {
        BookingItem item1 = BookingItem.builder()
                .equipmentId(1L)
                .equipmentName("Epson Pro 4K Laser Projector")
                .category("AUDIO_VISUAL")
                .quantityRequested(1)
                .build();

        BookingItem item2 = BookingItem.builder()
                .equipmentId(4L)
                .equipmentName("Cisco 48-Port Gigabit Switch Hub")
                .category("COMPUTING_NETWORKING")
                .quantityRequested(2)
                .build();

        BookingItem item3 = BookingItem.builder()
                .equipmentId(5L)
                .equipmentName("Heavy Duty Extension Power Hub (20-Socket)")
                .category("COMPUTING_NETWORKING")
                .quantityRequested(5)
                .build();

        BookingRequest booking1 = BookingRequest.builder()
                .eventTitle("Annual HackUni 2026 CodeFest")
                .eventType("Hackathon")
                .venue("Computer Lab B & Main Hall")
                .expectedAudience(180)
                .startDate(LocalDateTime.now().plusDays(3))
                .endDate(LocalDateTime.now().plusDays(4))
                .requesterId(1L)
                .requesterName("Alex Rivera")
                .requesterRole("STUDENT")
                .facultySupervisorId(3L)
                .facultySupervisorName("Dr. Marcus Vance")
                .status(BookingStatus.PENDING_FACULTY)
                .purpose("National 24-hour student hackathon sponsored by tech companies.")
                .createdAt(LocalDateTime.now().minusHours(5))
                .items(Arrays.asList(item1, item2, item3))
                .build();

        BookingItem item4 = BookingItem.builder()
                .equipmentId(2L)
                .equipmentName("JBL Portable PA System with Wireless Mics")
                .category("AUDIO_VISUAL")
                .quantityRequested(1)
                .build();

        BookingItem item5 = BookingItem.builder()
                .equipmentId(9L)
                .equipmentName("Wooden Speaker Podium / Lectern")
                .category("SEATING_FURNITURE")
                .quantityRequested(1)
                .build();

        BookingRequest booking2 = BookingRequest.builder()
                .eventTitle("AI & Ethics Faculty Symposium")
                .eventType("Seminar")
                .venue("Indoor Auditorium 1")
                .expectedAudience(120)
                .startDate(LocalDateTime.now().plusDays(7))
                .endDate(LocalDateTime.now().plusDays(7).plusHours(6))
                .requesterId(2L)
                .requesterName("Sophia Chen")
                .requesterRole("CLUB_LEAD")
                .facultySupervisorId(3L)
                .facultySupervisorName("Dr. Marcus Vance")
                .status(BookingStatus.APPROVED)
                .purpose("Guest lectures from visiting professors and panel discussion.")
                .facultyNotes("Approved. Excellent initiative for student research.")
                .adminNotes("Equipment allocated in Media Center.")
                .createdAt(LocalDateTime.now().minusDays(2))
                .items(Arrays.asList(item4, item5))
                .build();

        bookingRepository.saveAll(Arrays.asList(booking1, booking2));
    }
}
