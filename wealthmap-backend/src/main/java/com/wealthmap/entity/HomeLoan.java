package com.wealthmap.entity;

import com.wealthmap.entity.base.Liability;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "home_loans")
@Data
@EqualsAndHashCode(callSuper = true)
public class HomeLoan extends Liability {
    private String lenderName;
    private String propertyAddress;
}
