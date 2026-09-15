package com.wealthmap.repository;

import com.wealthmap.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUserEmailIn(List<String> userEmails, Pageable pageable);
    Page<AuditLog> findByUserEmail(String userEmail, Pageable pageable);
}
