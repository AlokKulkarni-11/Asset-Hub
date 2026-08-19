# Backend Assets Deep Dive

This module covers the app’s core asset-tracking flow: stocks, mutual funds, gold, real estate, fixed deposits, and crypto. The backend treats all of them as JPA assets with a shared base type, then uses specialized services and pricing strategies to calculate current value, gain/loss, and performance.

## 1. Architecture Overview

The asset system is built around a shared `Asset` base entity with JOINED inheritance, a generic `AssetRepository`, and asset-specific services under `service/assets`. The controllers expose CRUD and search endpoints, the services create or update subtype entities, and the `PriceProviderFactory` chooses the correct valuation strategy. The frontend uses these APIs to show a single portfolio view, but the backend still keeps each asset type’s financial logic separate.

Top-level modules:
- `controller`: HTTP endpoints for asset CRUD and search.
- `service/assets`: asset-specific business logic and entity mapping.
- `service/price`: live or formula-based valuation engines.
- `entity` and `entity/base`: the shared asset model and subtype tables.
- `dto/request` and `dto/response`: API contracts for each asset type.
- `repository`: JPA access for assets and users.
- `util`: supporting math and helper logic used by the asset-related planning features.

Typical asset request lifecycle:
1. Frontend submits an add/edit form.
2. Controller receives a DTO.
3. Controller passes the logged-in user email to the service.
4. Service loads the user from `UserRepository`.
5. Service creates or updates the correct asset subtype.
6. Repository persists the entity through JPA/Hibernate.
7. Service calls a pricing provider to calculate current value.
8. Service maps the entity back into a response DTO.
9. Frontend renders the updated asset list and portfolio totals.

Major libraries/patterns:
- JPA JOINED inheritance: lets all asset types share a base table while keeping subtype columns separate.
- Strategy pattern: `PriceProvider` implementations isolate valuation logic.
- Spring Data repositories: provide query methods without handwritten SQL.
- `RestTemplate` and `HttpClient`: fetch live market data from external services.
- Caffeine cache: reduces repeated external API calls for price data.

## 2. Feature-by-Feature Breakdown

Asset features in this module:
- Add, update, fetch, delete assets
- Search stocks, mutual funds, and crypto
- Live price valuation for market assets
- Formula-based valuation for fixed deposits
- Manual valuation for real estate

### Feature: Generic asset aggregation

**What it does**
Returns all assets for the current user in one list so the dashboard can show the whole portfolio at once.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/AssetController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/GoldService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/FixedDepositService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/StockService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/MutualFundService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/RealEstateService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/CryptoService.java`

**Step-by-step trace**
1. `AssetController.getAllAssets(...)` reads the authenticated user email.
2. It calls each asset service’s `getAll...ForUser(...)`.
3. Each service loads that user and queries assets by type.
4. Each service maps entities to response DTOs and computes current value.
5. The controller concatenates all lists and returns a single portfolio response.

**State management**
- Current asset state lives in the database.
- The aggregated list is request-scoped data.
- The frontend caches the result through React Query.

**Validation & error handling**
- Ownership is resolved through the current authenticated user.
- Each service throws runtime exceptions if the user or asset is missing.

**Edge cases**
- If one asset service fails, the whole aggregation fails because the controller does not isolate partial errors.
- The generic endpoint does not currently sort or group the results.

### Feature: Gold assets

**What it does**
Lets users add, update, fetch, and list physical gold holdings, then values them using live gold pricing plus purity and weight.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/GoldController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/GoldService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/price/GoldPriceProvider.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/GoldItem.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/GoldRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/GoldResponse.java`

**Step-by-step trace**
1. Controller receives the request DTO and authenticated email.
2. `GoldService` loads the user and constructs `GoldItem`.
3. The asset is saved through `AssetRepository`.
4. `mapToResponse(...)` copies entity fields into `GoldResponse`.
5. `PriceProviderFactory` returns `GoldPriceProvider`.
6. The provider fetches live gold and FX data and returns current value.

**State management**
- Purchase price and weight are persisted.
- Current value is computed at read time.

**Validation & error handling**
- DTO validation ensures positive weight and purchase price.
- Ownership is checked before read/update.
- If live pricing fails, the provider returns a fallback value.

**Edge cases**
- Gold purity defaults are handled in the pricing layer, not the entity.
- The code assumes the external market data response shape stays stable.

### Feature: Fixed deposits

