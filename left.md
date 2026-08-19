# Remaining Features & Future Enhancements - Asset Hub

This document tracks all potential future features, architectural improvements, and backlog items for Asset Hub beyond Phase 3.

---

## 🚀 Performance & Infrastructure
- **Redis Caching Layer:** Integrate Redis for distributed multi-node caching of Yahoo Finance, AMFI, and CoinGecko financial APIs under heavy user traffic.
- **Background Job Scheduler:** Automated daily cron jobs to capture net worth snapshots at midnight for every user.
- **Database Indexing:** Further optimize query indexes on `user_id` and `family_group_id` for ultra-fast dashboard loads.

---

## 📊 Reports & Data Export
- **CSV & PDF Portfolio Export:** Allow users to download full portfolio summaries, asset details, and liability repayment schedules for tax filings.
- **Tax Harvesting Insights:** STCG / LTCG (Short-Term vs. Long-Term Capital Gains) estimation and tax harvesting suggestions.

---

## 🔔 Notifications & Alerts
- **Maturity & Payoff Alerts:** Email and browser push notifications for upcoming Fixed Deposit maturity dates and Loan EMI due dates.
- **Threshold Alerts:** Notifications when portfolio concentration exceeds safety thresholds or major market price swings occur.

---

## 🌐 Multi-Currency & Advanced Features
- **Multi-Currency Support:** Ability to track foreign stocks and assets in USD, EUR, GBP with live Forex INR conversion.
- **Granular Family Permissions:** Detailed permissions per family group member (e.g. read-only views for dependents).
