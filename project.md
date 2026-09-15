# Asset Hub

Asset Hub is a premium, modern, and comprehensive personal wealth tracking application designed to give users absolute clarity over their financial net worth.

## The Idea
Most net-worth trackers are simple ledgers where you just type in a number. Asset Hub is built to be a smart, dynamic portfolio manager. It tracks heterogeneous asset classes (Physical Gold, Fixed Deposits, Stocks, Mutual Funds, Real Estate) and dynamically calculates their real-time current market value using live integrations and exact financial mathematics (like accrued compound interest).

## Tech Stack
**Frontend (Client-Side)**
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** TailwindCSS (Premium Light Blue theme with improved contrast and readability)
- **State Management:** Zustand (Auth) + React Query (Server State/Caching)
- **Routing:** React Router v7
- **Forms:** React Hook Form + Zod (Validation)
- **Icons:** Lucide React
- **Data Visualization:** Recharts

**Backend (Server-Side)**
- **Framework:** Java 17 + Spring Boot 3.2
- **Database:** PostgreSQL (Supabase) with Spring Data JPA & Hibernate
- **Security:** Spring Security + Stateless JWT Authentication + Two-Factor Authentication (TOTP) + Family Role-Based Access Control (RBAC) + Row Level Security (RLS)
- **Architecture:** Controller-Service-Repository pattern with Polymorphic DTOs for heterogeneous assets and liabilities
- **Inheritance Strategy:** JOINED table inheritance for asset and liability subtypes
- **Integrations:** Yahoo Finance API (Live Stock & Gold prices), AMFI India API (Live Mutual Fund NAV), CoinGecko API (Live Cryptocurrency prices), Brevo API (Email Invites, OTPs, and automation emails), QR Server API (2FA TOTP onboarding)

## What is Implemented

### Core Features
- **Authentication & Security:** Secure user registration, login, JWT-based session management, and database-level RLS policies to strictly isolate user data.
- **Polymorphic Data Models:** A unified `Asset` base table extending out to specialized tables using JOINED inheritance strategy:
  - `gold_items` - Physical gold tracking with purity and weight
  - `fixed_deposits` - FDs with compound interest calculations
  - `stocks` - Stock holdings with live price updates
  - `mutual_funds` - Mutual fund investments with NAV tracking
  - `real_estate` - Property assets with estimated valuations

### Real-Time Pricing Engine
- **Stocks:** Live ticker fetching from Yahoo Finance with typeahead search
- **Mutual Funds:** Live NAV fetching with smart search (50+ results)
- **Gold:** Live Spot Gold (USD/Ounce) fetching, Forex INR conversion, and physical market premium logic
- **Fixed Deposits:** Dynamic accrual using exact compound interest formulas based on elapsed days
- **Real Estate:** User-provided estimated current value tracking

### User Interface
- **Enhanced Dropdowns:** Improved stock and mutual fund search dropdowns with dark text, wrapped labels, hover tooltips, and exchange/code badges
- **Dashboard:** Light blue glass-styled grid displaying individual assets with invested amounts, real-time current values, and net gain/loss percentages
- **Data Visualization:** Recharts implementations including:
  - Historical Net Worth Line Chart with dynamic time-range filtering (1M, 3M, 6M, 1Y, ALL)
  - Asset Allocation Pie Chart
- **Favicon:** Custom logo displayed in browser tabs, bookmarks, and mobile home screens

### Asset Management
- **Full CRUD Operations:** Add, view, edit, and delete assets across all asset types
- **Smart Forms:** Type-ahead search for stocks and mutual funds with debounced API calls
- **Validation:** Zod schema validation on both frontend and backend
- **Edit Modals:** Pre-filled edit forms with proper date formatting

### Family Features
- **Family Groups:** Track assets owned by different family members under one master family dashboard
- **Data Isolation:** Family assets completely separated from personal assets
- **Email Invitations:** Asynchronous email invitations with secure join links via Brevo API

### Mobile & Accessibility
- **Mobile Responsiveness:** Fully adaptive UI with desktop sidebar and dedicated Mobile Bottom Navigation Bar
- **Hamburger Menu:** Collapsible menu for smaller screens
- **Date Pickers:** Dark color scheme for better visibility

### Additional Features
- **Maturities Page:** Dedicated page to track upcoming Fixed Deposit maturity dates with countdown timers
- **Delete Confirmation:** Custom confirmation UI before asset deletion
- **Error Handling:** Comprehensive error messages and loading states
- **Query Caching:** React Query for efficient data fetching and cache management

