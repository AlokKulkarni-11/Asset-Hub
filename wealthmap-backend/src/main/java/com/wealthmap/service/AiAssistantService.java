package com.wealthmap.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wealthmap.dto.request.AiChatRequest;
import com.wealthmap.dto.request.AnomalyCheckRequest;
import com.wealthmap.dto.response.AiChatResponse;
import com.wealthmap.dto.response.AiParseAssetResponse;
import com.wealthmap.dto.response.AnalyticsSummaryResponse;
import com.wealthmap.dto.response.AnomalyCheckResponse;
import com.wealthmap.dto.response.LiabilityResponse;
import com.wealthmap.dto.response.RebalancingResponse;
import com.wealthmap.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantService {

    private final GeminiService geminiService;
    private final AnalyticsService analyticsService;
    private final LiabilityService liabilityService;
    private final PlanningService planningService;
    private final RebalancingService rebalancingService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Parses natural language asset entries (e.g. "Bought 50g gold today at 7200/g" or "Added 2L to SBI FD at 7.1% for 3 years")
     */
    public AiParseAssetResponse parseNaturalLanguageAsset(String text) {
        if (text == null || text.trim().isEmpty()) {
            return AiParseAssetResponse.builder()
                    .assetType("UNKNOWN")
                    .rawInput(text)
                    .fields(Collections.emptyMap())
                    .confidenceScore(0.0)
                    .summary("No input provided")
                    .ambiguous(true)
                    .build();
        }

        if (geminiService.isConfigured()) {
            try {
                String prompt = String.format(
                        "You are an intelligent financial data extraction assistant for an asset and liability management app.\n" +
                        "Extract the structured asset or liability/loan details from this user input: \"%s\"\n" +
                        "Today's date is %s.\n\n" +
                        "Return a strict JSON object with this exact schema:\n" +
                        "{\n" +
                        "  \"isLiability\": false,\n" +
                        "  \"assetType\": \"STOCK | MUTUAL_FUND | GOLD | FIXED_DEPOSIT | REAL_ESTATE | CRYPTOCURRENCY | BOND | ESOP_RSU | null\",\n" +
                        "  \"liabilityType\": \"HOME_LOAN | PERSONAL_LOAN | EDUCATION_LOAN | CREDIT_CARD_DEBT | VEHICLE_LOAN | OTHER_LIABILITY | null\",\n" +
                        "  \"confidenceScore\": 0.95,\n" +
                        "  \"summary\": \"Brief 1-line description of extracted asset or loan\",\n" +
                        "  \"ambiguous\": false,\n" +
                        "  \"fields\": {\n" +
                        "    \"name\": \"Asset or Loan Name\",\n" +
                        "    \"ticker\": \"TCS.NS (if stock)\",\n" +
                        "    \"companyName\": \"Company Name (if stock/esop)\",\n" +
                        "    \"schemeName\": \"Fund Name (if mutual fund)\",\n" +
                        "    \"bankName\": \"Bank / Lender Name\",\n" +
                        "    \"lenderName\": \"Lender / Bank Name (if loan)\",\n" +
                        "    \"principalAmount\": 200000,\n" +
                        "    \"outstandingBalance\": 200000,\n" +
                        "    \"interestRate\": 7.1,\n" +
                        "    \"monthlyEmi\": 43391,\n" +
                        "    \"emi\": 43391,\n" +
                        "    \"tenureMonths\": 36,\n" +
                        "    \"weightGrams\": 50,\n" +
                        "    \"purity\": \"24K\",\n" +
                        "    \"purchasePrice\": 360000,\n" +
                        "    \"units\": 10,\n" +
                        "    \"quantity\": 10,\n" +
                        "    \"averageBuyPrice\": 4100,\n" +
                        "    \"currentStockPrice\": 150,\n" +
                        "    \"coinId\": \"bitcoin (if crypto)\",\n" +
                        "    \"symbol\": \"BTC (if crypto)\",\n" +
                        "    \"bondType\": \"GOVERNMENT_BOND | CORPORATE_BOND | PPF | NPS | SOVEREIGN_GOLD_BOND | OTHER_DEBENTURE\",\n" +
                        "    \"propertyName\": \"Property description (if real estate)\",\n" +
                        "    \"propertyType\": \"Residential | Commercial | Plot\",\n" +
                        "    \"estimatedCurrentValue\": 5000000,\n" +
                        "    \"purchaseDate\": \"YYYY-MM-DD\",\n" +
                        "    \"startDate\": \"YYYY-MM-DD\",\n" +
                        "    \"maturityDate\": \"YYYY-MM-DD\",\n" +
                        "    \"currency\": \"INR | USD | EUR | etc.\",\n" +
                        "    \"notes\": \"Any extra details\"\n" +
                        "  }\n" +
                        "}\n" +
                        "If it is a loan / debt / EMI / mortgage, set isLiability=true, specify liabilityType, and set assetType=null.\n" +
                        "If it is an asset, set isLiability=false, specify assetType, and set liabilityType=null.\n" +
                        "Leave any missing or unmentioned fields as null or omitted. Do not invent values.",
                        text, LocalDate.now()
                );

                JsonNode resJson = geminiService.generateStructuredJson(prompt);
                if (resJson != null) {
                    boolean isLiability = resJson.path("isLiability").asBoolean(false);
                    String assetType = resJson.has("assetType") && !resJson.path("assetType").isNull()
                            ? resJson.path("assetType").asText() : null;
                    String liabilityType = resJson.has("liabilityType") && !resJson.path("liabilityType").isNull()
                            ? resJson.path("liabilityType").asText() : null;

                    if (liabilityType != null && !liabilityType.isEmpty() && !"null".equalsIgnoreCase(liabilityType)) {
                        isLiability = true;
                    }

                    double confidence = resJson.path("confidenceScore").asDouble(0.85);
                    String summary = resJson.path("summary").asText("Parsed entry");
                    boolean ambiguous = resJson.path("ambiguous").asBoolean(false);

                    Map<String, Object> fields = new HashMap<>();
                    JsonNode fieldsNode = resJson.path("fields");
                    if (fieldsNode.isObject()) {
                        fieldsNode.fields().forEachRemaining(entry -> {
                            if (!entry.getValue().isNull()) {
                                if (entry.getValue().isNumber()) {
                                    fields.put(entry.getKey(), entry.getValue().numberValue());
                                } else if (entry.getValue().isBoolean()) {
                                    fields.put(entry.getKey(), entry.getValue().asBoolean());
                                } else {
                                    fields.put(entry.getKey(), entry.getValue().asText());
                                }
                            }
                        });
                    }

                    return AiParseAssetResponse.builder()
                            .assetType(assetType)
                            .liabilityType(liabilityType)
                            .isLiability(isLiability)
                            .rawInput(text)
                            .fields(fields)
                            .confidenceScore(confidence)
                            .summary(summary)
                            .ambiguous(ambiguous)
                            .build();
                }
            } catch (Exception e) {
                log.warn("Gemini NLP parsing failed: {}", e.getMessage());
            }
        }

        // Heuristic fallback for common patterns
        return fallbackNlpParser(text);
    }

    /**
     * Generates a 2-4 sentence executive portfolio narrative based on real computed metrics
     */
    @Cacheable(value = "aiNarrative", key = "#user.id")
    public String generatePortfolioNarrative(User user) {
        List<com.wealthmap.dto.response.AssetResponse> assets = analyticsService.getAllAssetsForUser(user.getEmail());
        List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(user.getEmail());
        RebalancingResponse rebalancing = rebalancingService.getStatus(user.getEmail());

        double totalAssetsVal = assets.stream().mapToDouble(a -> a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0).sum();
        double totalInvestedVal = assets.stream().mapToDouble(a -> a.getInvestedAmount() != null ? a.getInvestedAmount().doubleValue() : (a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0)).sum();
        BigDecimal totalDebt = liabilities.stream()
                .map(l -> l.getOutstandingBalance() != null ? l.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAssets = BigDecimal.valueOf(totalAssetsVal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal netWorth = totalAssets.subtract(totalDebt);

        double liquidVal = com.wealthmap.util.LiquidityHelper.calculateLiquidTotal(assets);
        BigDecimal liquidAssets = BigDecimal.valueOf(liquidVal).setScale(2, RoundingMode.HALF_UP);
        double liquidRatioVal = totalAssetsVal > 0 ? (liquidVal / totalAssetsVal) * 100.0 : 0.0;

        java.util.Map<String, Double> typeAllocation = new java.util.HashMap<>();
        for (com.wealthmap.dto.response.AssetResponse a : assets) {
            if (a.getAssetType() != null && a.getCurrentValue() != null) {
                String t = a.getAssetType().name();
                typeAllocation.put(t, typeAllocation.getOrDefault(t, 0.0) + a.getCurrentValue().doubleValue());
            }
        }

        String fallbackNarrative = String.format(
                "Your portfolio currently stands at a total net worth of ₹%s with ₹%s across assets and ₹%s in outstanding liabilities. " +
                "Liquidity represents %.1f%% of your holdings, providing flexible financial security. " +
                "Asset allocations remain balanced across your tracked categories.",
                netWorth.toPlainString(), totalAssets.toPlainString(), totalDebt.toPlainString(), liquidRatioVal
        );

        if (geminiService.isConfigured()) {
            try {
                String prompt = String.format(
                        "You are a professional wealth analyst writing an executive dashboard briefing for an investor.\n" +
                        "Real computed portfolio data:\n" +
                        "- Net Worth: ₹%s\n" +
                        "- Total Assets: ₹%s (Liquid: ₹%s, %.1f%% of total)\n" +
                        "- Total Liabilities: ₹%s\n" +
                        "- Asset Class Breakdown: %s\n" +
                        "- Rebalancing Action Required: %s\n\n" +
                        "Write a concise, polished 2-3 sentence executive narrative summarizing their wealth position, key asset driver, and any attention point. " +
                        "Never invent numbers — use ONLY the figures given above.",
                        netWorth, totalAssets, liquidAssets, liquidRatioVal,
                        totalDebt, typeAllocation,
                        rebalancing != null && rebalancing.isNeedsRebalancing() ? "Yes, portfolio has drifted" : "No, within targets"
                );

                String aiNarrative = geminiService.generateText(prompt);
                if (aiNarrative != null && !aiNarrative.trim().isEmpty()) {
                    return aiNarrative.trim();
                }
            } catch (Exception e) {
                log.warn("Gemini narrative generation failed: {}", e.getMessage());
            }
        }

        return fallbackNarrative;
    }

    /**
     * Handles conversational financial assistant queries grounded strictly in user's real DB data
     */
    public AiChatResponse chat(User user, AiChatRequest request) {
        List<com.wealthmap.dto.response.AssetResponse> assets = analyticsService.getAllAssetsForUser(user.getEmail());
        List<LiabilityResponse> liabilities = liabilityService.getAllLiabilitiesForUser(user.getEmail());
        RebalancingResponse rebalancing = rebalancingService.getStatus(user.getEmail());

        double totalAssetsVal = assets.stream().mapToDouble(a -> a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0).sum();
        double totalInvestedVal = assets.stream().mapToDouble(a -> a.getInvestedAmount() != null ? a.getInvestedAmount().doubleValue() : (a.getCurrentValue() != null ? a.getCurrentValue().doubleValue() : 0.0)).sum();
        BigDecimal totalDebt = liabilities.stream()
                .map(l -> l.getOutstandingBalance() != null ? l.getOutstandingBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalAssets = BigDecimal.valueOf(totalAssetsVal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalInvested = BigDecimal.valueOf(totalInvestedVal).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalGain = totalAssets.subtract(totalInvested);
        BigDecimal netWorth = totalAssets.subtract(totalDebt);

        double liquidVal = com.wealthmap.util.LiquidityHelper.calculateLiquidTotal(assets);
        BigDecimal liquidAssets = BigDecimal.valueOf(liquidVal).setScale(2, RoundingMode.HALF_UP);
        double liquidRatioVal = totalAssetsVal > 0 ? (liquidVal / totalAssetsVal) * 100.0 : 0.0;
        double debtToAssetRatioVal = totalAssetsVal > 0 ? (totalDebt.doubleValue() / totalAssetsVal) * 100.0 : 0.0;

        java.util.Map<String, Double> typeAllocation = new java.util.HashMap<>();
        for (com.wealthmap.dto.response.AssetResponse a : assets) {
            if (a.getAssetType() != null && a.getCurrentValue() != null) {
                String t = a.getAssetType().name();
                typeAllocation.put(t, typeAllocation.getOrDefault(t, 0.0) + a.getCurrentValue().doubleValue());
            }
        }

        List<String> referencedDataPoints = Arrays.asList(
                "Net Worth: ₹" + netWorth,
                "Total Assets: ₹" + totalAssets,
                "Total Liabilities: ₹" + totalDebt,
                "Liquid Cash/Reserves: ₹" + liquidAssets,
                "Net Gains: ₹" + totalGain
        );

        List<String> suggestedFollowUps = Arrays.asList(
                "What is my debt-to-asset ratio?",
                "How much can I safely withdraw per month (SWP)?",
                "Do I need to rebalance my portfolio?",
                "How is my emergency fund preparedness?"
        );

        if (geminiService.isConfigured()) {
            try {
                StringBuilder promptBuilder = new StringBuilder();
                promptBuilder.append("You are Hub Mate, the intelligent personal wealth copilot for Asset Hub. Answer the user's inquiry helpfully, conversationally, and clearly.\n");
                promptBuilder.append("GROUND RULES:\n");
                promptBuilder.append("1. Answer using the user's REAL financial portfolio data provided below.\n");
                promptBuilder.append("2. NEVER invent, hallucinate, or alter financial numbers.\n");
                promptBuilder.append("3. Provide clear calculations, step-by-step reasoning, and practical next steps.\n\n");
                promptBuilder.append("USER'S REAL FINANCIAL CONTEXT:\n");
                promptBuilder.append(String.format("- Net Worth: ₹%s\n", netWorth));
                promptBuilder.append(String.format("- Total Assets (Current): ₹%s (Invested: ₹%s, P&L: ₹%s)\n", totalAssets, totalInvested, totalGain));
                promptBuilder.append(String.format("- Liquid Assets: ₹%s (%.1f%% of total)\n", liquidAssets, liquidRatioVal));
                promptBuilder.append(String.format("- Total Outstanding Debt: ₹%s (Debt-to-Asset: %.1f%%)\n", totalDebt, debtToAssetRatioVal));
                promptBuilder.append(String.format("- Asset Breakdown: %s\n", typeAllocation));
                if (rebalancing != null) {
                    promptBuilder.append(String.format("- Rebalancing Status: %s (Equity: %s, Debt: %s, Gold: %s)\n",
                            rebalancing.isNeedsRebalancing() ? "Drift detected" : "Balanced",
                            rebalancing.getCurrentEquityPct(), rebalancing.getCurrentDebtPct(), rebalancing.getCurrentGoldPct()));
                }

                if (request.getHistory() != null && !request.getHistory().isEmpty()) {
                    promptBuilder.append("\nPREVIOUS CONVERSATION:\n");
                    for (AiChatRequest.ChatMessageDto msg : request.getHistory()) {
                        promptBuilder.append(String.format("%s: %s\n", msg.getRole().toUpperCase(), msg.getContent()));
                    }
                }

                promptBuilder.append(String.format("\nUSER MESSAGE: %s\n", request.getMessage()));

                String aiReply = geminiService.generateText(promptBuilder.toString());
                if (aiReply != null && !aiReply.trim().isEmpty()) {
                    return AiChatResponse.builder()
                            .reply(aiReply.trim())
                            .groundedInRealData(true)
                            .referencedDataPoints(referencedDataPoints)
                            .suggestedFollowUps(suggestedFollowUps)
                            .build();
                }
            } catch (Exception e) {
                log.warn("Gemini chat failed: {}", e.getMessage());
            }
        }

        // Rule-based fallback responses for core queries when offline
        String userMsg = request.getMessage().toLowerCase();
        String fallbackReply;

        if (userMsg.contains("net worth") || userMsg.contains("wealth")) {
            fallbackReply = String.format("Your current Net Worth is **₹%s**, calculated from **₹%s** in total assets minus **₹%s** in liabilities.", netWorth, totalAssets, totalDebt);
        } else if (userMsg.contains("liquid") || userMsg.contains("cash")) {
            fallbackReply = String.format("You have **₹%s** in liquid assets (Fixed Deposits, Liquid Mutual Funds, and Savings), which is **%.1f%%** of your total portfolio.",
                    liquidAssets, liquidRatioVal);
        } else if (userMsg.contains("debt") || userMsg.contains("loan") || userMsg.contains("liability")) {
            fallbackReply = String.format("Your total debt obligation is **₹%s**. Your Debt-to-Asset ratio is **%.1f%%**, which is within a manageable range.",
                    totalDebt, debtToAssetRatioVal);
        } else if (userMsg.contains("rebalance") || userMsg.contains("drift")) {
            fallbackReply = (rebalancing != null && rebalancing.isNeedsRebalancing())
                    ? "Your portfolio has drifted from target allocations. You should consider rebalancing your equity and debt weights."
                    : "Your portfolio is currently well-balanced within your target allocation thresholds.";
        } else {
            fallbackReply = String.format("Based on your portfolio data, your total Net Worth is **₹%s** across **₹%s** in assets and **₹%s** in liabilities. You can ask me about liquidity, retirement SWP, debt ratios, or asset breakdowns.",
                    netWorth, totalAssets, totalDebt);
        }

        return AiChatResponse.builder()
                .reply(fallbackReply)
                .groundedInRealData(true)
                .referencedDataPoints(referencedDataPoints)
                .suggestedFollowUps(suggestedFollowUps)
                .build();
    }

    /**
     * Anomaly detection sanity check for manual asset entry forms
     */
    public AnomalyCheckResponse detectAnomalies(AnomalyCheckRequest request) {
        if (request == null || request.getValues() == null) {
            return AnomalyCheckResponse.builder().isAnomaly(false).build();
        }

        String assetType = request.getAssetType() != null ? request.getAssetType().toUpperCase() : "";
        Map<String, Object> val = request.getValues();
        List<String> flags = new ArrayList<>();

        // 1. Gold Checks
        if ("GOLD".equals(assetType)) {
            double weight = parseDouble(val.get("weightGrams"));
            double price = parseDouble(val.get("purchasePrice"));
            if (weight > 0 && price > 0) {
                double perGram = price / weight;
                if (perGram > 25000) {
                    return AnomalyCheckResponse.builder()
                            .isAnomaly(true)
                            .severity("HIGH")
                            .fieldName("purchasePrice")
                            .warningMessage(String.format("Calculated rate is ₹%.0f/gram, which is unusually higher than current gold market rates (~₹7,000–₹8,500/g).", perGram))
                            .suggestion("Did you enter the total purchase price instead of per-gram, or vice versa?")
                            .flags(Collections.singletonList("RATE_SUSPICIOUSLY_HIGH"))
                            .build();
                } else if (perGram < 1500 && perGram > 0) {
                    return AnomalyCheckResponse.builder()
                            .isAnomaly(true)
                            .severity("MEDIUM")
                            .fieldName("purchasePrice")
                            .warningMessage(String.format("Calculated rate is ₹%.0f/gram, which looks unusually low for physical gold.", perGram))
                            .suggestion("Please verify the entered weight and total purchase price.")
                            .flags(Collections.singletonList("RATE_SUSPICIOUSLY_LOW"))
                            .build();
                }
            }
        }

        // 2. Fixed Deposit Checks
        if ("FIXED_DEPOSIT".equals(assetType) || "FD".equals(assetType)) {
            double rate = parseDouble(val.get("interestRate"));
            if (rate > 20.0) {
                return AnomalyCheckResponse.builder()
                        .isAnomaly(true)
                        .severity("HIGH")
                        .fieldName("interestRate")
                        .warningMessage(String.format("Interest rate entered is %.2f%%. Standard bank FD rates in India range between 5%% and 9%%.", rate))
                        .suggestion(String.format("Did you mean %.2f%% instead of %.2f%%?", rate / 100.0 > 0.5 ? rate / 100.0 : rate / 10.0, rate))
                        .flags(Collections.singletonList("INTEREST_RATE_EXTREME"))
                        .build();
            }
        }

        // 3. Stock / Mutual Fund Checks
        if ("STOCK".equals(assetType) || "MUTUAL_FUND".equals(assetType)) {
            double quantity = parseDouble(val.get("quantity") != null ? val.get("quantity") : val.get("units"));
            double avgPrice = parseDouble(val.get("averageBuyPrice") != null ? val.get("averageBuyPrice") : val.get("averageNav"));
            if (quantity > 1000000) {
                return AnomalyCheckResponse.builder()
                        .isAnomaly(true)
                        .severity("LOW")
                        .fieldName("quantity")
                        .warningMessage(String.format("Quantity entered is %,.0f units. Please double check that this is not an amount in rupees.", quantity))
                        .suggestion("Verify share/unit quantity.")
                        .flags(Collections.singletonList("QUANTITY_UNUSUALLY_LARGE"))
                        .build();
            }
        }

        return AnomalyCheckResponse.builder().isAnomaly(false).build();
    }

    private double parseDouble(Object obj) {
        if (obj == null) return 0.0;
        if (obj instanceof Number) return ((Number) obj).doubleValue();
        try {
            return Double.parseDouble(obj.toString().replaceAll("[^0-9.]", ""));
        } catch (Exception e) {
            return 0.0;
        }
    }

    private AiParseAssetResponse fallbackNlpParser(String text) {
        String lower = text.toLowerCase();
        Map<String, Object> fields = new HashMap<>();
        String assetType = null;
        String liabilityType = null;
        boolean isLiability = false;

        // Check for Liabilities / Loans
        if (lower.contains("home loan") || lower.contains("housing loan") || lower.contains("mortgage")) {
            liabilityType = "HOME_LOAN";
            isLiability = true;
            fields.put("name", "Home Loan");
            fields.put("startDate", LocalDate.now().toString());
        } else if (lower.contains("car loan") || lower.contains("vehicle loan") || lower.contains("auto loan")) {
            liabilityType = "VEHICLE_LOAN";
            isLiability = true;
            fields.put("name", "Vehicle Loan");
            fields.put("startDate", LocalDate.now().toString());
        } else if (lower.contains("education loan") || lower.contains("student loan")) {
            liabilityType = "EDUCATION_LOAN";
            isLiability = true;
            fields.put("name", "Education Loan");
            fields.put("startDate", LocalDate.now().toString());
        } else if (lower.contains("credit card") || lower.contains("card debt")) {
            liabilityType = "CREDIT_CARD_DEBT";
            isLiability = true;
            fields.put("name", "Credit Card Debt");
            fields.put("startDate", LocalDate.now().toString());
        } else if (lower.contains("personal loan") || lower.contains("loan") || lower.contains("debt") || lower.contains("emi") || lower.contains("borrowed")) {
            liabilityType = "PERSONAL_LOAN";
            isLiability = true;
            fields.put("name", "Personal Loan");
            fields.put("startDate", LocalDate.now().toString());
        }
        // Check for Assets
        else if (lower.contains("gold") || lower.contains("sovereign") || lower.contains("silver")) {
            assetType = "GOLD";
            fields.put("name", "Physical Gold");
            fields.put("purchaseDate", LocalDate.now().toString());
        } else if (lower.contains("fd") || lower.contains("fixed deposit") || lower.contains("recurring deposit") || lower.contains("term deposit")) {
            assetType = "FIXED_DEPOSIT";
            fields.put("name", "Fixed Deposit");
            fields.put("bankName", "Bank FD");
            fields.put("startDate", LocalDate.now().toString());
            fields.put("purchaseDate", LocalDate.now().toString());
        } else if (lower.contains("fund") || lower.contains("sip") || lower.contains("mutual") || lower.contains("etf") || lower.contains("index")) {
            assetType = "MUTUAL_FUND";
            fields.put("schemeName", "Mutual Fund");
            fields.put("purchaseDate", LocalDate.now().toString());
        } else if (lower.contains("plot") || lower.contains("flat") || lower.contains("house") || lower.contains("land") || lower.contains("real estate") || lower.contains("apartment") || lower.contains("villa")) {
            assetType = "REAL_ESTATE";
            fields.put("propertyName", "Real Estate Property");
            fields.put("propertyType", "Residential");
            fields.put("purchaseDate", LocalDate.now().toString());
        } else if (lower.contains("crypto") || lower.contains("bitcoin") || lower.contains("btc") || lower.contains("ethereum") || lower.contains("eth") || lower.contains("sol") || lower.contains("solana")) {
            assetType = "CRYPTOCURRENCY";
            fields.put("name", lower.contains("btc") || lower.contains("bitcoin") ? "Bitcoin" : (lower.contains("eth") || lower.contains("ethereum") ? "Ethereum" : "Crypto"));
            fields.put("symbol", lower.contains("btc") || lower.contains("bitcoin") ? "BTC" : (lower.contains("eth") || lower.contains("ethereum") ? "ETH" : "CRYPTO"));
            fields.put("coinId", lower.contains("btc") || lower.contains("bitcoin") ? "bitcoin" : (lower.contains("eth") || lower.contains("ethereum") ? "ethereum" : "cryptocurrency"));
            fields.put("purchaseDate", LocalDate.now().toString());
        } else if (lower.contains("bond") || lower.contains("ppf") || lower.contains("nps") || lower.contains("debenture") || lower.contains("treasury")) {
            assetType = "BOND";
            fields.put("name", "Government Bond / PPF");
            fields.put("bondType", lower.contains("ppf") ? "PPF" : (lower.contains("nps") ? "NPS" : "GOVERNMENT_BOND"));
            fields.put("startDate", LocalDate.now().toString());
        } else if (lower.contains("esop") || lower.contains("rsu") || lower.contains("stock grant") || lower.contains("vesting")) {
            assetType = "ESOP_RSU";
            fields.put("name", "Company ESOP/RSU");
            fields.put("planType", lower.contains("rsu") ? "RSU" : "ESOP");
            fields.put("companyName", "Tech Corp");
        } else {
            assetType = "STOCK";
            fields.put("companyName", "Equity Stock");
            fields.put("ticker", "TICKER");
            fields.put("purchaseDate", LocalDate.now().toString());
        }

        return AiParseAssetResponse.builder()
                .assetType(assetType)
                .liabilityType(liabilityType)
                .isLiability(isLiability)
                .rawInput(text)
                .fields(fields)
                .confidenceScore(0.60)
                .summary("Parsed entry: " + (isLiability ? liabilityType : assetType))
                .ambiguous(true)
                .build();
    }
}
