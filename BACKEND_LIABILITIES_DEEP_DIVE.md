# Backend Liabilities & Debt Engine Deep Dive

This document covers AssetHub’s liability tracking architecture, reducing-balance EMI amortization engine, True Net Worth calculation, and loan document vault attachments.

---

## 1. Architecture Overview

Liabilities in AssetHub are designed to pair with assets to compute an accurate, real-time **True Net Worth** metric ($\text{Assets} - \text{Liabilities}$) rather than just a gross asset sum.

```
                      +------------------------+
                      |   liabilities (Base)   |
                      +------------------------+
                                  |
      +---------------------------+---------------------------+
      |             |             |             |             |
+------------+ +------------+ +------------+ +------------+ +------------+
| home_loans | |personal_ln | |education_ln| | vehicle_ln | |credit_cards|
+------------+ +------------+ +------------+ +------------+ +------------+
```

### Key Components:
- `com.wealthmap.entity.Liability`: Base class with `@Inheritance(strategy = InheritanceType.JOINED)`.
- `com.wealthmap.controller.LiabilityController`: REST endpoints (`/api/liabilities/**`) for adding, editing, deleting, and fetching liabilities.
- `com.wealthmap.service.LiabilityService`: Business logic, currency conversion, and ownership verification.
- `com.wealthmap.repository.LiabilityRepository`: JPA data access with multi-tenant filtering.

---

## 2. Polymorphic Liability Categories

1. **Home Loans (`HOME_LOAN`)**: Tracks property-linked mortgage debt, lender name, tenure, and floating interest rates.
2. **Personal Loans (`PERSONAL_LOAN`)**: Fixed-rate personal borrowings.
3. **Education Loans (`EDUCATION_LOAN`)**: Student loan financing with repayment moratorium tracking.
4. **Vehicle Loans (`VEHICLE_LOAN`)**: Auto/two-wheeler financing.
5. **Credit Card Debt (`CREDIT_CARD`)**: Revolving revolving debt with high APR tracking.
6. **Other Liabilities (`OTHER`)**: Informal borrowings, private notes, and business debts.

---

## 3. Financial Mathematics & Amortization Engine

### 3.1 Reducing-Balance EMI & Amortization Formula
For any liability with principal balance $P$, annual interest rate $r$ (decimal), monthly rate $i = \frac{r}{12}$, and tenure $N$ months:

$$\text{Monthly EMI} = P \times \frac{i \times (1 + i)^N}{(1 + i)^N - 1}$$

For each payment step $m$:
- $\text{Monthly Interest}_m = \text{Remaining Balance}_{m-1} \times i$
- $\text{Principal Paid}_m = \text{EMI} - \text{Monthly Interest}_m$
- $\text{Remaining Balance}_m = \text{Remaining Balance}_{m-1} - \text{Principal Paid}_m$

The engine aggregates:
- **Total Interest Payable**: $\sum \text{Monthly Interest}_m$
- **Projected Payoff Date**: Derived by stepping through amortization iterations until balance reaches zero.

### 3.2 True Net Worth & Debt-to-Asset Ratio
$$\text{True Net Worth} = \sum \text{Converted Assets (INR)} - \sum \text{Converted Liabilities (INR)}$$
$$\text{Debt-to-Asset Ratio} = \left(\frac{\sum \text{Total Outstanding Liabilities}}{\sum \text{Total Current Asset Value}}\right) \times 100$$

---

## 4. Document Vault & Multi-Currency Support

- **Sanction Letters & Agreements**: Users can upload loan sanction PDFs and repayment schedules directly to the Google Drive Document Vault linked to the liability entity ID.
- **Multi-Currency Loans**: Foreign borrowings (e.g. US student loans in USD) are converted to INR via `CurrencyConversionService` using real-time forex rates, ensuring multi-currency debt accurately offsets global assets.
