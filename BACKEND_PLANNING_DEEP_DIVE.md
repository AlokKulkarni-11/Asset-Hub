# Backend Planning Deep Dive

This module covers emergency fund tracking, SIP tracking, and retirement planning. It sits on top of asset and liability data, which means it is mostly a calculation and aggregation layer that turns raw holdings into planning advice.

## 1. Architecture Overview

`PlanningService` is the main brain of this module. It reads the user, pulls asset and liability values through `AnalyticsService` and `LiabilityService`, and computes emergency-fund coverage, SIP tracker state, and retirement readiness. The controller just exposes these calculations over HTTP. The planning module is important because it translates portfolio data into actionable financial goals.

Top-level modules:
- `controller`: HTTP endpoints for planning features.
- `service`: business logic for emergency funds, SIPs, and retirement.
- `entity`: persistence models for emergency funds and SIP trackers.
- `dto`: request and response shapes for planning screens.
- `repository`: database access for the planning entities.
- `util`: liquidity classification used by emergency fund calculations.

Typical planning flow:
1. Frontend loads the planning page.
2. Controller receives request with authenticated email.
3. Service resolves the user.
4. Service gathers asset and liability data.
5. Service computes a planning result.
6. Result is returned as a response DTO.
7. Frontend renders progress, balances, and recommendations.

## 2. Feature-by-Feature Breakdown

Planning features:
- Emergency fund configuration and progress
- SIP tracker CRUD
- Retirement corpus projection

### Feature: Emergency fund

**What it does**
Stores monthly expenses and target runway months, then shows how much liquid wealth the user already has toward that goal.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/PlanningController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/PlanningService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/EmergencyFund.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/EmergencyFundRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/EmergencyFundResponse.java`
- `wealthmap-backend/src/main/java/com/wealthmap/util/LiquidityHelper.java`

**Step-by-step trace**
1. Controller receives `GET` or `POST` for emergency fund.
2. `PlanningService.saveEmergencyFund(...)` creates or updates the record.
3. `getEmergencyFund(...)` loads current assets through `AnalyticsService`.
4. `LiquidityHelper.calculateLiquidTotal(...)` sums liquid assets.
5. Target corpus and progress percentage are computed.

**State management**
- User settings persist in `EmergencyFund`.
- Current liquid wealth is computed on demand.

**Validation & error handling**
- If no record exists, the service returns default target months and zero corpus.
- If target months are zero or missing, the service keeps the default value.

**Edge cases**
- Liquid classification is heuristic, not market-driven.
- Fixed deposits are considered liquid only under the helper’s rules.

### Feature: SIP tracker

**What it does**
Tracks planned monthly SIP investments for mutual funds.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/PlanningController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/PlanningService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/SipTracker.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/SipTrackerRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/SipTrackerResponse.java`

**Step-by-step trace**
1. Controller receives add/list/delete requests.
2. `PlanningService.addSip(...)` stores a new SIP tracker.
3. `getAllSipsForUser(...)` returns the user’s trackers.
4. `deleteSip(...)` verifies ownership and deletes the row.

**State management**
- SIP config is stored in the DB.
- The current UI list comes from a service query.

**Validation & error handling**
- Default SIP day falls back to 10 if not supplied.
- Ownership is checked before delete.

**Edge cases**
- The module does not validate that the linked mutual fund asset still exists.

### Feature: Retirement planning

**What it does**
Projects retirement readiness by comparing current net worth growth against an inflation-adjusted required corpus.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/PlanningController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/PlanningService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/RetirementRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/RetirementResponse.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/AnalyticsService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/LiabilityService.java`

**Step-by-step trace**
1. Controller receives current age, retirement age, inflation, return assumptions, and target monthly spend.
2. Service loads assets and liabilities.
3. Current net worth is computed.
4. Expense is inflated over the years to retirement.
5. Required corpus is estimated using a 4% withdrawal-style rule.
6. Projected net worth is calculated from expected return rate.
7. Result is mapped into `RetirementResponse`.

**State management**
- Inputs are request-scoped assumptions.
- Output is a pure calculation result.

**Validation & error handling**
- Missing monthly expense defaults to 50,000.
- Years to retirement are clamped to at least 1.

**Edge cases**
- The model is intentionally simplified and does not account for taxes, drawdown sequencing, or changing contributions.

## 3. Library & Pattern Justification

- **LiquidityHelper**
  - Solves the app’s need to distinguish liquid from illiquid assets.
  - Without it, the emergency-fund feature would need duplicated logic.
  - Alternative: tag liquidity directly on assets. Tradeoff: simpler reads, but more manual maintenance.

- **Planning calculations in service code**
  - Solves the need to keep financial math on the backend.
  - Without it, the frontend could diverge from backend truth.
  - Alternative: shared library used by both client and server. Tradeoff: more consistency, more build complexity.

## 4. Database & Data Model

Tables involved:
- `emergency_funds`
- `sip_trackers`

Relationships:
- `EmergencyFund` belongs one-to-one with `User`.
- `SipTracker` belongs many-to-one with `User`.

Integrity reliance:
- Planning logic assumes asset values are already correct.
- SIP tracker does not enforce foreign-key validation for the linked mutual fund asset in the code shown.

## 5. Security & Access Notes

Both endpoints and ownership are protected by the normal auth flow. The controller reads the authenticated email, the service resolves the user, and the repositories only return data for that user. That means someone cannot fetch another user’s emergency fund or SIP list just by guessing an ID.

Potential gaps:
- Retirement planning uses simplified assumptions, so an interviewer may ask about realism.
- The module does not expose history or contribution tracking for SIP execution itself, only a tracker.

## 6. Likely Interview Questions

- **Why is liquidity a helper instead of a field on the asset entity?**
  - Because liquidity is a derived classification, not the source data itself.

- **Why compute emergency-fund progress from live asset values?**
  - Because the readiness number should reflect what the user could actually access now.

- **Why is retirement projection so simplified?**
  - Because it gives a fast planning estimate, not a full actuarial model.

