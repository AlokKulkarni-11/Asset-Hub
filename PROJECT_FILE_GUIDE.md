# WealthMap File Guide

This guide gives a short lookup-style explanation of each source file in the project. I kept every entry compact so you can scan it later and jump back into the code yourself.

## Backend

### `wealthmap-backend/src/main/java/com/wealthmap/WealthmapApplication.java`
This is the Spring Boot entry point. It starts the IoC container, enables caching, async execution, and scheduling, and lets Spring discover the rest of the backend through component scanning. You almost never call anything inside this class directly; it exists so the app can boot cleanly from one place.

### `wealthmap-backend/src/main/java/com/wealthmap/DataMigrationRunner.java`
This startup runner executes raw SQL after Spring starts. It appears to patch older `assets` rows by backfilling `user_id` from `family_members`, which makes it a one-time data repair tool rather than normal business logic. It uses `JdbcTemplate` because direct SQL is simpler for a migration-like task.

### `wealthmap-backend/src/main/java/com/wealthmap/config/SecurityConfig.java`
This file defines the full Spring Security setup: which endpoints are public, how JWT auth works, how passwords are encoded, and how CORS behaves. It wires `JwtAuthFilter` into the filter chain, uses `DaoAuthenticationProvider` for login, and keeps the app stateless with JWT instead of server sessions. The overall purpose is to make every protected API request authenticate before reaching controllers.

### `wealthmap-backend/src/main/java/com/wealthmap/config/CacheConfig.java`
This config file enables Caffeine caching for expensive or rate-limited calls such as prices and benchmarks. It creates named caches and sets expiry and capacity rules so repeated dashboard requests stay fast. This is an infrastructure file that supports the pricing and analytics layer.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/AnalyticsController.java`
This controller exposes portfolio analytics endpoints such as summary, benchmarks, and what-if simulation. It mostly delegates work to `AnalyticsService` and `BenchmarkService`, which is the right controller pattern because controllers should stay thin. It exists so the frontend dashboard can fetch analytics data over HTTP.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/AssetController.java`
This is the main asset aggregation controller. It returns all assets for the logged-in user and exposes add/update/get/delete endpoints for mutual funds, real estate, and crypto while enforcing ownership through the authenticated user. It sits in front of the asset services and gives the frontend a single API surface for portfolio items.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/AuthController.java`
This controller handles register, login, forgot-password, and reset-password flows. It hashes passwords, authenticates users through Spring Security, generates JWTs, and hands password reset work to `PasswordResetService`. Its job is to convert request DTOs into auth actions and auth responses.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/FamilyGroupController.java`
This controller manages family-group creation, invitations, accepting invites, leaving a family, and listing family assets. It combines repository lookups with `FamilyGroupService` calls, then formats member and invite responses for the frontend. It exists to support the app’s shared-family portfolio feature.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/FixedIncomeController.java`
This controller exposes fixed-deposit add, list, get, and update endpoints. It delegates all actual work to `FixedDepositService`, which handles valuation, ownership checks, and entity mapping. The file exists to keep FD HTTP handling separate from financial calculations.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/GoalController.java`
This controller provides CRUD endpoints for financial goals. It is intentionally thin and forwards all logic to `GoalService`, which calculates progress based on tagged assets. The frontend uses it to manage goal tracking and progress views.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/GoldController.java`
This controller is the HTTP entry point for physical gold assets. It passes requests to `GoldService`, which stores the entity, checks ownership, and calculates live current value from the pricing layer. This keeps gold-specific API routes separate from the generic asset aggregator.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/LiabilityController.java`
This controller exposes add, update, list, get, and delete endpoints for liabilities. It delegates to `LiabilityService`, which chooses the right liability subtype and computes EMI and outstanding balance logic. It exists because debt is its own major domain area in the app.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/MarketController.java`
This controller manages stock-related endpoints, including stock search and stock CRUD. It proxies request handling to `StockService`, which talks to Yahoo Finance and persists stock holdings. The controller is mainly an API adapter between the frontend and domain service.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/MigrationController.java`
This is a debug-style endpoint that returns raw columns from the `assets` table. It uses `JdbcTemplate` directly instead of the repository layer, which makes it useful for inspection but risky to expose in production. It is not part of normal app functionality.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/PlanningController.java`
This controller groups emergency-fund, SIP tracker, and retirement-calculator endpoints. It passes requests straight to `PlanningService`, which owns the actual financial planning calculations and persistence. It exists so planning-related features live under one API prefix.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/SnapshotController.java`
This controller serves historical net-worth snapshots and captures the current snapshot on demand. It looks up the user from authentication, then delegates to `SnapshotService` for the real calculation and persistence work. It powers the dashboard’s historical charting flow.

