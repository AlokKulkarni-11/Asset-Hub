package com.wealthmap.service;

import com.wealthmap.dto.response.AnalyticsSummaryResponse;
import com.wealthmap.dto.response.AssetResponse;
import com.wealthmap.dto.response.LiabilityResponse;
import com.wealthmap.dto.request.WhatIfRequest;
import com.wealthmap.dto.response.WhatIfResponse;
import com.wealthmap.enums.AssetType;
import com.wealthmap.service.assets.*;
import com.wealthmap.util.XirrCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final GoldService goldService;
    private final SilverService silverService;
    private final FixedDepositService fdService;
    private final StockService stockService;
    private final MutualFundService mfService;
    private final RealEstateService reService;
    private final CryptoService cryptoService;
    private final BondService bondService;
    private final EsopRsuService esopRsuService;
    private final LiabilityService liabilityService;

    public List<AssetResponse> getAllAssetsForUser(String userEmail) {
        List<AssetResponse> allAssets = new ArrayList<>();
        allAssets.addAll(goldService.getAllGoldForUser(userEmail));
        allAssets.addAll(silverService.getAllSilverForUser(userEmail));
        allAssets.addAll(fdService.getAllFDsForUser(userEmail));
        allAssets.addAll(stockService.getAllStocksForUser(userEmail));
        allAssets.addAll(mfService.getAllMutualFundsForUser(userEmail));
        allAssets.addAll(reService.getAllRealEstateForUser(userEmail));
        allAssets.addAll(cryptoService.getAllCryptoForUser(userEmail));
        allAssets.addAll(bondService.getAllBondsForUser(userEmail));
        allAssets.addAll(esopRsuService.getAllEsopRsusForUser(userEmail));
        return allAssets;
    }

    public AnalyticsSummaryResponse getAnalyticsSummary(String userEmail) {
        List<AssetResponse> assets = getAllAssetsForUser(userEmail);
        List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(userEmail);

        AnalyticsSummaryResponse response = new AnalyticsSummaryResponse();
        
        // Return early if no assets
        if (assets.isEmpty()) {
            response.setPortfolioXirr(0.0);
            response.setPortfolioCagr(0.0);
            response.setWarnings(Collections.singletonList("No assets tracked. Add some assets to unlock portfolio analytics!"));
            response.setAssetAnalytics(new HashMap<>());
            return response;
        }

        double totalAssetVal = 0.0;
        double totalInvestedVal = 0.0;
        Map<Long, AnalyticsSummaryResponse.AssetAnalytics> assetMap = new HashMap<>();

        List<XirrCalculator.CashFlow> portfolioCashFlows = new ArrayList<>();
        LocalDate today = LocalDate.now();
        LocalDate earliestPurchaseDate = today;

        AnalyticsSummaryResponse.AssetPerformanceCallout best = null;
        AnalyticsSummaryResponse.AssetPerformanceCallout worst = null;

        Map<String, Double> categoryAllocations = new HashMap<>();

        for (AssetResponse a : assets) {
            double current = a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0;
            double invested = a.getInvestedAmount() != null ? a.getInvestedAmount().doubleValue() : 0.0;
            LocalDate pDate = a.getPurchaseDate() != null ? a.getPurchaseDate() : today;

            totalAssetVal += current;
            totalInvestedVal += invested;

            if (pDate.isBefore(earliestPurchaseDate)) {
                earliestPurchaseDate = pDate;
            }

            // Track category sums for diversification warning
            String typeName = a.getAssetType().name();
            categoryAllocations.put(typeName, categoryAllocations.getOrDefault(typeName, 0.0) + current);

            // Calculate Asset level CAGR & XIRR
            AnalyticsSummaryResponse.AssetAnalytics assetAnal = new AnalyticsSummaryResponse.AssetAnalytics();
            double gainPercent = invested > 0 ? ((current - invested) / invested) * 100.0 : 0.0;
            assetAnal.setGainPercentage(gainPercent);

            long daysHeld = Math.max(1, ChronoUnit.DAYS.between(pDate, today));
            double years = daysHeld / 365.0;
            double assetCagr = invested > 0 && current > 0 ? (Math.pow(current / invested, 1.0 / years) - 1.0) * 100.0 : 0.0;
            assetAnal.setCagr(assetCagr);

            // Individual asset XIRR
            List<XirrCalculator.CashFlow> assetFlows = new ArrayList<>();
            assetFlows.add(new XirrCalculator.CashFlow(-invested, pDate));
            assetFlows.add(new XirrCalculator.CashFlow(current, today));
            double assetXirr = XirrCalculator.calculateXIRR(assetFlows) * 100.0;
            assetAnal.setXirr(assetXirr);

            assetMap.put(a.getId(), assetAnal);

            // Add to portfolio cash flows
            portfolioCashFlows.add(new XirrCalculator.CashFlow(-invested, pDate));

            // Performer Callouts
            AnalyticsSummaryResponse.AssetPerformanceCallout callout = new AnalyticsSummaryResponse.AssetPerformanceCallout();
            callout.setAssetId(a.getId());
            callout.setName(a.getName());
            callout.setAssetType(a.getAssetType().name());
            callout.setGainPercentage(gainPercent);
            callout.setCurrentValue(current);

            if (best == null || gainPercent > best.getGainPercentage()) {
                best = callout;
            }
            if (worst == null || gainPercent < worst.getGainPercentage()) {
                worst = callout;
            }
        }

        // Add final total valuation cash flow to portfolio XIRR
        portfolioCashFlows.add(new XirrCalculator.CashFlow(totalAssetVal, today));

        // Calculate Portfolio-wide metrics
        double portfolioXirr = XirrCalculator.calculateXIRR(portfolioCashFlows) * 100.0;
        response.setPortfolioXirr(portfolioXirr);

        long totalDaysHeld = Math.max(1, ChronoUnit.DAYS.between(earliestPurchaseDate, today));
        double totalYears = totalDaysHeld / 365.0;
        double portfolioCagr = totalInvestedVal > 0 && totalAssetVal > 0 ? (Math.pow(totalAssetVal / totalInvestedVal, 1.0 / totalYears) - 1.0) * 100.0 : 0.0;
        response.setPortfolioCagr(portfolioCagr);

        response.setAssetAnalytics(assetMap);
        response.setBestPerformer(best);
        response.setWorstPerformer(worst);

        // Generate Diversification/Concentration Warnings (Threshold: 50% allocation)
        List<String> warnings = new ArrayList<>();
        for (Map.Entry<String, Double> entry : categoryAllocations.entrySet()) {
            double categoryVal = entry.getValue();
            double pct = totalAssetVal > 0 ? (categoryVal / totalAssetVal) : 0.0;
            if (pct > 0.50) {
                String friendlyType = entry.getKey().toLowerCase().replace("_", " ");
                warnings.add(String.format("Concentration warning: %.0f%% of your portfolio is in %ss. Consider diversifying into other asset classes.", pct * 100.0, friendlyType));
            }
        }
        response.setWarnings(warnings);

        return response;
    }

    public WhatIfResponse getWhatIfScenario(String userEmail, WhatIfRequest request) {
        List<AssetResponse> assets = getAllAssetsForUser(userEmail);
        List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(userEmail);

        double originalAssets = 0.0;
        double originalLiabilities = liabilities.stream().mapToDouble(l -> l.getOutstandingBalance().doubleValue()).sum();
        double projectedAssets = 0.0;

        Map<String, Double> changes = request.getChanges() != null ? request.getChanges() : new HashMap<>();

        for (AssetResponse a : assets) {
            double val = a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0;
            originalAssets += val;

            // Find matching category multiplier change
            String typeName = a.getAssetType().name();
            double multiplier = 0.0;
            
            for (Map.Entry<String, Double> entry : changes.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(typeName)) {
                    multiplier = entry.getValue();
                    break;
                }
            }

            projectedAssets += val * (1.0 + multiplier);
        }

        WhatIfResponse response = new WhatIfResponse();
        response.setOriginalTotalAssets(originalAssets);
        response.setProjectedTotalAssets(projectedAssets);
        response.setOriginalNetWorth(originalAssets - originalLiabilities);
        response.setProjectedNetWorth(projectedAssets - originalLiabilities);
        response.setDifference(response.getProjectedNetWorth() - response.getOriginalNetWorth());

        return response;
    }
}
