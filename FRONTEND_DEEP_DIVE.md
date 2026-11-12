# Frontend Architecture & UI Deep Dive

This document covers AssetHub’s frontend architecture built with **React 19**, **TypeScript**, **Vite**, **TailwindCSS**, **Zustand**, **TanStack React Query**, and **Recharts**.

---

## 1. Architecture Overview

AssetHub’s client-side application is structured around a modular, responsive layout with centralized state management, server-state caching, and interactive data visualizations.

```
                                  [App.tsx]
                                      |
                      +---------------+---------------+
                      |                               |
             [Public Routes]                  [AppLayout.tsx]
           (/login, /register,                       |
                 /privacy)           +---------------+---------------+
                                     |               |               |
                               [Sidebar.tsx]   [Topbar.tsx]    [MobileNav.tsx]
                                 (Desktop)        (Header)         (Mobile)
                                                     |
                                            [Page Outlets]
                                     (/, /assets, /liabilities, /goals,
                                      /family, /maturities, /assistant)
                                                     |
                                   +-----------------+-----------------+
                                   |                                   |
                         [FloatingActionHub]                 [FloatingAiAssistant]
```

### Key Libraries & Stack:
- **UI Framework**: React 19 + TypeScript.
- **Build Tool**: Vite with production source maps disabled for security (`build.sourcemap: false`).
- **Styling**: TailwindCSS with light slate/indigo high-contrast palette.
- **Client Auth State**: Zustand (`useAuthStore`).
- **Server State & Caching**: TanStack React Query (`@tanstack/react-query`).
- **Routing**: React Router v7 with dynamic page meta titles & descriptions (`usePageMeta.ts`).
- **Forms**: React Hook Form + Zod schema validation.
- **Data Visualization**: Recharts (`ResponsiveContainer`, `LineChart`, `PieChart`, `BarChart`).
- **PWA**: Service Worker (`sw.js`) + `manifest.json` with offline detection banner.

---

## 2. Component & Layout Architecture

### 2.1 Responsive Navigation Dual-Pattern
- **Mobile (< 768px)**: Bottom navigation bar ([`MobileNav.tsx`](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/wealthmap-frontend/src/components/layout/MobileNav.tsx)) providing 1-tap switching between Dashboard, Assets, Liabilities, Goals, Family, and Upcoming Maturities.
- **Desktop (≥ 768px)**: Collapsible hover-expanding sidebar ([`Sidebar.tsx`](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/wealthmap-frontend/src/components/layout/Sidebar.tsx)) with smooth CSS width transitions.
- **Main Viewport Spacing**: Styled with `pb-24 md:pb-8` to ensure cards and tables are never obstructed by the mobile bottom bar.

### 2.2 Customizable Drag-and-Drop Dashboard (`Dashboard.tsx`)
- Sections are modular cards: Key Wealth Metrics, Financial Health Score, Liquidity & Emergency Buffer, Net Worth Historical Trend with Benchmarks, Asset Allocation Donut, Performance Highlights, What-If Simulator, Price Alerts & Rebalancing, and Upcoming Maturities Snapshot.
- Features intuitive drag-and-drop reordering and a "Customize Cards" modal to toggle card visibility (show/hide), with user preferences persisted in `localStorage`.

### 2.3 Global Command Center (`CommandPalette.tsx`)
- Activated globally via `Cmd/Ctrl + K` or the search button.
- Enables instant keyboard navigation (`↑`/`↓`/`↵`/`Esc`) to any page, instant asset/liability creation triggers, and typeahead search across all user holdings.

### 2.4 Floating Speed-Dial & AI Copilot
- **Floating Action Hub ([`FloatingActionHub.tsx`](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/wealthmap-frontend/src/components/ui/FloatingActionHub.tsx))**: Positioned at bottom right (`bottom-20 md:bottom-8 right-6`) with speed-dial expansion for adding any of the 8 asset subtypes or liabilities.
- **Hub Mate AI Assistant ([`FloatingAiAssistant.tsx`](file:///c:/Users/alokk/OneDrive/Desktop/WealthMap/wealthmap-frontend/src/components/ai/FloatingAiAssistant.tsx))**: Positioned directly to the left of the speed dial (`right-20 md:right-24`), offering a quick conversational drawer with suggested prompts or expanding into the dedicated `/assistant` full page view.

---

## 3. Financial Statements & Data Export (`ExportModal.tsx`)

1. **CSV Spreadsheet Export (`exportToCsv`)**:
   - Generates UTF-8 encoded CSV files (`\uFEFF` BOM) compatible with Excel, Google Sheets, and tax filing tools.
   - Exports four structured ledgers: Executive Summary, Detailed Asset Holdings (with original foreign currencies, converted INR, return %, nominees, purchase dates), Liabilities Schedule, and Asset Class Allocation breakdowns.
2. **Printable Wealth Statement / PDF (`exportToPdf`)**:
   - Clean A4 formatted financial statement with executive KPI summary cards, asset holdings table, liabilities schedule, and browser print-to-PDF generation via print stylesheets.
