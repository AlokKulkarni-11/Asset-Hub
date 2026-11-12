# Backend Analytics & Performance Engine Deep Dive

This document covers AssetHub’s financial analytics engine: **XIRR (Internal Rate of Return)**, **CAGR**, **Benchmark Overlays (Nifty 50 & Gold)**, **Asset Concentration Warnings**, **What-If Net Worth Simulator**, and the **Composite Financial Health Score (0–100 Index)**.

---

## 1. Architecture Overview

The analytics engine processes raw asset cash flows, historical snapshots, and market benchmarks to deliver institutional-grade portfolio insights without pushing computation into the database.

### Key Components:
- `com.wealthmap.controller.AnalyticsController`: REST endpoints for portfolio XIRR, CAGR, benchmark series, and performance highlights.
- `com.wealthmap.service.AnalyticsService`: Implements financial math solvers, benchmark data scaling, and concentration detection.
- `com.wealthmap.controller.HealthScoreController`: Exposes `/api/health-score` for the 0–100 financial health index.
- `com.wealthmap.service.HealthScoreService`: Evaluates debt, liquidity, diversification, and emergency runway against Gemini AI-generated qualitative reasoning.

---

## 2. Mathematical Formulations & Engines

### 2.1 XIRR (Extended Internal Rate of Return)
XIRR calculates the annual rate of return for irregular, non-periodic cash flows. It solves for the discount rate $r$ in the Net Present Value (NPV) equation:

$$\text{NPV}(r) = \sum_{i=1}^n \frac{C_i}{(1 + r)^{\frac{d_i - d_1}{365.25}}} = 0$$

- $C_i$: Cash flow at date $i$ (Negative for purchase/invested amounts, Positive for current valuation).
- $d_i$: Date of transaction $i$.
- **Solver**: Implements the **Newton-Raphson Method**:
  $$r_{k+1} = r_k - \frac{\text{NPV}(r_k)}{\text{NPV}'(r_k)}$$
  iterating until $|\text{NPV}(r)| < 10^{-6}$ or maximum 100 iterations, with automatic bisection fallback if divergence occurs.

### 2.2 CAGR (Compound Annual Growth Rate)
For fixed-period or single-holding investments:
$$\text{CAGR} = \left(\frac{\text{Current Value}}{\text{Invested Amount}}\right)^{\frac{1}{t}} - 1$$
where $t$ is holding tenure in fractional years.

### 2.3 Benchmark Overlays (Nifty 50 & Gold Index)
- **Data Source**: Fetches historical benchmark prices from Yahoo Finance:
  - Nifty 50: `^NSEI`
  - Gold Price Index: `GC=F`
- **Scaling Formula**: Normalizes benchmark curves to start at the user's initial portfolio net worth $W_0$:
  $$\text{Scaled Benchmark}_t = W_0 \times \left(\frac{\text{Index Price}_t}{\text{Index Price}_0}\right)$$
- Optimized with Caffeine in-memory caching to eliminate redundant external calls.

---

## 3. Financial Health Score (0–100 Index)

The composite health score computes a weighted multi-pillar metric:

$$\text{Health Score} = 0.30 \times S_{\text{Debt}} + 0.25 \times S_{\text{Liquidity}} + 0.25 \times S_{\text{Diversification}} + 0.20 \times S_{\text{Emergency}}$$

1. **Debt Score ($S_{\text{Debt}}$)**: Scaled from Debt-to-Asset ratio (Optimal: $< 20\%$, Degrades to 0 at $> 60\%$).
2. **Liquidity Score ($S_{\text{Liquidity}}$)**: Evaluates liquid capital ratio ($\text{Liquid Assets} / \text{Net Worth}$).
3. **Diversification Score ($S_{\text{Diversification}}$)**: Penalizes single-asset category concentration above $50\%$.
4. **Emergency Runway Score ($S_{\text{Emergency}}$)**: Evaluates liquid fund coverage against 6 months of living expenses.

**Tier Ratings**:
- 85–100: **Excellent**
- 70–84: **Good**
- 50–69: **Fair**
- < 50: **Needs Attention**

**Gemini AI Integration**: The numerical scores are passed to Google Gemini 1.5 Flash to synthesize 3 context-aware, actionable improvement tips cached for 24 hours.
