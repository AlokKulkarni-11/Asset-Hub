# Asset Hub

Asset Hub is a premium, modern, and comprehensive personal wealth tracking application designed to give users absolute clarity over their financial net worth.

## 💡 The Idea
Most net-worth trackers are simple ledgers where you just type in a number. Asset Hub is built to be a **smart, dynamic portfolio manager**. It tracks heterogeneous asset classes (Physical Gold, Fixed Deposits, Stocks, Real Estate) and dynamically calculates their real-time current market value using live integrations and exact financial mathematics (like accrued compound interest).

## 🛠️ Tech Stack
**Frontend (Client-Side)**
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** TailwindCSS (Premium dark-mode glassmorphism aesthetics)
- **State Management:** Zustand (Auth) + React Query (Server State/Caching)
- **Routing:** React Router v7
- **Forms:** React Hook Form + Zod (Validation)
- **Icons:** Lucide React

**Backend (Server-Side)**
- **Framework:** Java 21 + Spring Boot 3.2
- **Database:** PostgreSQL with Spring Data JPA & Hibernate
- **Security:** Spring Security + Stateless JWT Authentication
- **Architecture:** Controller-Service-Repository pattern with Polymorphic DTOs for heterogeneous assets.
- **Integrations:** Yahoo Finance API (Live Stock & Gold prices)

## ✅ What is Implemented
- **Authentication:** Secure user registration, login, and JWT-based session management.
- **Polymorphic Data Models:** A unified `Asset` base table extending out to specialized tables (`gold_items`, `fixed_deposits`, `stocks`, `mutual_funds`, `real_estate`).
- **Real-Time Pricing Engine:** 
  - **Stocks & Mutual Funds:** Live ticker fetching from Yahoo Finance.
  - **Gold:** Live Spot Gold (USD/Ounce) fetching, Forex INR conversion, and physical market premium logic.
  - **Fixed Deposits:** Dynamic accrual using exact compound interest formulas based on elapsed days.
- **Asset Dashboard:** A sleek, glass-styled grid displaying individual assets, invested amounts, real-time current values, and net gain/loss percentages.
- **Full CRUD:** Ability to securely add new assets, delete assets (with a custom confirmation UI), and update existing assets using dynamic pre-filled edit modals.
- **Family Management:** Track assets owned by different family members under one master family dashboard, completely separated from your personal assets.
- **Alerts & Maturities:** A dedicated Maturities page to track upcoming Fixed Deposit maturity dates with a countdown timer.

## 🚀 What is Left (Future Iterations)
- **Data Visualization:** Implement `Recharts` to show historical net worth progression over time (Line charts) and portfolio diversification (Pie charts).
- **Cryptocurrencies:** Add support for tracking Crypto assets using a live crypto API.
- **Performance Optimization:** Add Redis caching layer for the external financial APIs to prevent rate-limiting on heavy traffic.
- **Export Data:** Allow users to export their entire portfolio to CSV/PDF for tax purposes.

---
*Note: This document acts as the living blueprint for Asset Hub. It should be updated continually after every major development iteration to reflect the current state of the software.*