### `wealthmap-backend/src/main/java/com/wealthmap/controller/UserController.java`
This controller handles profile updates and password changes. It uses `UserService` to validate the current password, update stored user fields, and return updated profile data. It is the backend endpoint layer for user settings.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/CryptoRequest.java`
This DTO defines the request shape for adding or updating a crypto asset. Validation annotations ensure coin ID, symbol, name, units, and buy price are present and sensible before the controller accepts the request. It keeps request payloads separate from entity classes.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/EmergencyFundRequest.java`
This request DTO carries the monthly expense and target months for emergency-fund planning. It is intentionally simple because the service does the actual liquidity math. The frontend sends this when the user configures their safety buffer.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/FamilyMemberRequest.java`
This DTO models a family member’s name and relation type. It uses validation annotations so blank names or missing relation types are rejected early. It supports the family feature’s member-management workflows.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/FixedDepositRequest.java`
This DTO captures all inputs needed to create or edit a fixed deposit. It includes dates, principal, rate, compounding frequency, and notes, plus validation to prevent obviously invalid financial inputs. The service uses it to build a `FixedDeposit` entity and compute maturity value.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/ForgotPasswordRequest.java`
This request DTO contains just an email address for password reset initiation. Its only job is to give the controller a validated input payload for OTP generation.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/GoalRequest.java`
This DTO carries goal name, target amount, target date, notes, and tagged asset IDs. It supports the goal-tracking feature by letting the frontend attach specific assets to a milestone. The service later uses those asset IDs to compute saved amount and progress.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/GoldRequest.java`
This DTO contains the fields needed for a gold asset, including weight, purity, purchase price, purchase date, and optional family member info. Validation enforces a positive weight and positive purchase price so the stored asset remains financially meaningful.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/LiabilityRequest.java`
This is the polymorphic request DTO for all liability types. It includes common debt fields plus subtype-specific fields like lender name, vehicle model, card issuer, and description detail, allowing one controller/service flow to create multiple liability entity types. The service chooses the subtype from `liabilityType`.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/LoginRequest.java`
This request DTO carries email and password for login. It is intentionally minimal because authentication should validate credentials first and keep payloads small.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/MutualFundRequest.java`
This DTO models a mutual-fund purchase with scheme code, scheme name, folio number, units, average NAV, purchase date, and notes. It gives the service enough data to store the holding and later revalue it from live NAV data.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/PasswordChangeRequest.java`
This request DTO contains the current password and the new password. It exists so the backend can verify the old password before changing the hash, which is the correct security pattern.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/ProfileUpdateRequest.java`
This DTO carries editable profile fields such as name and mobile number. It keeps the profile update endpoint focused on user-editable fields instead of exposing the full user entity.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/RealEstateRequest.java`
This DTO represents a real-estate asset request with property name, type, purchase price, estimated current value, purchase date, and notes. The service uses these fields to persist property holdings and calculate gains.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/RegisterRequest.java`
This DTO defines the registration payload with name, email, and password. Validation ensures the app does not create weak or incomplete accounts, and the controller hashes the password before saving it.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/ResetPasswordRequest.java`
This request DTO carries email, OTP, and new password for password reset completion. It is used after OTP verification so the controller can forward one atomic reset command to the service.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/RetirementRequest.java`
This DTO holds retirement planning assumptions such as current age, retirement age, desired monthly expense, expected return rate, and inflation rate. The planning service uses it to project the corpus required at retirement.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/SipTrackerRequest.java`
This DTO captures the details for a recurring mutual-fund SIP. It stores the target mutual fund asset ID, planned SIP amount, SIP day, and active state so the planning service can track contributions.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/StockRequest.java`
This DTO models a stock purchase or update with ticker, company name, purchase date, quantity, average buy price, and notes. Validation makes sure the backend only accepts usable investing data.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/request/WhatIfRequest.java`
This DTO carries a map of asset-class changes for the dashboard simulator. The analytics service uses it to project a hypothetical net worth after applying percentage movements to selected asset classes.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/AnalyticsSummaryResponse.java`
This response DTO packages portfolio-level analytics like XIRR, CAGR, warnings, best performer, worst performer, and per-asset metrics. It uses nested classes for callouts and asset analytics so the frontend can render summary cards without extra API calls.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/AssetResponse.java`
This is the common response shape for all assets. It carries shared fields such as name, type, dates, ownership, invested amount, current value, and gain/loss, letting the frontend render mixed asset lists in one view.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/AuthResponse.java`
This response DTO is returned after login, registration, and profile updates. It contains the JWT token plus the current user details so the frontend can update local auth state immediately.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/CryptoResponse.java`
This response DTO extends `AssetResponse` with crypto-specific fields like coin ID, symbol, units, and average buy price. It is used when the frontend needs detailed crypto asset data.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/CryptoSearchResponse.java`
This response DTO represents a crypto search result from CoinGecko. It keeps the shape small and focused on search UI needs: ID, name, and symbol.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/EmergencyFundResponse.java`
This response DTO returns emergency-fund target values, current liquid assets, and progress percentage. It combines stored config with computed liquidity so the frontend can show readiness in one card.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/FamilyMemberResponse.java`
This DTO is a simplified family-member representation for UI display. It exists so the app can render family lists without exposing the full user entity.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/FixedDepositResponse.java`
This response DTO extends the common asset response with FD-specific details like bank name, dates, principal, interest rate, and compounding frequency. It is what the frontend receives when it opens or edits a fixed deposit.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/GoalResponse.java`
This response DTO returns goal details plus current saved amount and progress percentage. It is built by `GoalService` after combining the goal record with the current values of tagged assets.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/GoldResponse.java`
This response DTO extends `AssetResponse` with gold-specific fields like weight, purity, and purchase price. It helps the frontend display gold holdings without looking back into entities.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/LiabilityResponse.java`
This response DTO packages debt data for the frontend, including common liability fields and subtype-specific fields such as lender name, vehicle model, card issuer, or description detail. It is designed to mirror the polymorphic liability model cleanly.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/MutualFundResponse.java`
This response DTO extends the asset response with mutual-fund details such as scheme code, scheme name, folio, units, average NAV, and current NAV. The frontend uses it when showing or editing fund holdings.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/RealEstateResponse.java`
This response DTO extends the common asset shape with property name, property type, purchase price, and estimated current value. It is the real-estate-specific data contract for the UI.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/RetirementResponse.java`
This response DTO returns the retirement projection results: years left, inflation-adjusted expenses, required corpus, projected net worth, shortfall or surplus, and readiness percentage. It is the output of the retirement calculator in `PlanningService`.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/SipTrackerResponse.java`
This response DTO sends SIP tracker data back to the frontend. It mirrors the stored SIP configuration so the UI can list or edit recurring investment plans.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/SnapshotResponse.java`
This response DTO packages a single net-worth snapshot with assets, liabilities, invested amount, and net worth. It is used by the dashboard history chart.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/StockResponse.java`
This response DTO extends the common asset response with stock-specific fields like ticker, company name, quantity, and average buy price. It is the detailed stock view returned by the service layer.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/StockSearchResponse.java`
This response DTO represents a stock search suggestion from Yahoo Finance. It is small on purpose so the search dropdown stays lightweight and fast.

### `wealthmap-backend/src/main/java/com/wealthmap/dto/response/WhatIfResponse.java`
This response DTO returns the original and projected values from the what-if simulator. It gives the frontend the numbers needed to show the immediate impact of hypothetical market moves.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/CreditCardDebt.java`
This liability subtype stores issuer details and the last four digits of the card. It inherits the shared debt structure from `Liability` and adds the extra fields needed for card debt tracking.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/Cryptocurrency.java`
This asset subtype stores the coin ID, symbol, units, and average buy price. It overrides `getInvestedAmount()` so the invested value is derived from quantity times cost basis rather than a manually stored field.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/EducationLoan.java`
This liability subtype stores the lender name and institution name. It lets the app distinguish education debt from other liabilities while still using the shared base model.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/EmergencyFund.java`
This entity stores one emergency-fund configuration per user. It holds monthly expense, target months, and a one-to-one link to the user, which makes it the persistent backing store for the emergency-fund planner.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/FamilyGroup.java`
This entity models a family group with a name, invite code, creator ID, and creation timestamp. It is the shared container that multiple users can belong to for pooled financial tracking.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/FamilyInvite.java`
This entity stores invitation state for family groups. It tracks the target email, invitee name, unique token, status, and creation time so invitation handling can be audited and retried safely.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/FinancialGoal.java`
This entity represents a goal with target amount, target date, notes, tagged asset IDs, and an owning user. The tagged asset IDs are stored as an element collection so the goal can reference specific portfolio items without a separate join entity.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/FixedDeposit.java`
This asset subtype stores fixed-deposit metadata such as bank name, start date, maturity date, principal, interest rate, and compounding frequency. It overrides `getInvestedAmount()` to return principal, since that is the base cash outflow for the FD.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/GoldItem.java`
This asset subtype stores gold weight, purity, and purchase price. It uses the base asset structure and computes invested amount as the purchase price, while pricing logic later calculates live current value from purity and weight.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/GoldPriceHistory.java`
This entity stores historical gold price points by date. It looks intended for charting or future analytics, even if the current pricing flow mainly uses live API data.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/HomeLoan.java`
This liability subtype stores lender name and property address for home loans. It is one of the polymorphic debt types managed by `LiabilityService`.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/MutualFund.java`
This asset subtype stores AMFI scheme code, scheme name, folio number, units, and average NAV. It computes invested amount as units times NAV so the current-value logic can compare cost basis against live valuation.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/NetWorthSnapshot.java`
This entity stores historical portfolio snapshots for a user. It records snapshot date, total invested, total assets, total liabilities, and total net worth so the dashboard can draw time-series charts.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/OtherLiability.java`
This liability subtype stores a free-form description for debt that does not fit other categories. It is the fallback branch in the liability polymorphism model.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/PasswordResetToken.java`
This entity stores a password reset OTP, the user it belongs to, and an expiry timestamp. It gives the password-reset flow a secure temporary state instead of keeping OTPs in memory.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/PersonalLoan.java`
This liability subtype stores lender name and purpose. It keeps personal loans distinct from home loans, vehicle loans, and other debt classes.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/RealEstate.java`
This asset subtype stores property name, property type, purchase price, and estimated current value. Its invested amount is the purchase price, while current value can be a user estimate or service-derived figure.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/SipTracker.java`
This entity stores recurring SIP tracking details for a user’s mutual-fund investment. It keeps the target mutual fund asset ID, amount, day of month, active flag, and ownership link.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/Stock.java`
This asset subtype stores stock ticker, company name, quantity, and average buy price. It calculates invested amount from quantity and cost basis, which is essential for gain/loss reporting.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/User.java`
This is the core identity entity for the app. It stores email, password hash, name, mobile number, timestamps, and optional family-group membership, and it is referenced by most other domain entities.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/VehicleLoan.java`
This liability subtype stores lender name and vehicle model. It exists to represent car or vehicle financing in the polymorphic debt hierarchy.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/base/Asset.java`
This abstract base entity defines the shared schema for all assets. It uses JPA JOINED inheritance, links assets to users and family groups, stores timestamps, and forces subclasses to define `getInvestedAmount()`. This is one of the most important domain classes in the backend.

### `wealthmap-backend/src/main/java/com/wealthmap/entity/base/Liability.java`
This abstract base entity defines the shared schema for liabilities. It also uses JPA JOINED inheritance and stores fields common to all debt types such as principal, rate, tenure, EMI, and balance. Subclasses add their own debt-specific columns.

### `wealthmap-backend/src/main/java/com/wealthmap/enums/AssetType.java`
This enum lists all supported asset categories. It is used both in entity records and in service selection logic, so it acts as the central type discriminator for pricing and analytics.

### `wealthmap-backend/src/main/java/com/wealthmap/enums/CompoundingFrequency.java`
This enum models how often a fixed deposit compounds. It stores the number of periods per year so formula-based valuation logic can compute maturity value correctly.

### `wealthmap-backend/src/main/java/com/wealthmap/enums/GoldPurity.java`
This enum models gold purity levels and exposes a multiplier for each purity. The pricing engine uses the multiplier to convert gross weight into pure-gold weight before valuing the asset.

### `wealthmap-backend/src/main/java/com/wealthmap/enums/LiabilityType.java`
This enum defines the supported debt categories. It is the switch key used by `LiabilityService` to create the correct subtype entity.

### `wealthmap-backend/src/main/java/com/wealthmap/enums/RelationType.java`
This enum defines family relationships such as self, spouse, child, parent, sibling, and other. It exists to standardize relation labels wherever family member data is captured.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/AssetRepository.java`
This Spring Data repository handles persistence for the abstract `Asset` hierarchy. It exposes derived queries like `findByUserId` and `findByUserIdAndAssetType`, which Spring implements automatically from method names.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/EmergencyFundRepository.java`
This repository persists emergency-fund settings and exposes a `findByUserId` helper. It lets the planning service read or create a user’s emergency-fund configuration in one step.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/FamilyGroupRepository.java`
This repository stores family-group records and can look them up by invite code. It is used during family creation and invite acceptance.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/FamilyInviteRepository.java`
This repository manages invitation records and supports lookup by token or pending invitee email. It is central to the family invite workflow.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/FinancialGoalRepository.java`
This repository stores financial goals and can fetch them per user. It is used by the goal service to list and update user goals.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/LiabilityRepository.java`
This repository handles the abstract liability hierarchy. It supports queries by user and by user plus liability type, which is useful for filtering debt views.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/NetWorthSnapshotRepository.java`
This repository stores historical net-worth snapshots and can return them ordered by date. It powers the dashboard chart history.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/PasswordResetTokenRepository.java`
This repository stores reset OTP records and can find or delete them by user. It supports the secure password-reset lifecycle.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/SipTrackerRepository.java`
This repository stores recurring SIP trackers and can list them by user. It gives the planning service the persistence layer for monthly SIP commitments.

