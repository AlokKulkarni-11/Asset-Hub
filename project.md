# Asset Hub

Asset Hub is a premium, modern, and comprehensive personal wealth tracking application designed to give users absolute clarity over their financial net worth.

## 💡 The Idea
Most net-worth trackers are simple ledgers where you just type in a number. Asset Hub is built to be a **smart, dynamic portfolio manager**. It tracks heterogeneous asset classes (Physical Gold, Fixed Deposits, Stocks, Real Estate) and dynamically calculates their real-time current market value using live integrations and exact financial mathematics (like accrued compound interest).

## 🛠️ Tech Stack
**Frontend (Client-Side)**
- **Framework:** React 19 + TypeScript + Vite
- **Styling:** TailwindCSS (Premium Light Blue glassmorphism aesthetics)
- **State Management:** Zustand (Auth) + React Query (Server State/Caching)
- **Routing:** React Router v7
- **Forms:** React Hook Form + Zod (Validation)
- **Icons:** Lucide React
- **Data Visualization:** Recharts

**Backend (Server-Side)**
- **Framework:** Java 21 + Spring Boot 3.2
- **Database:** PostgreSQL (Supabase) with Spring Data JPA & Hibernate
- **Security:** Spring Security + Stateless JWT Authentication + Row Level Security (RLS)
- **Architecture:** Controller-Service-Repository pattern with Polymorphic DTOs for heterogeneous assets.
- **Integrations:** Yahoo Finance API (Live Stock & Gold prices), JavaMailSender (Email Invites)

## ✅ What is Implemented
- **Authentication & Security:** Secure user registration, login, JWT-based session management, and database-level RLS policies to strictly isolate user data.
- **Polymorphic Data Models:** A unified `Asset` base table extending out to specialized tables (`gold_items`, `fixed_deposits`, `stocks`, `mutual_funds`, `real_estate`).
- **Real-Time Pricing Engine:** 
  - **Stocks & Mutual Funds:** Live ticker fetching from Yahoo Finance.
  - **Gold:** Live Spot Gold (USD/Ounce) fetching, Forex INR conversion, and physical market premium logic.
  - **Fixed Deposits:** Dynamic accrual using exact compound interest formulas based on elapsed days.
- **Data Visualization & Dashboard:** A sleek, Light Blue glass-styled grid displaying individual assets, invested amounts, real-time current values, and net gain/loss percentages. Includes robust Recharts implementations:
  - Historical Net Worth Line Chart with dynamic time-range filtering (1M, 3M, 6M, 1Y, ALL).
  - Asset Allocation Pie Chart.
- **Full CRUD:** Ability to securely add new assets, delete assets (with a custom confirmation UI), and update existing assets using dynamic pre-filled edit modals.
- **Family Management:** Track assets owned by different family members under one master family dashboard, completely separated from your personal assets. Includes asynchronous Email Invitations with secure join links.
- **Mobile Responsiveness:** Fully adaptive UI with a desktop sidebar and a dedicated Mobile Bottom Navigation Bar / Hamburger menu for smaller screens.
- **Alerts & Maturities:** A dedicated Maturities page to track upcoming Fixed Deposit maturity dates with a countdown timer.

## 🚀 What is Left (Future Iterations)
- **Cryptocurrencies:** Add support for tracking Crypto assets using a live crypto API.
- **Performance Optimization:** Add Redis caching layer for the external financial APIs to prevent rate-limiting on heavy traffic.
- **Export Data:** Allow users to export their entire portfolio to CSV/PDF for tax purposes.

---
*Note: This document acts as the living blueprint for Asset Hub. It should be updated continually after every major development iteration to reflect the current state of the software.*
