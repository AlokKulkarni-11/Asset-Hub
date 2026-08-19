package com.wealthmap.controller;

import com.wealthmap.dto.request.GoalRequest;
import com.wealthmap.dto.response.GoalResponse;
import com.wealthmap.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getAllGoals(Authentication authentication) {
        return ResponseEntity.ok(goalService.getAllGoalsForUser(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(@RequestBody GoalRequest request, Authentication authentication) {
        return ResponseEntity.ok(goalService.createGoal(request, authentication.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> updateGoal(@PathVariable Long id, @RequestBody GoalRequest request, Authentication authentication) {
        return ResponseEntity.ok(goalService.updateGoal(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long id, Authentication authentication) {
        goalService.deleteGoal(id, authentication.getName());
        return ResponseEntity.ok().build();
    }
}
