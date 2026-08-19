# Backend Analytics Deep Dive

This module turns raw assets and liabilities into performance analytics, benchmark comparisons, and what-if projections. It is one of the most calculation-heavy parts of the backend and depends on several other modules for its inputs.

## 1. Architecture Overview

`AnalyticsService` collects every asset and liability for the current user, computes portfolio XIRR/CAGR, identifies best and worst performers, and produces concentration warnings. `BenchmarkService` fetches historical benchmark data from Yahoo Finance and caches it, while the controller exposes these results to the frontend dashboard. The module is mostly pure calculation plus external data retrieval.

Top-level modules:
- `controller`: exposes analytics endpoints.
- `service`: calculates summary metrics and benchmark history.
- `util`: XIRR math engine.
- `dto`: response payloads for analytics and what-if results.
- `service/assets` and `service/LiabilityService`: data sources for analytics.

Typical analytics flow:
1. Dashboard requests summary data.
2. Service gathers assets and liabilities.
3. Current values are calculated.
4. Cash flows are passed into the XIRR calculator.
5. Benchmark history is fetched or loaded from cache.
6. A response DTO is returned to the frontend.

## 2. Feature-by-Feature Breakdown

Analytics features:
- Portfolio summary
- Asset-level performance analytics
- Best/worst performer callouts
- Concentration warnings
- Benchmark history overlay
- What-if projections

### Feature: Portfolio summary

**What it does**
Produces portfolio XIRR, CAGR, warnings, and per-asset analytics in one response.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/AnalyticsController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/AnalyticsService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/AnalyticsSummaryResponse.java`
- `wealthmap-backend/src/main/java/com/wealthmap/util/XirrCalculator.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/*`
- `wealthmap-backend/src/main/java/com/wealthmap/service/LiabilityService.java`

**Step-by-step trace**
1. Controller receives authenticated request.
2. `AnalyticsService.getAnalyticsSummary(...)` fetches all assets and liabilities.
3. Asset current values and invested values are summed.
4. Per-asset CAGR and XIRR are computed.
5. Portfolio-level cash flows are passed to `XirrCalculator`.
6. Best performer, worst performer, and warnings are populated.

**State management**
- Analytics values are derived, not stored.
- Response is built per request.

**Validation & error handling**
- If no assets exist, the service returns zeros and a helpful warning message.
- If XIRR cannot be computed, the calculator falls back to a simpler return model.

**Edge cases**
- A zero-asset portfolio is handled explicitly.
- All calculations assume valid dates and numeric values.

### Feature: Benchmark history

**What it does**
Returns historical benchmark points for Nifty 50 and gold, with a synthetic fallback if the live fetch fails.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/AnalyticsController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/BenchmarkService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/AnalyticsSummaryResponse.java`

**Step-by-step trace**
1. Controller receives start and end dates.
2. `BenchmarkService.getHistoricalBenchmarks(...)` checks the cache.
3. If cache misses, it attempts live Yahoo Finance fetches.
4. JSON is parsed into date-price maps.
5. If live fetch fails, synthetic data is generated.
6. A list of benchmark points is returned.

**State management**
- Benchmark data is cacheable server state.
- Frontend stores no benchmark truth, only rendered chart data.

**Validation & error handling**
- Errors fall back to synthetic data instead of crashing the dashboard.
- Date range is taken from request parameters.

**Edge cases**
- External schema changes could break the JSON parsing logic.
- `Sensex` is approximated from `Nifty50 * 3.3` in the current code, which is a simplification.

### Feature: What-if simulation

**What it does**
Projects a new net worth after applying hypothetical percentage changes to asset classes.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/AnalyticsController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/AnalyticsService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/WhatIfRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/WhatIfResponse.java`

**Step-by-step trace**
1. Controller receives a map of asset-class percentage changes.
2. Service gets current assets and liabilities.
3. For each asset, the service applies the matching multiplier if present.
4. Projected assets and net worth are calculated.
5. Response DTO returns original vs projected values.

**State management**
- Inputs are request-scoped assumptions.
- The output is a stateless calculation.

**Validation & error handling**
- Missing `changes` map falls back to an empty map.
- Any asset class without a matching key is treated as unchanged.

**Edge cases**
- This is a simplified scenario model; it does not model compounding effects or cross-asset correlation.

## 3. Library & Pattern Justification

- **XIRR calculator**
  - Solves irregular cash-flow return math.
  - Without it, the app would only show basic gain/loss, which is much less useful.
  - Alternative: simple CAGR only. Tradeoff: easier, but less accurate for staggered investments.

- **Benchmark caching**
  - Solves repeated benchmark fetches and reduces external load.
  - Without it, the dashboard would hit Yahoo Finance on every load.
  - Alternative: persist benchmark series in DB. Tradeoff: more durable, but more storage and refresh logic.

- **Synthetic fallback**
  - Solves availability when live external market data fails.
  - Without it, charting could break.
  - Alternative: return error. Tradeoff: more correctness, less resilience.

## 4. Database & Data Model

This module is mostly read-only over existing portfolio tables:
- `assets`
- `liabilities`
- `net_worth_snapshots`

It does not own a separate analytics table in the code shown. The calculations depend on the accuracy of the asset and liability models.

## 5. Security & Access Notes

The controller is protected by the normal JWT auth layer. Analytics are per-user, so the service reads the current user’s email from authentication and only aggregates that user’s portfolio. There is no separate analytics authorization layer because ownership is already enforced upstream.

Potential gaps:
- Benchmark parsing relies on external API structure.
- There is no explicit concurrency control for snapshot timing versus analytics reads.

## 6. Likely Interview Questions

- **Why use XIRR instead of just gain percentage?**
  - Because investments are made at different times, so timing matters.

- **Why cache benchmark data?**
  - Because the values are expensive to fetch and not needed fresh on every single request.

- **Why include a synthetic fallback?**
  - Because the dashboard should still work if the external data source is down.

