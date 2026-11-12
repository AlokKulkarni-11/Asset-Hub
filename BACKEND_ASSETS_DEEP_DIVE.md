# Backend Assets Deep Dive

This document covers AssetHub’s heterogeneous asset engine: **Stocks**, **Mutual Funds**, **Physical Gold**, **Fixed Deposits**, **Real Estate**, **Cryptocurrencies**, **Bonds/PPF/NPS/SGB**, and **ESOPs/RSUs**, along with the **Multi-Currency Forex Engine**, **Nominee Tracking**, and **Document Vault Attachments**.

---

## 1. Architecture Overview

AssetHub models all investments using a polymorphic `Asset` entity with JPA **`InheritanceType.JOINED`**. This enables a shared base table for metadata (name, user, family group, purchase date, notes, currency, nominee) while isolating subtype-specific columns in dedicated relational tables.

```
                      +-------------------+
                      |   assets (Base)   |
                      +-------------------+
                                |
      +-------------------------+-------------------------+-------------------------+
      |            |            |            |            |            |            |
+-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +-----------+
|  stocks   | |mutual_fund| |gold_items | |fixed_dep  | |real_estate| |  cryptos  | |   bonds   |
+-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +-----------+ +-----------+
                                                                                          |
                                                                                    +-----------+
                                                                                    | esop_rsus |
                                                                                    +-----------+
```

### Key Modules:
- `com.wealthmap.entity.base.Asset`: Base class with `@Inheritance(strategy = InheritanceType.JOINED)`.
- `com.wealthmap.service.assets.*`: Subtype-specific service layer (`StockService`, `MutualFundService`, `GoldService`, `FixedDepositService`, `RealEstateService`, `CryptoService`, `BondService`, `EsopRsuService`).
- `com.wealthmap.service.price.*`: Live valuation providers implementing `PriceProvider` interface (`StockPriceProvider`, `MutualFundPriceProvider`, `GoldPriceProvider`, `CryptoPriceProvider`).
- `com.wealthmap.service.CurrencyConversionService`: Multi-currency forex converter caching live FX rates from Yahoo Finance.

---

## 2. Asset Subtypes & Valuation Engines

### 2.1 Stocks & Equities (`Stock.java`)
- **Integration**: Yahoo Finance API.
- **Valuation**: $\text{Current Value} = \text{Quantity} \times \text{Live Market Price}$.
- **Multi-Currency**: Supports US equities (`USD`) and Indian equities (`NSE/BSE` in `INR`). Converted to INR using live FX rates for portfolio rollups.
- **Search**: Typeahead ticker autocomplete with debounced API queries.

### 2.2 Mutual Funds (`MutualFund.java`)
- **Integration**: AMFI India (Association of Mutual Funds in India) daily NAV API.
- **Valuation**: $\text{Current Value} = \text{Units} \times \text{Current NAV}$.
- **Search**: Fast in-memory / cached search across 10,000+ mutual fund schemes.

### 2.3 Physical Gold (`GoldItem.java`)
- **Integration**: Live Spot Gold (USD/Ounce) from Yahoo Finance / GoldAPI + USD/INR conversion.
- **Valuation Engine**:
  $$\text{Price per Gram (24K)} = \left(\frac{\text{Spot Price USD}}{31.1035}\right) \times \text{USDINR Rate} \times (1 + \text{Indian Duty \& Premium})$$
  $$\text{Holding Value} = \text{Grams} \times \text{Price per Gram} \times \text{Purity Factor (24K: 1.0, 22K: 0.916, 18K: 0.75)}$$

### 2.4 Fixed Deposits (`FixedDeposit.java`)
- **Valuation Engine**: Exact daily compound interest accrual:
  $$A = P \times \left(1 + \frac{r}{n}\right)^{n \times t}$$
  where $P$ is principal, $r$ is annual interest rate, $n$ is compounding frequency (Quarterly = 4), and $t$ is elapsed years since start date.
- **Maturity Projection**: Calculates expected maturity payout and days remaining.

### 2.5 Bonds, Debentures & PPF/NPS (`Bond.java`)
- **Subtypes**: `GOVERNMENT_BOND`, `CORPORATE_BOND`, `PPF`, `NPS`, `SOVEREIGN_GOLD_BOND`, `OTHER`.
- **Valuation**:
  - **SGB**: Tracked against live gold spot price + 2.5% annual semi-annual coupon math.
  - **PPF / NPS / Bonds**: Simple or compound interest compounding based on annual coupon rate.

### 2.6 ESOPs & RSUs (`EsopRsu.java`)
- **Valuation**:
  - `Vested Value` $= \text{Vested Shares} \times \text{Live Ticker Price}$.
  - `Unvested Value` $= (\text{Total Shares} - \text{Vested Shares}) \times \text{Live Ticker Price}$.
  - `Net Gain` $= (\text{Live Price} - \text{Strike Price}) \times \text{Vested Shares}$.

### 2.7 Real Estate (`RealEstate.java`)
- **Valuation**: User-estimated market valuation with historical acquisition price tracking.

### 2.8 Cryptocurrencies (`Crypto.java`)
- **Integration**: CoinGecko live price API.
- **Valuation**: $\text{Current Value} = \text{Holding Quantity} \times \text{Live Crypto USD/INR Price}$.

---

## 3. Multi-Currency & Forex Engine (`CurrencyConversionService`)

- **Supported Currencies**: `INR`, `USD`, `EUR`, `GBP`, `AED`, `SGD`, `CAD`, `AUD`, `JPY`, `CHF`.
- **Live Forex Feeds**: Queries live exchange pairs from Yahoo Finance (`USDINR=X`, `EURINR=X`, etc.) with `@Cacheable("forexRates")`.
- **Offline Fallback**: In case of external network disruption, built-in conservative fallback rates ensure continuous portfolio calculation without crashes.
- **Dual Display Contract**: Returns original currency quantities and purchase amounts alongside converted INR values for dashboard consistency.

---

## 4. Nominees & Document Vault Attachments

- **Nominee Tracking**: Every asset entity includes `nomineeName` and `nomineeRelationship` (`SPOUSE`, `CHILD`, `PARENT`, `SIBLING`, `OTHER`), exposed across forms and cards.
- **Document Vault**: Integrates with Google Drive API (`drive.file` scope) to attach bank certificates, FD receipts, and gold purchase invoices directly to specific asset records via `DocumentController`.
