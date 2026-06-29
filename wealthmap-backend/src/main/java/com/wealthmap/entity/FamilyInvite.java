package com.wealthmap.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "family_invites")
@Data
@NoArgsConstructor
public class FamilyInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @Column(nullable = false)
    private String inviteeEmail;

    @Column(nullable = false)
    private String inviteeName;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private String status; // PENDING, ACCEPTED

    @CreationTimestamp
    private LocalDateTime createdAt;
}
