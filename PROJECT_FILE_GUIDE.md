# AssetHub Project File & Codebase Guide

A complete reference guide mapping every key file across the **AssetHub (WealthMap)** codebase.

---

## 1. Backend Codebase (`wealthmap-backend`)

### Controllers (`com.wealthmap.controller.*`)
- `AuthController.java`: Login, register, 2FA setup/verification, Google OAuth, dynamic Google client ID discovery, and OTP password recovery.
- `AssetController.java`: Generic portfolio aggregation across all asset types.
- `StockService.java` / `StockPriceProvider.java`: Equities valuation and Yahoo Finance typeahead.
- `MutualFundService.java` / `MutualFundPriceProvider.java`: Indian Mutual Funds valuation and AMFI India NAV search.
- `GoldController.java` / `GoldService.java` / `GoldPriceProvider.java`: Physical gold tracking with live spot rate, INR forex, and purity multiplier.
- `FixedIncomeController.java` / `FixedDepositService.java`: Fixed deposits with daily compound interest accrual.
- `BondController.java` / `BondService.java`: Bonds, PPF, NPS, and Sovereign Gold Bonds (SGB).
- `EsopRsuController.java` / `EsopRsuService.java`: Corporate equity grants, vesting schedules, and strike price analytics.
- `LiabilityController.java` / `LiabilityService.java`: Polymorphic liabilities and reducing-balance EMI amortization.
- `AnalyticsController.java` / `AnalyticsService.java`: Portfolio XIRR (Newton-Raphson), CAGR, scaled Nifty 50 & Gold benchmarks, and What-If simulations.
- `HealthScoreController.java` / `HealthScoreService.java`: 0–100 Composite Financial Health Index with Gemini AI diagnosis.
- `FamilyGroupController.java` / `FamilyGroupService.java`: Multi-member family groups, RBAC, rollups, and Brevo invitations.
- `GoalController.java` / `GoalService.java`: Milestone planning and asset tagging.
- `PlanningController.java` / `PlanningService.java`: Liquid/illiquid split and emergency runway calculations.
- `SnapshotController.java` / `SnapshotService.java`: Historical Net Worth snapshots and time-series endpoints.
- `AlertController.java` / `AlertService.java`: Scheduled live price alerts, maturity scans, and rebalancing nudges.
- `DocumentController.java` / `GoogleDriveService.java`: Google Drive Document Vault integration and Gemini AI OCR parser.
- `ForexController.java` / `CurrencyConversionService.java`: Real-time multi-currency forex conversions with Caffeine caching.
- `AuditLogController.java` / `AuditLogService.java`: Automatic mutation activity audit logging.

### Security & Configuration
- `SecurityConfig.java`: Spring Security filter chain, stateless session policy, CORS configuration, and RBAC endpoint rules.
- `JwtAuthFilter.java`: Inbound Bearer token validation and SecurityContextHolder population.
- `JwtUtil.java`: Signed HMAC-SHA256 JWT generation, token parsing, and 2FA pending tokens.
- `TfaService.java`: TOTP base32 secret generation, QR code formatting, code validation, and single-use recovery code management.

---

## 2. Frontend Codebase (`wealthmap-frontend`)

### Pages (`src/pages/*`)
- `Dashboard.tsx`: Customizable drag-and-drop dashboard with net worth hero, allocation donut, historical trendline with benchmarks, health score card, and simulator.
- `Assets.tsx`: Multi-tier collapsible accordion views for all 8 asset subtypes with multi-currency badges and nominee tags.
- `Liabilities.tsx`: Debt tracking with reducing-balance EMI amortization ledgers.
- `Goals.tsx`: Milestone goals, liquid vs illiquid split, emergency fund runway, and SWP / Retirement calculators.
- `Family.tsx`: Family member rollups, contribution share charts, RBAC management, shared family goals, and system audit trail.
- `Maturities.tsx`: Upcoming Fixed Deposit, Bond, and Loan payoff timeline.
- `AiAssistantPage.tsx`: Full-page conversational copilot interface grounded in real portfolio database data.
- `Profile.tsx`: User profile details, password change, and TOTP 2FA setup/disable wizard.
- `Login.tsx` / `Register.tsx`: Authentication pages with Google OAuth and 2FA verification dialogs.
- `PrivacyPolicy.tsx`: Comprehensive data security, third-party disclosure, and privacy policy.
- `NotFound.tsx`: Styled 404 error page.

### Key Components (`src/components/*`)
- `layout/AppLayout.tsx`: Master responsive layout wrapper with offline mode banner.
- `layout/MobileNav.tsx`: Persistent mobile bottom navigation bar (< 768px).
- `layout/Sidebar.tsx`: Collapsible hover-expanding sidebar (≥ 768px).
- `layout/Topbar.tsx`: Responsive header with compact mobile branding and profile avatar.
- `ui/FloatingActionHub.tsx`: Bottom-right floating speed-dial button to add any asset or liability.
- `ai/FloatingAiAssistant.tsx`: Bottom-right floating Hub Mate AI copilot drawer.
- `ui/CommandPalette.tsx`: Global `Cmd/Ctrl + K` searchable command center.
- `forms/ExportModal.tsx`: Multi-section CSV spreadsheet export and formatted printable PDF statement generator.
- `documents/DocumentVaultModal.tsx`: Google Drive file attachments and document preview dialog.