### Phase 1: Liabilities, True Net Worth & Crypto (Completed)
- **Liabilities Module:** Polymorphic liability architecture (JOINED table inheritance) supporting home loans, personal loans, education loans, credit card debt, vehicle loans, and other liabilities with complete CRUD capabilities.
- **EMI/Amortization Engine:** Exact reducing-balance financial math engine calculating monthly interest splits, principal payouts, total interest, and projecting final payoff dates.
- **Net Worth Calculations:** True Net Worth metric (Assets - Liabilities) displayed as the hero dashboard figure, paired with a Debt-to-Asset ratio.
- **Historical Chart Expansion:** Dynamic stacked/multi-line chart displaying Assets vs. Liabilities vs. Net Worth over time.
- **Cryptocurrency Support:** Integrated CoinGecko free API for live-pricing with typeahead search for crypto assets (e.g. BTC, ETH).

### Phase 2: Portfolio Analytics (Completed)
- **XIRR & CAGR Math Engine:** Computes exact Internal Rate of Return (XIRR) via Newton-Raphson solver and Compound Annual Growth Rate (CAGR) per individual asset and for the portfolio as a whole, correctly accounting for cash flow timings.
- **Asset Concentration & Diversification Warnings:** Displays warning alerts on the dashboard when concentration in a single asset class exceeds 50%.
- **Benchmark Comparisons:** Scaled benchmark data overlays (Nifty 50 Index and Gold Price Index) fetched live from the Yahoo Finance API, normalized to the user's starting Net Worth, and optimized with Caffeine cache.
- **Performance Callouts:** Highlight cards automatically surfacing the best and worst performing assets on the dashboard.
- **What-If Net Worth Simulator:** Interactive slider widget to test hypothetical percentage shifts in asset classes and view immediate net worth projections.

### Phase 3: Goals & Planning (Completed)
- **Liquidity Classification & Split:** Automated liquid vs illiquid asset classification with a dedicated breakdown card on the Dashboard.
- **Emergency Fund Tracker:** Configurable monthly living expenses and target runway months (default 6M) tracked against total liquid assets.
- **Goal-Linked Portfolios:** Create named financial milestone goals (e.g. Retirement, House Purchase) with target amounts and dates, and tag portfolio assets to track progress on the dedicated `/goals` page.
- **SWP Calculator:** Systematic Withdrawal Plan calculator integrated directly as a tab inside the `/goals` section. Features real-time reactive compounding calculations (with manual calculation buttons removed for instant updates), optional capital gains tax rate projections (controlled by checkbox), compulsory inflation rate step-ups, summary cards, cumulative withdrawal vs. growth Recharts line charts, and a paginated growth table ledger.
- **Mobile Navigation & Usability:** Refined mobile bottom navigation bar by placing Goals after Liabilities and removing Profile. Resolved mobile overlay scroll-overflow blocks on all modal forms (Liability & heterogeneous Asset forms) by capping height at 70vh and adding bottom padding offsets. Disabled mouse scroll-wheel value alterations on all numeric input fields. Added the project logo and name to the top navigation header for mobile viewports only.
- **Retirement Corpus Calculator:** Inflation-adjusted compounding calculator projecting retirement readiness reactively on the client side in real-time. Supports using either calculated net worth or a custom net worth input (controlled by checkbox), and explicitly specifies the assumed 25-year post-retirement coverage timeline (based on the 4% safe annual withdrawal rule).
- **Sticky Net Worth Header:** Added a real-time Net Worth stat display box in the `/goals` page header, making the user's overall net worth visible across all child planning sections/tabs.

### Phase 4: Automation & Family Rollups (Completed)
- **Price Alerts:** Users can create live price thresholds for stocks, mutual funds, and gold, with scheduled polling that triggers Brevo email alerts and in-app notifications when thresholds are crossed.
- **Maturity Reminders:** Fixed-deposit and loan payoff reminders are sent X days before maturity using the Brevo integration, backed by scheduled jobs and notification deduplication.
- **Weekly/Monthly Digest:** Automated Brevo digest emails summarize net worth change, top movers, and upcoming maturities on weekly and monthly schedules.
- **Rebalancing Nudges:** Target allocation tracking compares current holdings against user-defined equity/debt/gold targets and surfaces a dashboard nudge when drift exceeds the configured threshold.
- **Scheduled Job Infrastructure:** Spring scheduling is enabled application-wide and powers recurring alert, reminder, and digest workflows.
- **Master Family Rollup Dashboard:** Family groups include a per-member net worth rollup view with pie and bar chart breakdowns, calculating RLS-aware aggregations for assets, liabilities, and contribution share.