**What it does**
Stores FD accounts and computes their current value using compound-interest math rather than a live market price feed.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/FixedIncomeController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/FixedDepositService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/price/FormulaBasedPriceProvider.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/FixedDeposit.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/FixedDepositRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/FixedDepositResponse.java`

**Step-by-step trace**
1. Controller receives FD form data.
2. Service loads the user and creates `FixedDeposit`.
3. The entity is saved through `AssetRepository`.
4. Response mapping copies the FD metadata into `FixedDepositResponse`.
5. `FormulaBasedPriceProvider` calculates maturity/current value with compounding.

**State management**
- Principal, rate, dates, and compounding frequency are persisted.
- Current value is derived on demand.

**Validation & error handling**
- DTO validation ensures dates and principal are present.
- Ownership is verified before updates and reads.

**Edge cases**
- If start date is in the future, the provider returns principal.
- The provider clamps valuation at maturity date if the target date is later.

### Feature: Stocks

**What it does**
Manages stock holdings, values them from Yahoo Finance, and supports ticker search for UI autocomplete.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/MarketController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/StockService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/price/StockPriceProvider.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/Stock.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/StockRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/StockResponse.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/StockSearchResponse.java`

**Step-by-step trace**
1. `MarketController.addStock(...)` sends the request to `StockService`.
2. The service creates a `Stock` entity and saves it.
3. `mapToResponse(...)` calculates live value and gain/loss.
4. `searchStocks(...)` queries Yahoo Finance search API and parses the results.
5. The frontend uses search results to populate the stock picker.

**State management**
- Quantity and cost basis live in the database.
- Search results are transient UI data.

**Validation & error handling**
- DTO validation checks ticker, company name, quantity, and buy price.
- Search failures return an empty list rather than crashing the page.

**Edge cases**
- If Yahoo Finance fails, valuation falls back to invested amount.
- Search output shape depends on external API fields like `shortname` and `longname`.

### Feature: Mutual funds

**What it does**
Stores mutual-fund investments, fetches AMFI search results, and values holdings using NAV data.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/AssetController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/MutualFundService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/price/MutualFundPriceProvider.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/MutualFund.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/MutualFundRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/MutualFundResponse.java`

**Step-by-step trace**
1. Controller receives add/update/get/search requests.
2. Service persists the holding and maps it to a response DTO.
3. Search calls the AMFI API.
4. Pricing provider refreshes its in-memory NAV cache from `NAVAll.txt`.
5. Current value is calculated from units times NAV.

**State management**
- Scheme metadata and units are persisted.
- NAV cache is in memory and refreshed periodically.

**Validation & error handling**
- The request DTO is not heavily validated, so the service assumes sane values.
- Search failures return raw fallback behavior from the external call.

**Edge cases**
- If scheme code is missing, the provider falls back to invested amount.
- Cache refresh depends on the AMFI file format staying consistent.

### Feature: Real estate

**What it does**
Stores property assets and lets the user provide an estimated current value instead of relying on live market data.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/AssetController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/RealEstateService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/price/RealEstatePriceProvider.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/RealEstate.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/RealEstateRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/RealEstateResponse.java`

**Step-by-step trace**
1. Controller accepts create/update/get requests.
2. Service creates or updates the `RealEstate` entity.
3. Provider returns the estimated current value if present.
4. Response DTO includes property fields plus gain/loss.

**State management**
- Purchase price and estimated value are persisted.
- No external pricing state is required.

**Validation & error handling**
- Ownership is checked before access or update.
- If estimated value is absent, the provider falls back to invested amount.

**Edge cases**
- There is no automated valuation source here, so accuracy depends on user input.

### Feature: Crypto assets