### `wealthmap-backend/src/main/java/com/wealthmap/repository/UserRepository.java`
This repository stores users and provides lookup by email plus an existence check. It is used everywhere authentication or ownership checks need to resolve a user account.

### `wealthmap-backend/src/main/java/com/wealthmap/security/JwtAuthFilter.java`
This filter inspects each request for a Bearer token, extracts the username, loads the user, validates the token, and places authentication into the security context. It is what makes stateless JWT auth actually work across protected endpoints.

### `wealthmap-backend/src/main/java/com/wealthmap/security/JwtUtil.java`
This utility builds and parses JWTs. It reads the signing secret and expiration from config, generates signed HS256 tokens, and validates subject plus expiry during incoming requests.

### `wealthmap-backend/src/main/java/com/wealthmap/security/UserDetailsServiceImpl.java`
This Spring Security service loads a user by email from the database and converts it into a `UserDetails` object. It is the bridge between your JPA user model and Spring Security’s authentication system.

### `wealthmap-backend/src/main/java/com/wealthmap/service/AnalyticsService.java`
This service computes portfolio analytics such as total XIRR, CAGR, best and worst performers, asset-level analytics, diversification warnings, and what-if projections. It aggregates every asset and liability type into a financial summary that the dashboard can render. This is one of the core business-logic services in the backend.

