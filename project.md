# Asset Hub

Asset Hub is a premium, modern, and comprehensive personal wealth tracking application designed to give users absolute clarity over their financial net worth.

## 💡 The Idea
Most net-worth trackers are simple ledgers where you just type in a number. Asset Hub is built to be a **smart, dynamic portfolio manager**. It tracks heterogeneous asset classes (Physical Gold, Fixed Deposits, Stocks, Mutual Funds, Real Estate) and dynamically calculates their real-time current market value using live integrations and exact financial mathematics (like accrued compound interest).

## 🛠️ Tech Stack
**Frontend (Client-Side)**
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** TailwindCSS (Premium Light Blue theme with improved contrast and readability)
- **State Management:** Zustand (Auth) + React Query (Server State/Caching)
- **Routing:** React Router v7
- **Forms:** React Hook Form + Zod (Validation)
- **Icons:** Lucide React
- **Data Visualization:** Recharts

**Backend (Server-Side)**
- **Framework:** Java 21 + Spring Boot 3.2
- **Database:** PostgreSQL (Supabase) with Spring Data JPA & Hibernate
- **Security:** Spring Security + Stateless JWT Authentication + Row Level Security (RLS)
- **Architecture:** Controller-Service-Repository pattern with Polymorphic DTOs for heterogeneous assets
- **Inheritance Strategy:** JOINED table inheritance for asset subtypes
- **Integrations:** Yahoo Finance API (Live Stock, Mutual Fund & Gold prices), JavaMailSender (Email Invites)

## ✅ What is Implemented

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
- **Enhanced Dropdowns:** Improved stock and mutual fund search dropdowns with:
  - Dark text on white backgrounds for excellent readability
  - Text wrapping for long names
  - Hover tooltips showing full information
  - Styled badges for exchange/code information
  - Smooth transitions and proper contrast
- **Dashboard:** Light Blue glass-styled grid displaying individual assets with invested amounts, real-time current values, and net gain/loss percentages
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

## 🚀 What is Left (Future Iterations)
- **Real Estate Verification:** Ensure `real_estate` database table is created properly (backend code complete, may need manual table creation)
- **Cryptocurrencies:** Add support for tracking Crypto assets using a live crypto API
- **Performance Optimization:** Add Redis caching layer for external financial APIs to prevent rate-limiting on heavy traffic
- **Export Data:** Allow users to export their entire portfolio to CSV/PDF for tax purposes
- **Advanced Analytics:** Add more detailed performance metrics and comparisons
- **Notifications:** Email/push notifications for maturity dates and significant portfolio changes

---
*Note: This document acts as the living blueprint for Asset Hub. It should be updated continually after every major development iteration to reflect the current state of the software.*
