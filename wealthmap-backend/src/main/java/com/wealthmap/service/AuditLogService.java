package com.wealthmap.service;

import com.wealthmap.entity.AuditLog;
import com.wealthmap.entity.User;
import com.wealthmap.repository.AuditLogRepository;
import com.wealthmap.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    public void log(String email, String action, String targetType, Long targetId, String details) {
        User user = userRepository.findByEmail(email).orElse(null);
        String name = user != null ? user.getName() : "Unknown";

        AuditLog log = new AuditLog();
        log.setUserEmail(email);
        log.setUserName(name);
        log.setAction(action);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setDetails(details);

        auditLogRepository.save(log);
    }

    public List<AuditLog> getLogsForFamily(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pageable pageable = PageRequest.of(0, 100, Sort.by("timestamp").descending());

        if (user.getFamilyGroup() != null) {
            List<String> memberEmails = userRepository.findAll().stream()
                    .filter(u -> u.getFamilyGroup() != null && u.getFamilyGroup().getId().equals(user.getFamilyGroup().getId()))
                    .map(User::getEmail)
                    .collect(Collectors.toList());
            return auditLogRepository.findByUserEmailIn(memberEmails, pageable).getContent();
        } else {
            return auditLogRepository.findByUserEmail(email, pageable).getContent();
        }
    }
}