**What it does**
Lets users search, add, update, and value cryptocurrency holdings through CoinGecko.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/AssetController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/CryptoService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/price/CryptoPriceProvider.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/Cryptocurrency.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/CryptoRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/CryptoResponse.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/CryptoSearchResponse.java`

**Step-by-step trace**
1. The controller forwards add/update/get/search actions to `CryptoService`.
2. Service stores the coin ID, symbol, units, and cost basis.
3. Search hits the CoinGecko API and parses coin matches.
4. Price provider fetches the live INR price for the coin ID.
5. Current value and gain/loss are returned to the frontend.

**State management**
- Coin metadata and cost basis are persisted.
- Current price is external and cached.

**Validation & error handling**
- Search failures return an empty or partial result set.
- Provider falls back to invested amount if the API fails.

**Edge cases**
- Search result limit is capped at 10.
- If coin ID is missing, the provider returns invested amount.

## 3. Library & Pattern Justification

- **JPA JOINED inheritance**
  - Solves the problem of shared asset fields with subtype-specific columns.
  - Without it, you would duplicate common columns or build a more complex table model.
  - Alternative: single-table inheritance. Tradeoff: simpler querying, but more null columns and less clean schema.
  - This looks deliberate and well matched to the domain.

- **`PriceProviderFactory` strategy dispatch**
  - Solves asset valuation routing without hardcoding price logic into controllers.
  - Without it, every asset service would need its own duplicated pricing branching.
  - Alternative: a `Map<AssetType, PriceProvider>` injection. Tradeoff: cleaner extensibility, less switch logic.
  - Deliberate, but the map approach may be cleaner later.

- **External API search in services**
  - Solves typeahead search for stocks, funds, and crypto.
  - Without it, the user would have to type raw identifiers manually.
  - Alternative: pre-index or local mirror of market data. Tradeoff: faster but more operationally heavy.
  - Deliberate and user-friendly.

- **Caffeine cache**
  - Solves repeated fetches for relatively stable or rate-limited pricing data.
  - Without it, dashboard loads would hit external APIs too often.
  - Alternative: Redis cache. Tradeoff: shared cache across instances, but more infrastructure.
  - Deliberate, and a good fit here.

- **Fallback valuation**
  - Solves API failure resilience.
  - Without it, dashboard values would break whenever an external API was down.
  - Alternative: fail hard. Tradeoff: better correctness, worse availability.
  - Deliberate and practical.

## 4. Database & Data Model

Asset-related tables:
- `assets`
  - Base table for all asset types.
  - Holds shared fields like `id`, `name`, `purchaseDate`, `notes`, `user_id`, `family_group_id`, `assetType`, timestamps.
- `gold_items`
  - Gold subtype table.
- `fixed_deposits`
  - FD subtype table.
- `stocks`
  - Stock subtype table.
- `mutual_funds`
  - Mutual-fund subtype table.
- `real_estate`
  - Real-estate subtype table.
- `cryptocurrencies`
  - Crypto subtype table.

Relationships:
- Every asset belongs to one `User`.
- Assets may optionally belong to a `FamilyGroup`.
- The subtype tables extend the base `assets` table via JOINED inheritance.

Integrity reliance:
- Ownership checks are enforced in service code.
- Current value is derived in application code, not stored as truth.
- Search and pricing data depend on external API response formats.

## 5. Security & Access Notes

Access control in this module happens at the service layer:
- The controller reads the authenticated email from Spring Security.
- The service resolves the user from `UserRepository`.
- The service compares entity ownership before allowing get/update/delete.

That means the main auth system protects the route, and the asset service protects the record. This is a good layered approach because route authentication and ownership are not the same thing.

Gaps to be ready for:
- Search endpoints rely on public APIs without retries or circuit breakers.
- Some request DTOs are not deeply validated.
- `AssetController.deleteAsset(...)` is generic and depends on correct ownership checks.
- Price providers parse external JSON directly, so schema drift is a risk.

## 6. Likely Interview Questions

- **Why use a shared `Asset` base class?**
  - Because all asset types share ownership, name, date, notes, and timestamps, so inheritance avoids duplication.

- **Why calculate current value in the service instead of storing it in the DB?**
  - Because market values change, and storing derived values as truth would go stale.

- **Why use separate price provider classes?**
  - Because each asset type has a different valuation rule and external dependency.

- **Why is real estate handled differently from stocks or crypto?**
  - Because there is usually no single live market source, so user-estimated current value is more realistic.

- **Why does the dashboard fetch all assets instead of each asset type separately?**
  - Because the user needs one unified portfolio view and the backend already knows how to aggregate it.

## 7. Things I Should Be Able to Defend

- JOINED inheritance instead of separate unrelated tables
  - Strong justification: the asset types share a lot of structure and the model stays clean.

- Live external pricing APIs
  - Strong justification: this makes the portfolio values much more useful than manual inputs alone.

- Fallback to invested amount on API failure
  - Strong justification: availability matters more than perfect precision when a third-party service is flaky.

- `RestTemplate` and raw HTTP parsing
  - Weak justification: it works, but a more robust HTTP client and typed response mapping would be cleaner.

- Search endpoints returning raw objects in a few places
  - Weak justification: it works, but stronger typed DTOs would be better for long-term maintenance.

