# Backend Snapshots & Automation Deep Dive

This document covers AssetHub’s snapshot and background automation architecture: **Historical Net Worth Snapshots**, **Live Price Alerts**, **Maturity Reminders**, **Weekly/Monthly Email Digests**, and **Portfolio Rebalancing Nudges**.

---

## 1. Architecture Overview

AssetHub includes a background scheduling and historical time-series engine that captures daily portfolio states and executes automated notification workflows via Spring's scheduling framework and the Brevo HTTP API.

```
[Spring Scheduler (@Scheduled)]
            |
  +---------+---------+---------+---------+
  |                   |                   |                   |
[Daily Snapshot]  [Price Alert]   [Maturity Scan]    [Digest Runner]
  |                   |                   |                   |
Persist to DB    Evaluate Rules     Find items near     Generate Summary
(net_worth_hist) (stocks/gold)      maturity date       HTML Email
                      |                   |                   |
                      +---------+---------+                   |
                                |                             |
                    [Brevo HTTP API Delivery] <---------------+
```

### Key Components:
- `com.wealthmap.entity.Snapshot`: Stores historical timestamp, total asset value, total liability value, and computed net worth.
- `com.wealthmap.controller.SnapshotController`: REST endpoints (`/api/snapshots/**`) for fetching historical time-series data with time-range filtering (`1M`, `3M`, `6M`, `1Y`, `ALL`).
- `com.wealthmap.controller.AlertController`: REST endpoints (`/api/alerts/**`) for user price alerts and notification preferences.
- `com.wealthmap.service.AlertService`: Scans live market prices against user-defined alert thresholds.
- `com.wealthmap.service.BrevoEmailService`: Sends transactional and scheduled notification emails via Brevo HTTP API.

---

## 2. Background Automation Workflows

### 2.1 Daily Net Worth Snapshotting
- Executes every midnight via `@Scheduled(cron = "0 0 0 * * *")`.
- Calculates the user's latest total asset valuation in INR, total liabilities in INR, and true net worth.
- Persists a new row to `net_worth_snapshots`, enabling the multi-line historical trend chart on the dashboard.

### 2.2 Live Price Threshold Alerts
- Scans user-configured price alerts every 5 minutes (`automation.price-alert.scan-ms=300000`).
- Compares live ticker prices (from Yahoo Finance / AMFI / CoinGecko) against target high/low thresholds.
- When triggered, creates an in-app notification and delivers a Brevo email alert, marking the alert as triggered.

### 2.3 Upcoming Maturity Reminders
- Scans all Fixed Deposits, Bonds, and Loans daily at 8:00 AM (`automation.maturity.scan-cron=0 0 8 * * *`).
- Flags instruments maturing within the configured reminder window (default 7 days).
- Dispatches formatted email notices with principal amount, bank name, estimated maturity payout, and days remaining.

### 2.4 Weekly & Monthly Portfolio Digest Emails
- **Weekly Digest**: Runs every Monday at 9:00 AM (`automation.digest.weekly-cron=0 0 9 * * MON`).
- **Monthly Digest**: Runs on the 1st of every month at 9:00 AM (`automation.digest.monthly-cron=0 0 9 1 * *`).
- Synthesizes weekly/monthly net worth changes ($\Delta W$), top gaining/losing assets, upcoming maturities, and debt status into an email report.

### 2.5 Target Allocation & Drift Rebalancing Nudges
- Compares current asset allocation (Equity vs. Debt vs. Gold vs. Real Estate) against the user's target percentages.
- Triggers a dashboard rebalancing nudge whenever category drift exceeds the threshold ($\pm 5\%$).
