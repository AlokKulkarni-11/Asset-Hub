package com.wealthmap.controller;

import com.wealthmap.dto.response.SnapshotResponse;
import com.wealthmap.service.SnapshotService;
import org.springframework.security.core.Authentication;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/snapshots")
@CrossOrigin(origins = "*")
public class SnapshotController {

    @Autowired
    private SnapshotService snapshotService;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<SnapshotResponse>> getSnapshots(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(snapshotService.getSnapshotsForUser(user.getId()));
    }
    
    @PostMapping("/capture")
    public ResponseEntity<SnapshotResponse> captureSnapshot(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(snapshotService.captureSnapshotNow(user.getId()));
    }
}
