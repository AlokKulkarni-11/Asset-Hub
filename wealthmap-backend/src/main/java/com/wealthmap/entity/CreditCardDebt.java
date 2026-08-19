package com.wealthmap.entity;

import com.wealthmap.entity.base.Liability;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "credit_card_debt")
@Data
@EqualsAndHashCode(callSuper = true)
public class CreditCardDebt extends Liability {
    private String cardIssuer;
    private String lastFourDigits;
}