### `wealthmap-backend/src/main/java/com/wealthmap/service/BenchmarkService.java`
This service fetches benchmark history from Yahoo Finance, caches it, and falls back to synthetic data if the API fails. It exists to support the dashboard’s benchmark overlays without making the app fragile when live data is unavailable.

### `wealthmap-backend/src/main/java/com/wealthmap/service/EmailService.java`
This service sends OTP and family-invite emails through Brevo’s HTTP API. It builds the JSON payloads, sends them with Java’s `HttpClient`, and throws a runtime exception if the email API fails. It is the outbound notification layer for the app.

### `wealthmap-backend/src/main/java/com/wealthmap/service/FamilyGroupService.java`
This service owns the family-group business rules: create group, send invite, accept invite, leave family, and list pending invites. It also creates invite tokens and optionally sends invite emails asynchronously. The service is responsible for ensuring family membership rules stay consistent.

### `wealthmap-backend/src/main/java/com/wealthmap/service/GoalService.java`
This service manages goal creation, updates, deletion, and progress calculation. It calculates how much money is already “saved” toward a goal by summing the current value of tagged assets, so goals are tied to real portfolio values rather than manual inputs.

### `wealthmap-backend/src/main/java/com/wealthmap/service/LiabilityService.java`
This service handles all debt creation, updates, reads, deletes, and EMI calculation. It uses `LiabilityType` to build the correct subtype entity, copies subtype-specific fields, enforces ownership, and maps the result back to response DTOs. It is the heart of the liabilities module.

