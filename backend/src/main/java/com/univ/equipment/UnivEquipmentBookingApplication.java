package com.univ.equipment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class UnivEquipmentBookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(UnivEquipmentBookingApplication.class, args);
    }
}
