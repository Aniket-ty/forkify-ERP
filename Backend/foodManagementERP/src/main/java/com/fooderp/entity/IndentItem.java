package com.fooderp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "indent_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IndentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indent_id", nullable = false)
    private MaterialIndent indent;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Positive(message = "Quantity must be positive")
    @Column(nullable = false)
    private Double quantity;

    private String notes;
}