### `wealthmap-backend/src/main/java/com/wealthmap/service/PasswordResetService.java`
This service generates OTPs, stores them, sends them by email, verifies them, and resets passwords. It wraps the process in transactions so token creation and password updates remain consistent. This is the main backend logic for password recovery.

### `wealthmap-backend/src/main/java/com/wealthmap/service/PlanningService.java`
This service combines emergency-fund tracking, SIP tracking, and retirement planning. It computes liquid assets, target corpus, recurring SIPs, and retirement readiness, so it is the core planning engine of the app. It also depends heavily on analytics and liabilities data.

### `wealthmap-backend/src/main/java/com/wealthmap/service/SnapshotService.java`
This service creates and reads net-worth snapshots. It aggregates current asset and liability values, saves a snapshot for today, and returns ordered history for charting. It is what makes time-series net-worth display possible.

### `wealthmap-backend/src/main/java/com/wealthmap/service/UserService.java`
This service updates the logged-in user’s profile and password. It validates the current password before changing it, then persists the updated user record. It exists so user settings remain in the service layer rather than in the controller.

### `wealthmap-backend/src/main/java/com/wealthmap/service/assets/CryptoService.java`
This service owns CRUD and search for cryptocurrency holdings. It stores crypto assets, checks ownership, fetches live prices from CoinGecko through the price provider, and exposes search results for the UI. It is the crypto-specific asset workflow handler.

### `wealthmap-backend/src/main/java/com/wealthmap/service/assets/FixedDepositService.java`
This service handles fixed-deposit CRUD and valuation. It stores FD details, calculates current value through the formula-based pricing provider, and returns gain/loss metrics for the frontend. It is the domain layer for FD assets.

### `wealthmap-backend/src/main/java/com/wealthmap/service/assets/GoldService.java`
This service manages gold assets, ownership checks, and valuation. It uses the gold price provider to convert weight and purity into current market value, then builds response DTOs with gain/loss details. It is the domain layer for physical gold.

### `wealthmap-backend/src/main/java/com/wealthmap/service/assets/MutualFundService.java`
This service handles mutual-fund CRUD and AMFI search. It stores the scheme metadata and units, then values the fund using the pricing provider to obtain live NAV-based worth. It is the mutual-fund domain service.

### `wealthmap-backend/src/main/java/com/wealthmap/service/assets/RealEstateService.java`
This service manages real-estate assets and their current estimated value. It is simpler than market-based assets because the value is usually user-provided, but it still enforces ownership and maps the entity to response DTOs.

### `wealthmap-backend/src/main/java/com/wealthmap/service/assets/StockService.java`
This service handles stock CRUD and Yahoo Finance search. It stores ticker and quantity data, values the holding using the live stock pricing provider, and computes gain/loss. It is the stock-specific domain service.

### `wealthmap-backend/src/main/java/com/wealthmap/service/price/CryptoPriceProvider.java`
This price provider fetches live crypto prices from CoinGecko and multiplies by units to calculate current value. It is cached so repeated dashboard loads do not hammer the external API. This class is one implementation of the pricing strategy interface.

