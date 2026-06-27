package com.wealthmap.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "family_groups")
@Data
@NoArgsConstructor
public class FamilyGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String inviteCode;

    @Column(nullable = false)
    private Long creatorId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
