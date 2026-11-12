# AssetHub (WealthMap) — Master Architecture & Technical Deep Dive Guide

A complete, exhaustive technical guide to the architecture, financial engines, security, data models, external integrations, and frontend systems of **AssetHub**.

---

## Table of Contents
1. [Executive Summary & System Philosophy](#1-executive-summary--system-philosophy)
2. [High-Level System Architecture & Flow](#2-high-level-system-architecture--flow)
3. [Database Design & Polymorphic Data Model](#3-database-design--polymorphic-data-model)
4. [Financial Mathematics & Valuation Engines](#4-financial-mathematics--valuation-engines)
5. [Real-Time Market Integrations & Third-Party APIs](#5-real-time-market-integrations--third-party-apis)
6. [Security, Auth & Role-Based Access Control](#6-security-auth--role-based-access-control)
7. [Frontend Architecture & Visual Suite](#7-frontend-architecture--visual-suite)
8. [Automations, Schedulers & Alert Engine](#8-automations-schedulers--alert-engine)
9. [Production Deployment & Environment Configuration](#9-production-deployment--environment-configuration)
10. [Deep Dive Module Index](#10-deep-dive-module-index)

---

## 1. Executive Summary & System Philosophy

**AssetHub** is an institutional-grade personal wealth management and portfolio analytics platform. Unlike simple spreadsheet-style ledger apps, AssetHub acts as an active financial operating system:

1. **Heterogeneous Multi-Asset Tracking**: Unifies 8+ asset classes (Stocks, Mutual Funds, Physical Gold, Fixed Deposits, Bonds/PPF/NPS, ESOPs/RSUs, Cryptocurrencies, and Real Estate) along with multi-category liabilities.
2. **Deterministic Math First, AI Second**: All calculations (True Net Worth, FD compounding, loan amortization, XIRR, CAGR, forex conversions) are computed deterministically in Java without relying on AI hallucinations or unversioned database triggers.
3. **Grounded AI Intelligence**: Google Gemini 1.5 Flash provides natural language queries (**Hub Mate**), portfolio briefings, and OCR receipt extraction grounded strictly in verified database figures.
4. **Multi-Tenant Family Collaboration**: Provides per-member wealth rollups, granular role-based permissions (`OWNER`, `EDITOR`, `VIEWER`), shared family milestone goals, and system audit logging.

---

## 2. High-Level System Architecture & Flow

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT TIER                                      |
|  React 19 + TypeScript + Vite + TailwindCSS + Zustand + TanStack Query + Recharts |
+-----------------------------------------------------------------------------------+
           |                                                               |
    (REST API via JWT)                                          (OAuth2 Browser Redirect)
           |                                                               |
+-------------------------------------------------------------+   +-----------------+
|                        BACKEND TIER                         |   |  Google OAuth   |
|                 Java 17 + Spring Boot 3.2                   |   | (drive.file /   |
|                                                             |   |    profile)     |
| +---------------------------------------------------------+ |   +-----------------+
| | Controllers: Auth, Asset, Liability, Analytics, Goal,   | |
| |              Family, Snapshot, Alert, Document, Health  | |
| +---------------------------------------------------------+ |
| | Security: JwtAuthFilter, UserDetailsService, TfaService | |
| +---------------------------------------------------------+ |
| | Services: Valuation Engines, XIRR/CAGR Solvers, Forex,  | |
| |           Amortization Engine, Schedulers, Brevo Email  | |
| +---------------------------------------------------------+ |
| | Repositories: Spring Data JPA (JOINED Inheritance)      | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
           |                                          |
   (JDBC via HikariCP)                     (Outbound REST HTTPS)
           |                                          |
+---------------------+       +---------------------------------------------+
|    DATABASE TIER    |       |             EXTERNAL INTEGRATIONS           |
| PostgreSQL/Supabase |       | - Yahoo Finance (Equities, Forex, Indices)  |
| (aws-1 Pooler IPv4) |       | - AMFI India (Mutual Funds NAV)             |
+---------------------+       | - CoinGecko (Cryptocurrencies)              |
                              | - Brevo API (Transactional Emails & Alerts) |
                              | - Google Gemini 1.5 (AI Copilot & Vision)   |
                              | - Google Drive API (Document Vault)         |
                              +---------------------------------------------+
```

---

## 3. Database Design & Polymorphic Data Model

AssetHub utilizes PostgreSQL with JPA **`InheritanceType.JOINED`**. This guarantees that common portfolio queries (such as listing all assets or computing total invested capital) query the base table efficiently, while subtype-specific attributes live in dedicated normalized tables.

### 3.1 Asset Entity Hierarchy
- **Base Table (`assets`)**: `id`, `user_id`, `family_group_id`, `family_member_id`, `name`, `asset_type`, `purchase_date`, `currency`, `nominee_name`, `nominee_relationship`, `notes`, `created_at`, `updated_at`.
- **Subtype Tables**:
  - `stocks`: `ticker`, `quantity`, `buy_price`, `exchange`.
  - `mutual_funds`: `scheme_code`, `scheme_name`, `units`, `nav_at_purchase`.
  - `gold_items`: `grams`, `purity` (`K24`, `K22`, `K18`), `making_charges`.
  - `fixed_deposits`: `bank_name`, `principal_amount`, `interest_rate`, `start_date`, `maturity_date`, `compounding_frequency`.
  - `real_estate`: `property_type`, `location`, `estimated_market_value`.
  - `cryptos`: `symbol`, `quantity`, `buy_price_usd`.
  - `bonds`: `bond_type` (`GOVERNMENT_BOND`, `CORPORATE_BOND`, `PPF`, `NPS`, `SGB`), `issuer`, `face_value`, `coupon_rate`, `maturity_date`.
  - `esop_rsus`: `company_name`, `plan_type`, `total_shares`, `vested_shares`, `strike_price`, `market_ticker`.

### 3.2 Liability Entity Hierarchy
- **Base Table (`liabilities`)**: `id`, `user_id`, `family_group_id`, `name`, `liability_type`, `lender_name`, `principal_amount`, `outstanding_balance`, `interest_rate`, `tenure_months`, `emi_amount`, `start_date`, `currency`, `notes`.
- **Subtypes**: `HOME_LOAN`, `PERSONAL_LOAN`, `EDUCATION_LOAN`, `VEHICLE_LOAN`, `CREDIT_CARD`, `OTHER`.

---

## 4. Financial Mathematics & Valuation Engines

### 4.1 True Net Worth & Debt Ratio
$$\text{True Net Worth} = \sum \text{Current Asset Values (in INR)} - \sum \text{Outstanding Liabilities (in INR)}$$
$$\text{Debt-to-Asset Ratio} = \left(\frac{\text{Total Liabilities}}{\text{Total Assets}}\right) \times 100$$

### 4.2 Fixed Deposit Accrued Compound Interest
$$A = P \times \left(1 + \frac{r}{n}\right)^{n \times t}$$
- $P$: Principal, $r$: Annual rate (decimal), $n$: Compounding frequency (Quarterly = 4), $t$: Elapsed fractional years.

### 4.3 Physical Gold Valuation
$$\text{Price/Gram (24K)} = \left(\frac{\text{Spot Gold USD/oz}}{31.1035}\right) \times \text{USDINR Rate} \times (1 + \text{Customs/Market Premium})$$
$$\text{Asset Value} = \text{Grams} \times \text{Price/Gram (24K)} \times \text{Purity Ratio (24K: 1.0, 22K: 0.916, 18K: 0.75)}$$

### 4.4 Reducing-Balance Loan Amortization
$$\text{Monthly EMI} = P \times \frac{i \times (1 + i)^N}{(1 + i)^N - 1} \quad \text{where } i = \frac{r}{12}$$
Iterates monthly steps to calculate exact interest-vs-principal splits and project the zero-balance payoff date.

### 4.5 XIRR (Extended Internal Rate of Return)
Solves for discount rate $r$ where Net Present Value of irregular cash flows equals zero:
$$\text{NPV}(r) = \sum_{i=1}^n \frac{C_i}{(1 + r)^{\frac{d_i - d_1}{365.25}}} = 0$$
using the **Newton-Raphson Solver** ($r_{k+1} = r_k - \frac{\text{NPV}(r_k)}{\text{NPV}'(r_k)}$).

### 4.6 Multi-Currency Real-Time Forex Conversion
- Supported currencies: `INR`, `USD`, `EUR`, `GBP`, `AED`, `SGD`, `CAD`, `AUD`, `JPY`, `CHF`.
- Live rates fetched from Yahoo Finance with Caffeine cache and fallback rate matrix.

---

## 5. Real-Time Market Integrations & Third-Party APIs

| Provider | Purpose | Key Endpoints / Methods |
| :--- | :--- | :--- |
| **Yahoo Finance** | Live Equities, Forex pairs (`USDINR=X`), Benchmark Indices (`^NSEI`, `GC=F`) | `query1.finance.yahoo.com/v8/finance/chart` |
| **AMFI India** | Mutual Fund Daily NAVs | `portal.amfiindia.com/DownloadNAVHistoryReport_pd.aspx` |
| **CoinGecko** | Cryptocurrency spot prices | `api.coingecko.com/api/v3/simple/price` |
| **Brevo HTTP API** | Transactional OTPs, price alerts, maturity notices, weekly digests | `api.brevo.com/v3/smtp/email` |
| **Google Gemini 1.5** | AI Copilot (**Hub Mate**), health score reasoning, document OCR | `generativelanguage.googleapis.com/v1beta/models` |
| **Google Drive API** | User document vault attachments (`drive.file` scope) | `www.googleapis.com/drive/v3/files` |

---

## 6. Security, Auth & Role-Based Access Control

1. **Stateless JWT**: HMAC-SHA256 tokens issued upon login with claims for user ID and email.
2. **Two-Factor Authentication (TOTP 2FA)**: RFC 6238 standard TOTP secrets generated with QR codes, accompanied by 8 single-use recovery backup codes.
3. **Google OAuth 2.0 with Dynamic Client ID**: Endpoint `GET /api/auth/google/client-id` serves backend-configured OAuth client IDs dynamically without exposing secrets.
4. **Family RBAC Permissions**:
   - `OWNER`: Full management, invites, role assignments, deletions.
   - `EDITOR`: Add/edit/delete assets, debts, and goals.
   - `VIEWER`: Read-only access (write methods blocked at Spring Security filter chain).
5. **Production Hardening**: Stack traces disabled (`server.error.include-stacktrace=never`), frontend source maps disabled, parameterized JPA queries preventing SQL injection.

---

## 7. Frontend Architecture & Visual Suite

- **Customizable Drag-and-Drop Dashboard**: Modular widget cards persisted in `localStorage` with a "Customize Cards" visibility toggle modal.
- **Global Command Center (`Cmd/Ctrl + K`)**: Keyboard-navigable modal for quick actions and instant holdings search.
- **Responsive Navigation Dual-Pattern**: Mobile persistent bottom navigation bar ([`MobileNav.tsx`](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/wealthmap-frontend/src/components/layout/MobileNav.tsx)) paired with a desktop hover sidebar ([`Sidebar.tsx`](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/wealthmap-frontend/src/components/layout/Sidebar.tsx)).
- **Financial Statements Export Modal**: Multi-section UTF-8 CSV generator and printable A4 PDF statement generator with print media stylesheets.
- **Floating Action Hub & Hub Mate**: Quick speed-dial creation tools paired with a floating conversational AI assistant.

---

## 8. Automations, Schedulers & Alert Engine

- **Daily Snapshotting**: Persists net worth snapshots every midnight (`0 0 0 * * *`) for multi-line historical trendlines.
- **Live Price Alerts**: Polls stock/gold prices every 5 minutes (`300000 ms`) and triggers Brevo email alerts.
- **Maturity Reminders**: Daily 8:00 AM scan (`0 0 8 * * *`) notifying users of FDs, bonds, and loans maturing within 7 days.
- **Weekly & Monthly Digests**: Scheduled Brevo summary emails delivered every Monday and on the 1st of each month.
- **Drift Rebalancing Nudges**: Surfaces alerts when asset allocation drifts $\pm 5\%$ from target percentages.

---

## 9. Production Deployment & Environment Configuration

### Backend Environment Variables (Render / Docker)
- `PORT`: Dynamic port assigned by host (defaults to `8080`).
- `SPRING_DATASOURCE_URL`: Supabase IPv4 connection pooler JDBC URL.
- `SPRING_DATASOURCE_USERNAME` / `SPRING_DATASOURCE_PASSWORD`: Database credentials.
- `JWT_SECRET`: 256-bit Base64 signing key.
- `BREVO_API_KEY` & `BREVO_SENDER_EMAIL`: Email alert credentials.
- `GEMINI_API_KEY`: Google Gemini AI key.
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials.

### Frontend Environment Variables (Vercel)
- `VITE_API_URL`: Full URL to deployed backend (`https://<backend-domain>/api`).

---

## 10. Deep Dive Module Index

For detailed step-by-step code traces, refer to the individual deep dive documents:
- [Backend Auth Deep Dive](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/BACKEND_AUTH_DEEP_DIVE.md)
- [Backend Assets Deep Dive](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/BACKEND_ASSETS_DEEP_DIVE.md)
- [Backend Liabilities Deep Dive](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/BACKEND_LIABILITIES_DEEP_DIVE.md)
- [Backend Analytics Deep Dive](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/BACKEND_ANALYTICS_DEEP_DIVE.md)
- [Backend Family Deep Dive](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/BACKEND_FAMILY_DEEP_DIVE.md)
- [Backend Planning Deep Dive](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/BACKEND_PLANNING_DEEP_DIVE.md)
- [Backend Snapshots & Automation Deep Dive](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/BACKEND_SNAPSHOTS_DEEP_DIVE.md)
- [Frontend UI Deep Dive](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/FRONTEND_DEEP_DIVE.md)
