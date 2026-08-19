package com.wealthmap.service;

import com.wealthmap.dto.request.EmergencyFundRequest;
import com.wealthmap.dto.request.RetirementRequest;
import com.wealthmap.dto.response.*;
import com.wealthmap.entity.EmergencyFund;
import com.wealthmap.entity.User;
import com.wealthmap.repository.EmergencyFundRepository;
import com.wealthmap.repository.UserRepository;
import com.wealthmap.util.LiquidityHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanningService {

    private final EmergencyFundRepository emergencyFundRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final LiabilityService liabilityService;

    // --- Emergency Fund ---

    @Transactional
    public EmergencyFundResponse saveEmergencyFund(EmergencyFundRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        EmergencyFund fund = emergencyFundRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    EmergencyFund ef = new EmergencyFund();
                    ef.setUser(user);
                    return ef;
                });

        fund.setMonthlyExpense(request.getMonthlyExpense());
        if (request.getTargetMonths() > 0) {
            fund.setTargetMonths(request.getTargetMonths());
        }

        EmergencyFund saved = emergencyFundRepository.save(fund);
        return getEmergencyFund(userEmail);
    }

    @Transactional(readOnly = true)
    public EmergencyFundResponse getEmergencyFund(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        EmergencyFund fund = emergencyFundRepository.findByUserId(user.getId())
                .orElse(null);

        List<AssetResponse> assets = analyticsService.getAllAssetsForUser(userEmail);
        double liquidTotal = LiquidityHelper.calculateLiquidTotal(assets);

        EmergencyFundResponse resp = new EmergencyFundResponse();
        resp.setCurrentLiquidAssets(BigDecimal.valueOf(liquidTotal));

        if (fund != null) {
            resp.setId(fund.getId());
            resp.setMonthlyExpense(fund.getMonthlyExpense());
            resp.setTargetMonths(fund.getTargetMonths());
            BigDecimal target = fund.getMonthlyExpense().multiply(BigDecimal.valueOf(fund.getTargetMonths()));
            resp.setTargetCorpus(target);

            double progress = 0.0;
            if (target.compareTo(BigDecimal.ZERO) > 0) {
                progress = (liquidTotal / target.doubleValue()) * 100.0;
            }
            resp.setProgressPercentage(Math.min(100.0, progress));
        } else {
            resp.setMonthlyExpense(BigDecimal.ZERO);
            resp.setTargetMonths(6);
            resp.setTargetCorpus(BigDecimal.ZERO);
            resp.setProgressPercentage(0.0);
        }

        return resp;
    }

    // --- Retirement Calculator ---

    public RetirementResponse calculateRetirement(RetirementRequest request, String userEmail) {
        List<AssetResponse> assets = analyticsService.getAllAssetsForUser(userEmail);
        List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(userEmail);

        double totalAssets = assets.stream().mapToDouble(a -> a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0).sum();
        double totalLiabilities = liabilities.stream().mapToDouble(l -> l.getOutstandingBalance() != null ? l.getOutstandingBalance().doubleValue() : 0).sum();
        double currentNetWorth = totalAssets - totalLiabilities;

        int yearsToRetirement = Math.max(1, request.getRetirementAge() - request.getCurrentAge());
        double monthlyExpenseToday = request.getDesiredMonthlyExpenseToday() != null ? request.getDesiredMonthlyExpenseToday().doubleValue() : 50000.0;
        
        double inflationRate = request.getInflationRate() / 100.0;
        double expectedReturnRate = request.getExpectedReturnRate() / 100.0;

        // Inflation adjusted monthly expense at retirement age: Expense * (1 + i)^n
        double inflationFactor = Math.pow(1.0 + inflationRate, yearsToRetirement);
        double adjustedMonthlyExpense = monthlyExpenseToday * inflationFactor;
        double annualExpenseAtRetirement = adjustedMonthlyExpense * 12.0;

        // Required Retirement Corpus using Rule of 25 (or 4% withdrawal rate)
        double requiredCorpus = annualExpenseAtRetirement * 25.0;

        // Projected Net Worth at Retirement Age: CurrentNetWorth * (1 + r)^n
        double projectedNetWorth = currentNetWorth * Math.pow(1.0 + expectedReturnRate, yearsToRetirement);
        double diff = projectedNetWorth - requiredCorpus;
        double readiness = requiredCorpus > 0 ? (projectedNetWorth / requiredCorpus) * 100.0 : 100.0;

        RetirementResponse resp = new RetirementResponse();
        resp.setYearsToRetirement(yearsToRetirement);
        resp.setInflationAdjustedMonthlyExpense(BigDecimal.valueOf(adjustedMonthlyExpense).setScale(2, RoundingMode.HALF_UP));
        resp.setRequiredRetirementCorpus(BigDecimal.valueOf(requiredCorpus).setScale(2, RoundingMode.HALF_UP));
        resp.setProjectedNetWorthAtRetirement(BigDecimal.valueOf(projectedNetWorth).setScale(2, RoundingMode.HALF_UP));
        resp.setShortfallOrSurplus(BigDecimal.valueOf(diff).setScale(2, RoundingMode.HALF_UP));
        resp.setReadinessPercentage(Math.min(100.0, Math.max(0.0, readiness)));

        return resp;
    }
}