### Phase 5: Family Collaboration & Security Hardening (Completed)
- **Nominee/Beneficiary Tracking:** Added nominee name and relationship tracking per asset, with full integration inside Zod validation schemas, add/edit modals, and detailed individual asset card displays.
- **Shared Family Goals:** Extended the milestone planning system to support family-wide targets (e.g. "Family House Fund") where multiple members tag assets to pool progress. Progress tracking aggregates assets owned by all family members, and shared goals are rendered as dynamic visual cards on the family dashboard with a direct "+ Create / Manage Goals" action trigger.
- **Permission Tiers for Family Groups:** Integrated role-based access control (Owner, Editor, Viewer). The Owner can invite, promote, and demote roles directly via interactive UI role selectors (with automatic fallback/repair for legacy groups). Viewers are restricted from making changes, with write actions (POST, PUT, DELETE) blocked at the Spring Security and API layer, and action/edit buttons hidden or disabled on the frontend.
- **Two-Factor Authentication (2FA):** Implemented TOTP second-stage security with recovery codes using the `dev.samstevens.totp` library. Login triggers temporary pending tokens if 2FA is active, prompting a secure verification overlay. The Profile page features a step-by-step setup wizard displaying a QR code and raw key, with the capability to download recovery codes and disable 2FA with verification.
- **Audit Log Trail:** Built an automatic event logging service tracing asset, liability, and membership modifications (who changed what and when). Exposed the trail to the frontend Family page as a responsive Activity Table.
- **UI & Infrastructure Enhancements:** Standardized Indian Rupee (`IndianRupee`) branding across member rollups, resolved port conflicts, and configured the Supabase IPv4 connection pooler (`aws-1-ap-south-1.pooler.supabase.com`) in `application.properties` for seamless PostgreSQL connectivity on Windows without IPv6 network dependencies.

### Phase 7: UX Enhancements & Advanced Asset Types (Completed)
- **Command Palette (`Cmd/Ctrl+K` & Mobile Header Trigger):** Built a searchable, keyboard-navigable command center modal (`↑`/`↓`/`↵`/`Esc`) for instantaneous actions ("Add Asset", "Add Bond / PPF", "Add ESOP / RSU", "Add Liability", navigation to any page or calculator) and live asset holdings search with direct navigation.
- **Widget-Based Customizable Dashboard:** Converted dashboard sections into modular, draggable, and reorderable cards (Key Wealth Metrics, Historical Net Worth Trend with Nifty 50 & Gold Index benchmarks, Asset Allocation Donut, Performance Highlights, What-If Simulator, Price Alerts & Rebalancing, and Upcoming Maturities). Features intuitive drag-and-drop handles, a "Customize Cards" modal to toggle card visibility (show/hide) or reset order, with layout preferences persisted in `localStorage` per user.
- **PWA (Progressive Web App) Support:** Added `manifest.json`, Service Worker (`sw.js`) with cache-first static shell and network-first API caching (providing an offline shell with fallback portfolio inspections), browser installation banner/prompt, and live offline network detection banners.
- **Bonds & Debentures Asset Subtype:** Implemented polymorphic entity hierarchy (`bonds` table via `JOINED` inheritance) supporting Government Bonds, Corporate Bonds, PPF, NPS, Sovereign Gold Bonds (SGB), and Other Debentures. Features compounding/simple interest accrual, SGB gold price tracking with 2.5% annual coupon math, maturity tracking, and nominee integration.
- **ESOPs & RSUs Equity Tracking:** Implemented polymorphic entity hierarchy (`esop_rsus` table via `JOINED` inheritance) tracking corporate equity grants, grant dates, vesting schedules, total vs. vested quantities, strike price vs. live Yahoo Finance market ticker prices, and explicit vested vs. unvested value separation.

### Phase 8: Multi-Currency & Foreign Asset Support with Live Forex Conversion (Completed)
- **Shared Forex Conversion Engine (`CurrencyConversionService`):** Generalised and consolidated multi-currency conversion logic across all asset classes and pricing providers. Queries real-time forex exchange rates from Yahoo Finance (`USDINR=X`, `EURINR=X`, `GBPINR=X`, `AEDINR=X`, etc.) with Caffeine caching (`@Cacheable("forexRates")`) and comprehensive offline fallback exchange rates.
- **Foreign Asset Tracking Across All Asset Types:** Allows any asset (US/foreign Stocks, Real Estate, Cryptocurrencies, Bonds/Debentures, ESOPs/RSUs, Fixed Deposits, Gold, Mutual Funds) to be recorded in their native currency (`USD`, `EUR`, `GBP`, `AED`, `SGD`, `CAD`, `AUD`, `JPY`, `CHF`, or `INR`).
- **Live Forex Conversion & Rollup Integrity:** All user portfolio statistics, Net Worth calculations, Historical Net Worth Trends, XIRR/CAGR metrics, emergency fund runways, goal milestone tracking, and asset allocation distributions seamlessly roll up in converted Indian Rupees (`INR`) while preserving original foreign currency quantities and purchase valuations.
- **Dual Display on Asset Cards:** Individual asset cards display the original currency value (e.g., `$10,000.00 USD`), original invested amounts, and live forex conversion rates (`1 USD = ₹83.95`) alongside the converted INR values (`₹8,39,500`), complete with dynamic foreign currency badges.
- **Forex REST API Endpoints:** Dedicated `/api/forex/rates`, `/api/forex/rate`, and `/api/forex/convert` endpoints exposing live and cached FX pairs.
- **Interactive UI Components (`CurrencySelect`):** Integrated reusable country flag/symbol currency selectors across all asset creation and editing forms with auto-currency detection for foreign stock ticker symbols.

