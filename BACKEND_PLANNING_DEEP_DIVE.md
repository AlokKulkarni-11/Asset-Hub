# Backend Planning & Goals Deep Dive

This document covers AssetHub’s financial planning module: **Goal-Linked Portfolios**, **Liquidity Classification Engine**, **Emergency Fund Runway Tracker**, **Systematic Withdrawal Plan (SWP) Calculator**, and the **Inflation-Adjusted Retirement Corpus Calculator**.

---

## 1. Architecture Overview

The Planning module provides forward-looking wealth projection tools that link current portfolio holdings to future financial milestones.

### Key Components:
- `com.wealthmap.controller.GoalController`: REST endpoints (`/api/goals/**`) for creating and managing named financial goals.
- `com.wealthmap.controller.PlanningController`: REST endpoints (`/api/planning/**`) for liquidity analysis and emergency runway calculations.
- `com.wealthmap.service.GoalService`: Manages goal milestones and dynamic progress calculation based on tagged asset valuations.
- `com.wealthmap.service.PlanningService`: Classifies assets into liquid/illiquid tiers and computes survival runway.

---

## 2. Planning Features & Mathematics

### 2.1 Goal-Linked Portfolios
- Users define named milestone goals (Target Amount, Target Date, Category: Retirement, Real Estate, Education, Vacation, Custom).
- Assets are tagged to specific goals. Progress is calculated dynamically:
  $$\text{Goal Progress \%} = \left(\frac{\sum \text{Tagged Assets Current Value (INR)}}{\text{Target Amount}}\right) \times 100$$
  $$\text{Required Monthly Savings} = \frac{\text{Target Amount} - \text{Current Value}}{\text{Remaining Months to Target Date}}$$

### 2.2 Liquidity Classification & Emergency Fund Runway
- **Asset Liquidity Rules**:
  - **Liquid**: Stocks, Mutual Funds, Cryptocurrencies, Fixed Deposits, Cash.
  - **Illiquid**: Real Estate, Physical Gold, Unvested ESOPs/RSUs, Lock-in PPF/NPS.
- **Emergency Runway Formula**:
  $$\text{Emergency Runway (Months)} = \frac{\text{Total Liquid Assets (INR)}}{\text{Monthly Living Expenses (INR)}}$$
  - Surfaces warnings if runway is below the user's target buffer (default 6 months).

### 2.3 Systematic Withdrawal Plan (SWP) Calculator
- Projects month-by-month corpus depletion and growth:
  - Monthly return rate: $r_m = (1 + r_{\text{annual}})^{\frac{1}{12}} - 1$
  - Step-up withdrawal: Adjusted annually by inflation rate $i_{\text{inflation}}$
  - Capital gains tax: Optional tax rate deduction on withdrawal gains
  - Ledger generation: Outputs projected year-by-year ending balances and total withdrawn capital.

### 2.4 Inflation-Adjusted Retirement Corpus Calculator
- Computes target retirement corpus using the **4% Safe Withdrawal Rule**:
  $$\text{Annual Expense at Retirement} = \text{Current Annual Expenses} \times (1 + i_{\text{inflation}})^{\text{Years to Retirement}}$$
  $$\text{Target Retirement Corpus} = \text{Annual Expense at Retirement} \times 25$$
  $$\text{Retirement Readiness Gap} = \text{Target Corpus} - \text{Current Net Worth}$$
