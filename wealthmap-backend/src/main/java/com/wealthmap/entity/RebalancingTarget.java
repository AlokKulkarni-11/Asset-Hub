package com.wealthmap.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "rebalancing_targets")
@Data
@NoArgsConstructor
public class RebalancingTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double targetEquityPct = 60.0;
    private double targetDebtPct = 30.0;
    private double targetGoldPct = 10.0;

    private double driftThresholdPct = 5.0;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
}