### `wealthmap-backend/src/main/java/com/wealthmap/service/price/FormulaBasedPriceProvider.java`
This provider calculates value mathematically instead of calling an external API. It is used for fixed deposits, recurring deposits, and similar interest-bearing products where the current value can be derived from compound-interest formulas. It is a deterministic pricing strategy.

### `wealthmap-backend/src/main/java/com/wealthmap/service/price/GoldPriceProvider.java`
This provider computes live gold value by fetching gold futures and USD/INR rate, converting to INR per gram, and adding a domestic premium. It is cached because it depends on external market feeds and the value does not need to be recomputed every request.

### `wealthmap-backend/src/main/java/com/wealthmap/service/price/MutualFundPriceProvider.java`
This provider fetches AMFI NAV data, stores it in an in-memory cache, and returns units times NAV for mutual-fund valuation. It refreshes infrequently because NAV data changes only once a day, so heavy per-request recomputation would be wasteful.

### `wealthmap-backend/src/main/java/com/wealthmap/service/price/PriceProvider.java`
This interface defines the contract for pricing strategies. Each asset type has a provider that can answer two questions: whether it supports a type, and what the current price/value is for a given asset.

### `wealthmap-backend/src/main/java/com/wealthmap/service/price/PriceProviderFactory.java`
This factory selects the correct pricing implementation for each asset type. It centralizes routing so asset services can request current value without hardcoding external API logic. This is essentially a strategy dispatcher.

### `wealthmap-backend/src/main/java/com/wealthmap/service/price/RealEstatePriceProvider.java`
This provider returns the estimated current value for a real-estate asset if one exists, otherwise it falls back to invested amount. Real estate usually lacks a live market price feed, so this is a practical and simple valuation strategy.

### `wealthmap-backend/src/main/java/com/wealthmap/service/price/StockPriceProvider.java`
This provider fetches live stock prices from Yahoo Finance and multiplies by quantity. If the API fails, it falls back to invested amount so the app remains usable even when live market data is unavailable.

### `wealthmap-backend/src/main/java/com/wealthmap/util/LiquidityHelper.java`
This utility class classifies assets as liquid or illiquid and calculates totals for each group. It treats real estate as illiquid and fixed deposits as conditionally liquid, which is useful for emergency-fund and planning calculations.

### `wealthmap-backend/src/main/java/com/wealthmap/util/XirrCalculator.java`
This utility computes XIRR using Newton-Raphson with a bisection fallback. It also falls back to a CAGR-like computation if the cash flows do not support true IRR math. This is the core performance math engine behind portfolio analytics.

### `wealthmap-backend/src/main/resources/application.properties`
This file configures datasource, JPA, JWT, and external API settings. It also reads secrets from environment variables so the app can run locally and in deployment without hardcoding credentials.

### `wealthmap-backend/src/main/resources/create_real_estate_table.sql`
This SQL script manually creates the real-estate subtype table and its index. It matches the JPA JOINED inheritance model and exists to control schema creation more explicitly than pure auto-DDL.

### `wealthmap-backend/src/test/java/com/wealthmap/DatabaseQueryTest.java`
This is a Spring Boot test that exercises repository queries against the database. It is a lightweight check that `AssetRepository` methods like `findByUserId` and `findByUserIdAndAssetType` behave as expected.

## Frontend

### `wealthmap-frontend/src/main.tsx`
This is the React entry point. It mounts the app into the `root` DOM node and wraps it in `StrictMode`, which helps catch lifecycle and side-effect issues during development.

### `wealthmap-frontend/src/App.tsx`
This file defines the frontend routing tree and top-level providers. It wires React Query, theme handling, error boundaries, and React Router together so the app has a clean shell and protected routes.

### `wealthmap-frontend/src/App.css`
This stylesheet contains app-level styles for the React shell. It complements the Tailwind-heavy design by holding any custom global component styling that does not fit neatly into utility classes.

### `wealthmap-frontend/src/index.css`
This is the global CSS entry for the frontend. It sets the base styling, variables, resets, and any app-wide visual rules that every page inherits.

### `wealthmap-frontend/src/api/axios.ts`
This file creates the shared Axios client for the frontend. It injects the saved JWT into every request, logs errors, and centralizes the base API URL so every API module behaves consistently.

### `wealthmap-frontend/src/api/analytics.api.ts`
This API module wraps requests for analytics summary, benchmark data, and what-if simulation. It keeps dashboard-related HTTP calls out of page components and makes the server API easier to reuse.

### `wealthmap-frontend/src/api/assets.api.ts`
This module contains all asset-related API calls and request/response interfaces. It covers stocks, mutual funds, gold, crypto, real estate, fixed deposits, and deletion, so the UI can interact with the backend through one reusable layer.

### `wealthmap-frontend/src/api/family.api.ts`
This API module wraps family-group endpoints such as creating a family, inviting members, accepting invites, and fetching family data. It isolates the family feature’s HTTP logic from the page components.

