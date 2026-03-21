package com.fooderp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FoodErpApplication {
    public static void main(String[] args) {
        SpringApplication.run(FoodErpApplication.class, args);
        System.out.println("🚀 Food ERP Application Started Successfully!");
    }
}