### Export & Financial Reporting (Completed)
- **CSV Spreadsheet Export (`exportToCsv`):** Client-side generator creating UTF-8 compliant (`\uFEFF` BOM) CSV files compatible with Microsoft Excel, Google Sheets, Apple Numbers, and tax filing software. Exports complete portfolio data across four sections: Executive Summary (Net Worth, Invested Capital, Gains, Liabilities, Debt-to-Asset ratio), Detailed Asset Holdings (with foreign currencies, converted INR, return %, nominees, and purchase dates), Liabilities Schedule (lenders, principals, balances, interest rates, EMIs, payoff dates), and Asset Class Allocation breakdowns.
- **Printable Wealth Statement / PDF Export (`exportToPdf`):** Formatted A4 portfolio statement featuring clean executive KPI summary cards, detailed asset holdings ledger, liabilities schedule, and instant browser print-to-PDF generation with print media stylesheets.
- **Interactive UI Modal (`ExportModal`):** Accessible via top action buttons on the Dashboard and Assets pages, as well as the global Command Palette (`Cmd/Ctrl+K`), with instant feedback and zero third-party data transmission.

### Phase 9: AI Integration & Document Vault (Completed)
- **Natural Language & Voice Asset Entry (`QuickAddAiBar`):** AI-assisted quick entry bar supporting typed sentences or live SpeechRecognition voice input (e.g. "Bought 100 shares of Apple at $180 yesterday in USD", "Started 100k FD in HDFC Bank for 1 year at 7.1%"). Powered by Google Gemini API to parse unstructured natural language into structured entity DTOs, automatically matching asset types and pre-filling creation modals.
- **Document Vault & AI PDF/Receipt Parsing (`DocumentVaultModal` & `DocumentUploadAiParser`):** Integration with Google Drive API (`drive.file` scope) allowing users to upload bank FD receipts, mutual fund statements, and gold purchase invoices directly into a dedicated `"Asset Hub Documents"` Google Drive folder. Integrates Gemini Vision multimodal AI to extract principal, interest rate, tenure, and purchase amounts directly from uploaded files with fallback local encrypted storage for non-linked accounts.
- **AI-Generated Executive Portfolio Narrative (`AiNarrativeCard`):** 2–4 sentence high-level executive briefing summarizing portfolio health, top contributors, debt ratio, and allocation alerts. Strictly derived from live backend calculations without numerical hallucinations, optimized with a 24-hour Caffeine cache and manual refresh action.
- **Conversational Financial Assistant (`FloatingAiAssistant` & `/assistant` Page):** AI Copilot accessible via a global floating bottom-right drawer on every screen or as a full-page chat interface (`/assistant`). Grounded exclusively in real portfolio calculations (Net Worth, Debt-to-Asset, emergency runway, asset breakdown, and maturities), complete with suggested follow-up prompts and chat history retention.
- **Composite Financial Health Score (`FinancialHealthCard`):** A calculated 0–100 health index combining Debt-to-Asset ratio (30%), Liquidity ratio (25%), Asset diversification (25%), and Emergency Fund runway (20%) into a tiered rating (Excellent, Good, Fair, Needs Attention). Accompanied by Gemini AI-generated reasoning and 3 actionable improvement tips, cached with daily TTL.
- **Anomaly Detection on Manual Entries (`AnomalyWarningBanner`):** Pre-save sanity checking engine evaluating entered purchase prices, interest rates, and quantities against historical market norms to warn users of possible typos or unit discrepancies before database persistence.

## What is Left (Future Iterations)
*All primary features and core roadmap milestones across Phases 1 through 9, including AI Integration, Document Vault, multi-currency foreign asset tracking, and financial reporting exports, are fully realized and active in production.*

---
*Note: This document acts as the living blueprint for Asset Hub. It should be updated continually after every major development iteration to reflect the current state of the software.*



