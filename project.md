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
- **Security:** Spring Security + Stateless JWT Authentication + Row Level Security (RLS)
- **Architecture:** Controller-Service-Repository pattern with Polymorphic DTOs for heterogeneous assets
- **Inheritance Strategy:** JOINED table inheritance for asset subtypes
- **Integrations:** Yahoo Finance API (Live Stock & Gold prices), AMFI India API (Live Mutual Fund NAV), CoinGecko API (Live Cryptocurrency prices), Brevo API (Email Invites, OTPs, and automation emails)

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

### Automation & Notifications
- **Price Alerts:** Users can create live price thresholds for stocks, mutual funds, and gold, with scheduled polling that triggers Brevo email alerts and in-app notifications when thresholds are crossed.
- **Maturity Reminders:** Fixed-deposit and loan payoff reminders are sent X days before maturity using the Brevo integration, backed by scheduled jobs and notification deduplication.
- **Weekly/Monthly Digest:** Automated Brevo digest emails summarize net worth change, top movers, and upcoming maturities on weekly and monthly schedules.
- **Rebalancing Nudges:** Target allocation tracking compares current holdings against user-defined equity/debt/gold targets and surfaces a dashboard nudge when drift exceeds the configured threshold.
- **Scheduled Job Infrastructure:** Spring scheduling is enabled application-wide and powers recurring alert, reminder, and digest workflows.

### Family Rollup
- **Master Family Dashboard:** Family groups now include a per-member net worth rollup view with pie and bar chart breakdowns.
- **RLS-Aware Aggregation:** Rollups are computed through user-scoped service calls so personal asset and liability data remain isolated under the existing security model.
- **Contribution Breakdown:** Each family member's assets, liabilities, net worth, and contribution share are summarized for quick comparison.

### Phase 1 Features (Completed)
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
- **SWP Calculator:** Systematic Withdrawal Plan calculator integrated directly as a tab inside the `/goals` section. Features real-time reactive compounding calculations, optional capital gains tax rate projections (controlled by checkbox), compulsory inflation rate step-ups, summary cards, cumulative withdrawal vs. growth Recharts line charts, and a paginated growth table ledger.
- **Mobile Navigation & Form Usability:** Refined mobile bottom navigation bar by placing Goals after Liabilities and removing Profile. Resolved mobile overlay scroll-overflow blocks on all modal forms (Liability & heterogeneous Asset forms) by capping height at 70vh and adding bottom padding offsets. Disabled mouse scroll-wheel value alterations on all numeric input fields.
- **Retirement Corpus Calculator:** Inflation-adjusted compounding calculator projecting retirement readiness using current net worth, expected returns, and the 4% annual withdrawal rule.

## What is Left (Future Iterations)
- **Performance Optimization:** Add Redis caching layer for external financial APIs to prevent rate-limiting on heavy traffic.
- **Export Data:** Allow users to export their entire portfolio to CSV/PDF for tax purposes.

---
*Note: This document acts as the living blueprint for Asset Hub. It should be updated continually after every major development iteration to reflect the current state of the software.*
