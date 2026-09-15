# Developer Skills & Working Guidelines (AssetHub / WealthMap)

This document captures the engineering philosophies, architectural patterns, domain rules, code conventions, and development practices established while building **AssetHub (WealthMap)**.

---

## 1. Core Engineering Philosophies

### 1.1 Pragmatism Over Complexity
- **Deliver High-Value, Zero-Fluff UX**: If a feature adds cognitive friction or is unreliable (e.g. natural language quick-entry bars that still require form verification), remove or streamline it in favor of direct, lightning-fast UI controls.
- **Deterministic Math First, AI Second**: AI must never perform financial math or calculate portfolio metrics. All numbers (Net Worth, Accrued FD Interest, Amortization, XIRR, CAGR, Currency conversions) are computed by deterministic math engines in Spring Boot. AI (Google Gemini) is strictly used for conversational summarization, natural language queries, and OCR parsing grounded in real data.
- **Zero Fabrication**: Never generate mock data, fake testimonials, unsupported SLAs, or speculative metrics. All numbers must reflect actual database records.

### 1.2 Multi-Tier Multi-Tenancy & Data Isolation
- **Defense in Depth**: Isolation is enforced at the JPA/Spring Security layer (filtering by `userId` or `familyGroupId`) and validated before any mutation.
- **Role-Based Access Control (RBAC)**: Enforce `OWNER`, `EDITOR`, and `VIEWER` tiers. `VIEWER` accounts are restricted from write operations (`POST`, `PUT`, `DELETE`) at both Spring Security endpoints and frontend action triggers.

---

## 2. Architecture & Tech Stack Conventions

### 2.1 Backend (Java 17 + Spring Boot 3.2)
- **Layered Architecture**: `Controller` ➔ `Service` ➔ `Repository` ➔ `Entity`.
- **Polymorphic Data Modeling**: Use `InheritanceType.JOINED` for heterogeneous models:
  - Base `Asset` entity extended by `Stock`, `MutualFund`, `GoldItem`, `FixedDeposit`, `RealEstate`, `Bond`, `EsopRsu`.
  - Base `Liability` entity extended by loan and debt subtypes.
- **Financial Calculation Isolation**:
  - Keep financial algorithms in pure Java service beans (e.g. `AmortizationEngine`, `XirrService`, `AccruedInterestCalculator`, `CurrencyConversionService`).
  - **Rule**: Never push computational or business logic into unversioned PostgreSQL database triggers or stored procedures.
- **External API & Resilience**:
  - **Yahoo Finance**: Equities, US stocks, Live Forex pairs (`USDINR=X`), benchmark index feeds (`^NSEI`, `GC=F`).
  - **AMFI India**: Daily mutual fund NAV sync.
  - **CoinGecko**: Cryptocurrency spot prices.
  - **Brevo API**: Transactional emails, 2FA OTPs, family invites, price alerts, weekly digests.
  - **Caffeine Caching**: Cache external pricing and exchange rates (`@Cacheable("forexRates")`) with offline fallbacks.

### 2.2 Frontend (React 19 + TypeScript + Vite + TailwindCSS)
- **State Management**:
  - **Zustand**: Client authentication and session state (`authStore.ts`).
  - **TanStack React Query**: Server state caching, background invalidation, and optimistic mutations.
- **Forms & Validation**:
  - React Hook Form paired with Zod schemas.
  - Maintain validation parity between client Zod schemas and backend Java Bean Validation (`@Valid`, `@NotNull`, `@Min`).
- **Data Visualization**:
  - Recharts wrapped in responsive containers (`<ResponsiveContainer width="100%" height={...} />`).
  - Dark/high-contrast palette for readable charts and tables across devices.
- **Mobile First & Responsive Layouts**:
  - **Mobile (< 768px)**: Persistent bottom navigation bar (`MobileNav.tsx`), compact logo header, touch-friendly cards, and modals capped at `max-h-[85vh]`.
  - **Desktop (≥ 768px)**: Collapsible hover sidebar (`Sidebar.tsx`), multi-column grid layouts, and keyboard command palette (`Cmd/Ctrl + K`).

---

## 3. Financial Mathematics & Domain Rules

### 3.1 Net Worth Calculation
- True Net Worth = Total Assets (INR) - Total Liabilities (INR)
- All foreign asset valuations are converted to INR in real time using cached forex rates.
- Debt-to-Asset Ratio = (Total Liabilities / Total Assets) * 100.

### 3.2 Fixed Deposit Accrued Value
- Formula: A = P * (1 + r/n)^(n*t)
  - P = Principal amount
  - r = Annual interest rate (decimal)
  - n = Compounding frequency (Quarterly = 4, Monthly = 12, Cumulative = 1)
  - t = Elapsed years derived from start date to current timestamp.

### 3.3 Reducing-Balance Loan Amortization
- Monthly interest = Balance * (Annual Rate / (12 * 100))
- Principal component = EMI - Monthly Interest
- Project final payoff date and aggregate total interest across remaining loan tenure.

### 3.4 Multi-Currency & Forex Rollups
- Supported Currencies: `INR`, `USD`, `EUR`, `GBP`, `AED`, `SGD`, `CAD`, `AUD`, `JPY`, `CHF`.
- Always store original purchased currency and quantity alongside live converted INR values to prevent loss of precision.

---

## 4. Pre-Launch, Security & Production Standards

### 4.1 Security Checklist
1. **Secrets Management**: No API keys, database credentials, or JWT secrets in client bundles or public git repos. Backend configs use `${ENV_VAR:fallback}`.
2. **Error Stack Traces**: Suppress server stack traces in production (`server.error.include-stacktrace=never`).
3. **Source Maps**: Disable client production source maps (`build.sourcemap: false` in `vite.config.ts`).
4. **Two-Factor Authentication**: Enforce TOTP RFC 6238 with backup recovery codes for sensitive account security.
5. **Session Safety**: Stateless JWT tokens with explicit expiration and Bearer authorization filters.

### 4.2 Quality Assurance & Verification
- **Verification Routine**: Always verify both builds before concluding any implementation:
  - Frontend: `npm run build` in `wealthmap-frontend` (passes TypeScript compiler + Vite build).
  - Backend: `mvn test-compile` in `wealthmap-backend` (validates all Java classes and dependencies).
- **Audit Documentation**: Update `project.md` following every major milestone to maintain living architectural documentation.

---

## 5. Development Workflow Guidelines

1. **Read Before Writing**: Inspect existing codebase files and `project.md` to ground in architecture before introducing changes.
2. **Atomic, Non-Breaking Edits**: Modify only the target components. Preserve existing working features, comments, and structure.
3. **Responsive Verification**: Ensure all new screens, modals, and tables include mobile responsive wrappers (`overflow-x-auto`, `col-span-12 sm:col-span-6 lg:col-span-4`).
4. **Actionable Feedback**: When summarizing changes, provide clear, structured bullet points highlighting what was in place, what was added/changed, and any required user review actions.
