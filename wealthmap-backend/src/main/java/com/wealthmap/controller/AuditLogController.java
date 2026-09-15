package com.wealthmap.controller;

import com.wealthmap.entity.AuditLog;
import com.wealthmap.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "*")
public class AuditLogController {

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getLogs(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(auditLogService.getLogsForFamily(email));
    }
}