### `wealthmap-frontend/src/api/goals.api.ts`
This module contains API calls for creating, listing, updating, and deleting goals. It is the frontend bridge to the backend goal-tracking endpoints.

### `wealthmap-frontend/src/api/liabilities.api.ts`
This module wraps liability CRUD calls. It provides the frontend with a dedicated client for debt data so the liabilities page can stay focused on rendering and form logic.

### `wealthmap-frontend/src/api/planning.api.ts`
This API module handles emergency-fund, SIP, and retirement endpoints. It is the frontend entry point for the planning features exposed by `PlanningController`.

### `wealthmap-frontend/src/api/snapshots.api.ts`
This module wraps snapshot retrieval and capture calls. It is used by the dashboard to fetch historical net-worth data and trigger a fresh snapshot.

### `wealthmap-frontend/src/api/users.api.ts`
This module wraps profile update, password change, and password reset endpoints. It centralizes user-settings API calls so profile screens and password modals can reuse the same HTTP functions.

### `wealthmap-frontend/src/assets/hero.png`
This is an image asset used by the frontend for visual presentation. It exists to support the app’s branding and hero-style UI.

### `wealthmap-frontend/src/assets/react.svg`
This is a default React asset included in the project. It is usually just starter material unless the app still references it somewhere.

### `wealthmap-frontend/src/assets/vite.svg`
This is the default Vite logo asset. Like `react.svg`, it is mostly starter boilerplate unless the app uses it directly.

### `wealthmap-frontend/src/components/ErrorBoundary.tsx`
This component catches render-time React errors and shows a fallback UI instead of crashing the whole app. It is important for dashboard-heavy interfaces where a single broken chart should not take down the page shell.

### `wealthmap-frontend/src/components/forms/AddCryptoForm.tsx`
This form component handles adding or editing crypto assets. It likely manages input fields, validation, and submission to the crypto API, keeping the asset workflow modular and reusable.

### `wealthmap-frontend/src/components/forms/AddFDForm.tsx`
This form component handles fixed-deposit input and submission. It exists so FD creation/editing logic stays separate from the page that opens the modal.

### `wealthmap-frontend/src/components/forms/AddGoldForm.tsx`
This form component handles gold asset creation and editing. It likely gathers weight, purity, and purchase price and submits them through the gold API.

### `wealthmap-frontend/src/components/forms/AddLiabilityForm.tsx`
This form component manages liability creation and editing. It likely switches fields based on liability type, which matches the backend’s polymorphic liability model.

### `wealthmap-frontend/src/components/forms/AddMutualFundForm.tsx`
This form component handles mutual-fund entry. It likely includes search and NAV-related fields so the user can choose a scheme and save a holding.

### `wealthmap-frontend/src/components/forms/AddRealEstateForm.tsx`
This form component manages real-estate asset data entry. It probably collects property details, purchase price, and current estimate for submission to the backend.

### `wealthmap-frontend/src/components/forms/AddStockForm.tsx`
This form component handles stock purchase entry and search-based selection. It likely uses typeahead search to help users choose tickers before saving the holding.

### `wealthmap-frontend/src/components/forms/AssetSelectorModal.tsx`
This modal lets the user choose what type of asset to add or edit. It is a UX helper that sits above the individual asset forms and keeps the asset flow organized.

### `wealthmap-frontend/src/components/forms/ChangePasswordModal.tsx`
This modal handles password change input and submission. It is part of the profile/settings UX and likely calls the user settings API module.

### `wealthmap-frontend/src/components/forms/ForgotPasswordModal.tsx`
This modal starts the password-reset flow by collecting the email and triggering OTP generation. It belongs to the login experience and likely coordinates with the auth-related API calls.

### `wealthmap-frontend/src/components/forms/LiabilitySelectorModal.tsx`
This modal lets the user choose which liability subtype to create. It mirrors the backend’s liability polymorphism by separating the selection step from the subtype form.

### `wealthmap-frontend/src/components/layout/AppLayout.tsx`
This component is the protected application shell. It checks auth state, redirects unauthenticated users to login, and renders the sidebar, topbar, and mobile nav around page content.

### `wealthmap-frontend/src/components/layout/MobileNav.tsx`
This is the mobile bottom navigation bar. It gives small-screen users quick access to the main sections of the app when the desktop sidebar is hidden.

### `wealthmap-frontend/src/components/layout/Sidebar.tsx`
This is the desktop navigation sidebar. It contains the main app links and the logout action, and it collapses/expands visually for a premium dashboard feel.

### `wealthmap-frontend/src/components/layout/Topbar.tsx`
This top bar shows a greeting and profile shortcut. It pulls the user from auth state and uses the current time to produce a friendly dynamic greeting.

### `wealthmap-frontend/src/components/ui/ConfirmDialog.tsx`
This component provides a reusable confirmation dialog UI. It is useful for destructive actions like delete confirmations so the app can avoid accidental data loss.

### `wealthmap-frontend/src/pages/Assets.tsx`
This page is the asset dashboard/list view. It likely fetches assets, groups them by type, and opens the appropriate add/edit modals for each asset class.

