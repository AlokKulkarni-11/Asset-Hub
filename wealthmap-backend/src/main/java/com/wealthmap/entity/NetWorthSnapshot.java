package com.wealthmap.entity;

import com.wealthmap.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "net_worth_snapshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NetWorthSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate snapshotDate;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalNetWorth;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalInvested;
}
