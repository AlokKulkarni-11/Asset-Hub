package com.wealthmap.service;

import com.wealthmap.dto.request.GoalRequest;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.GoalResponse;
import com.wealthmap.entity.FinancialGoal;
import com.wealthmap.entity.User;
import com.wealthmap.repository.FinancialGoalRepository;
import com.wealthmap.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final FinancialGoalRepository goalRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;

    @Transactional
    public GoalResponse createGoal(GoalRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FinancialGoal goal = new FinancialGoal();
        goal.setUser(user);
        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setTargetDate(request.getTargetDate());
        goal.setNotes(request.getNotes());
        if (request.getTaggedAssetIds() != null) {
            goal.setTaggedAssetIds(request.getTaggedAssetIds());
        }

        if (request.isShared() && user.getFamilyGroup() != null) {
            goal.setFamilyGroup(user.getFamilyGroup());
        }

        FinancialGoal saved = goalRepository.save(goal);
        return mapToResponse(saved, userEmail);
    }

    @Transactional
    public GoalResponse updateGoal(Long id, GoalRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (goal.getFamilyGroup() != null) {
            if (user.getFamilyGroup() == null || !goal.getFamilyGroup().getId().equals(user.getFamilyGroup().getId())) {
                throw new RuntimeException("Access Denied");
            }
            if (user.getFamilyRole() == com.wealthmap.enums.FamilyRole.VIEWER) {
                throw new RuntimeException("Access Denied: Viewers cannot modify goals");
            }
        } else {
            if (!goal.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Access Denied");
            }
        }

        goal.setName(request.getName());
        goal.setTargetAmount(request.getTargetAmount());
        goal.setTargetDate(request.getTargetDate());
        goal.setNotes(request.getNotes());
        if (request.getTaggedAssetIds() != null) {
            goal.setTaggedAssetIds(request.getTaggedAssetIds());
        }

        if (request.isShared() && user.getFamilyGroup() != null) {
            goal.setFamilyGroup(user.getFamilyGroup());
        } else {
            goal.setFamilyGroup(null);
        }

        FinancialGoal saved = goalRepository.save(goal);
        return mapToResponse(saved, userEmail);
    }

    @Transactional(readOnly = true)
    public List<GoalResponse> getAllGoalsForUser(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<FinancialGoal> goals;
        if (user.getFamilyGroup() != null) {
            goals = goalRepository.findByUserIdOrFamilyGroupId(user.getId(), user.getFamilyGroup().getId());
        } else {
            goals = goalRepository.findByUserId(user.getId());
        }

        return goals.stream()
                .map(g -> mapToResponse(g, userEmail))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteGoal(Long id, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FinancialGoal goal = goalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Goal not found"));

        if (goal.getFamilyGroup() != null) {
            if (user.getFamilyGroup() == null || !goal.getFamilyGroup().getId().equals(user.getFamilyGroup().getId())) {
                throw new RuntimeException("Access Denied");
            }
            if (user.getFamilyRole() == com.wealthmap.enums.FamilyRole.VIEWER) {
                throw new RuntimeException("Access Denied: Viewers cannot delete goals");
            }
        } else {
            if (!goal.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Access Denied");
            }
        }

        goalRepository.delete(goal);
    }

    private GoalResponse mapToResponse(FinancialGoal goal, String userEmail) {
        GoalResponse resp = new GoalResponse();
        resp.setId(goal.getId());
        resp.setName(goal.getName());
        resp.setTargetAmount(goal.getTargetAmount());
        resp.setTargetDate(goal.getTargetDate());
        resp.setNotes(goal.getNotes());
        resp.setTaggedAssetIds(goal.getTaggedAssetIds());
        resp.setShared(goal.getFamilyGroup() != null);
        resp.setFamilyGroupId(goal.getFamilyGroup() != null ? goal.getFamilyGroup().getId() : null);

        // Calculate saved amount from tagged assets across user/family
        List<AssetResponse> allAssets;
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (goal.getFamilyGroup() != null) {
            List<User> members = userRepository.findAll().stream()
                    .filter(u -> u.getFamilyGroup() != null && u.getFamilyGroup().getId().equals(goal.getFamilyGroup().getId()))
                    .collect(Collectors.toList());
            allAssets = new java.util.ArrayList<>();
            for (User member : members) {
                allAssets.addAll(analyticsService.getAllAssetsForUser(member.getEmail()));
            }
        } else {
            allAssets = analyticsService.getAllAssetsForUser(userEmail);
        }

        Map<Long, BigDecimal> assetValueMap = allAssets.stream()
                .collect(Collectors.toMap(AssetResponse::getId, a -> a.getCurrentValue() != null ? a.getCurrentValue() : BigDecimal.ZERO, (v1, v2) -> v1));

        BigDecimal currentSaved = BigDecimal.ZERO;
        if (goal.getTaggedAssetIds() != null) {
            for (Long assetId : goal.getTaggedAssetIds()) {
                currentSaved = currentSaved.add(assetValueMap.getOrDefault(assetId, BigDecimal.ZERO));
            }
        }
        resp.setCurrentSavedAmount(currentSaved);

        double progress = 0.0;
        if (goal.getTargetAmount() != null && goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0) {
            progress = currentSaved.divide(goal.getTargetAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }
        resp.setProgressPercentage(Math.min(100.0, progress));

        return resp;
    }
}