### `wealthmap-frontend/src/pages/Dashboard.tsx`
This is the main wealth overview page. It fetches assets, liabilities, snapshots, analytics, emergency fund data, and benchmarks, then renders the key cards, charts, performers, and what-if simulator. It is the frontend’s biggest consumer of backend analytics and snapshot APIs.

### `wealthmap-frontend/src/pages/Family.tsx`
This page manages family-group interactions and likely lists members, invites, and shared assets. It sits on top of the family API module and the family-group backend controller.

### `wealthmap-frontend/src/pages/Goals.tsx`
This page handles financial goals and progress tracking. It likely shows goal cards, editing controls, and asset tagging UI to support the goal service’s progress calculations.

### `wealthmap-frontend/src/pages/Liabilities.tsx`
This page is the debt-management screen. It likely lists liabilities, opens subtype-specific forms, and uses the liabilities API to perform CRUD operations.

### `wealthmap-frontend/src/pages/Login.tsx`
This page implements the login form with validation, error handling, and auth-state persistence. It posts credentials to the backend, stores the JWT and user in Zustand, and then navigates to the dashboard.

### `wealthmap-frontend/src/pages/Maturities.tsx`
This page likely shows upcoming fixed-deposit maturity information. It exists to give the user a dedicated view for dates and countdown-style planning around FDs.

### `wealthmap-frontend/src/pages/Profile.tsx`
This page likely allows users to update their profile and change their password. It sits on top of the user settings API and the auth store, so user metadata stays synchronized.

### `wealthmap-frontend/src/pages/Register.tsx`
This page implements sign-up with validation and auth-state persistence. It creates an account through the backend, stores the returned JWT and user details, and redirects into the protected app.

### `wealthmap-frontend/src/providers/ThemeProvider.tsx`
This provider is meant to manage theme state, but in practice it forces the app into light mode. It updates the root HTML class and color scheme so the browser uses the expected visual style for inputs and scrollbars.

### `wealthmap-frontend/src/store/authStore.ts`
This Zustand store persists the auth token and user profile in localStorage and exposes login/logout actions. It is the frontend’s source of truth for whether the user is authenticated.

## Root / Support Files

### `wealthmap-backend/pom.xml`
This Maven file defines the backend build, dependencies, and plugins. It is what tells Java and Spring Boot how to compile and package the backend application.

### `wealthmap-backend/package.json`
This file exists because the backend repo also contains Node-based tooling or tests. It describes the Node dependencies and scripts used alongside the Java backend.

### `wealthmap-backend/package-lock.json`
This lock file pins Node package versions for reproducible installs. It matters if the backend uses Node scripts or test helpers.

### `wealthmap-backend/Dockerfile`
This Dockerfile packages the backend into a container. It exists so the app can be deployed consistently in environments like Render or other container platforms.

### `wealthmap-backend/test_api.js`
This Node script appears to generate a JWT and call the backend assets endpoint as a quick API test. It is a developer utility, not part of the production application.

### `wealthmap-backend/TestDB.java`
This looks like a standalone database test helper. It likely exists for manual inspection or quick DB experiments outside the Spring test suite.

### `wealthmap-frontend/package.json`
This file defines the frontend’s dependencies and scripts. It is the main package manifest for the React/Vite application.

### `wealthmap-frontend/package-lock.json`
This lock file pins frontend dependency versions. It helps keep installs deterministic across machines and deployments.

### `wealthmap-frontend/postcss.config.js`
This configures PostCSS for the frontend build, usually in support of Tailwind and related CSS processing.

### `wealthmap-frontend/tailwind.config.js`
This config defines the Tailwind theme, content scanning paths, and any custom design tokens. It powers the app’s utility-first styling system.

### `wealthmap-frontend/vite.config.ts`
This Vite config controls frontend build behavior and dev-server setup. It exists so the React app can be served and bundled correctly during development and deployment.

### `wealthmap-frontend/vercel.json`
This file configures Vercel deployment behavior. It usually controls routing and build output expectations for the frontend host.

### `wealthmap-frontend/tsconfig.json`
This is the base TypeScript config for the frontend. It defines compiler options and type-checking rules shared by the app.

### `wealthmap-frontend/tsconfig.app.json`
This TypeScript config is likely scoped to the app source code. It usually fine-tunes compilation behavior for the React app itself.

### `wealthmap-frontend/tsconfig.node.json`
This TypeScript config is usually for Node-side tooling files such as Vite config. It keeps the toolchain typed without affecting the browser bundle.

### `wealthmap-frontend/test.js`
This small script looks like a manual backend connectivity or smoke test helper. It is not part of the runtime app, but it can help during debugging.

### `wealthmap-frontend/README.md`
This file documents the frontend project setup and usage. It is the first place to look for environment, build, or deployment notes.

### `wealthmap-frontend/replace_colors.py`
This looks like a helper script for mass-updating UI colors or theme tokens. It is a maintenance utility rather than application code.

