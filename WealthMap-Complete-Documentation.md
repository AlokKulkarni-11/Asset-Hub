# WealthMap (Asset Hub) - Complete Project Documentation

---

## 1. Project Overview

**WealthMap** (also called **Asset Hub**) is a premium, full-stack personal wealth tracking application that gives users absolute clarity over their financial net worth. Unlike simple ledgers, WealthMap is a **smart, dynamic portfolio manager** that tracks heterogeneous asset classes (Physical Gold, Fixed Deposits, Stocks, Mutual Funds, Real Estate) and dynamically calculates their real-time current market value using live integrations and exact financial mathematics.

### Key Differentiator
Most net-worth trackers just let you type in a number. WealthMap fetches **live market prices** (Yahoo Finance for stocks, AMFI for mutual funds, spot gold prices with INR forex conversion) and computes compound interest mathematically for FDs — all in real-time.

---

## 2. Tech Stack & Why Each Was Chosen

### Frontend

| Technology | Version | Why Used | Alternatives Considered |
|---|---|---|---|
| **React** | 19.2.7 | Component-based UI library; largest ecosystem; virtual DOM for efficient re-renders | Vue.js (simpler but smaller ecosystem), Angular (overkill for SPA) |
| **TypeScript** | 6.0.2 | Static typing catches bugs at compile-time; better IDE support; self-documenting code | JavaScript (no type safety), Flow (deprecated) |
| **Vite** | 8.1.0 | Blazing fast dev server (ESM-based HMR); instant cold start; optimized build | Create React App (slow, deprecated), Webpack (complex config) |
| **TailwindCSS** | 3.4.19 | Utility-first CSS; rapid prototyping; no CSS-in-JS runtime overhead | CSS Modules (no utility classes), Styled Components (runtime overhead) |
| **Zustand** | 5.0.14 | Minimal boilerplate state management; no providers needed; works outside React | Redux (verbose), Recoil (complex), Context API (re-render issues) |
| **React Query (TanStack)** | 5.101.1 | Server-state management; caching; background refetching; deduplication of requests | SWR (less features), Redux Query (more boilerplate) |
| **React Router** | 7.18.0 | Declarative routing; nested routes; URL-based navigation | TanStack Router (newer, less mature), Wouter (minimal) |
| **React Hook Form** | 7.80.0 | Performant forms (uncontrolled); minimal re-renders; easy validation integration | Formik (more re-renders), manual useState (tedious) |
| **Zod** | 4.4.3 | TypeScript-first schema validation; co-located with forms; runtime + compile-time safety | Yup (JS-first, less TS integration), Joi (verbose) |
| **Recharts** | 3.9.0 | Declarative chart components; built on D3; responsive containers | Chart.js (imperative), Victory (heavier), Nivo (less React-native) |
| **Axios** | 1.18.1 | Interceptors for JWT injection; automatic JSON parsing; request/response transformation | Fetch API (manual headers), ky (less popular) |
| **Lucide React** | 1.21.0 | Beautiful, consistent icons; tree-shakeable; lightweight | React Icons (less consistent), Heroicons (fewer icons) |

### Backend

| Technology | Version | Why Used | Alternatives Considered |
|---|---|---|---|
| **Java** | 17 | LTS version; mature ecosystem; strong typing; enterprise-grade | Python (less performant), Node.js (single-threaded), Go (less ecosystem) |
| **Spring Boot** | 3.2.4 | Convention over configuration; auto-config; production-ready; massive ecosystem | Micronaut (smaller community), Quarkus (newer), Vert.x (too low-level) |
| **Spring Data JPA** | - | Repository pattern; automatic CRUD; HQL support; reduces boilerplate | JDBC Template (more SQL), jOOQ (complex), Mongo (NoSQL) |
| **Hibernate** | - | ORM for Java; lazy loading; caching; dialect management | EclipseLink (less popular), MyBatis (SQL-centric) |
| **PostgreSQL** | - | ACID compliance; JSON support; row-level security; reliable | MySQL (less features), H2 (in-memory, not for prod), MongoDB (schemaless) |
| **Spring Security** | - | Authentication/Authorization framework; filters; session management | Apache Shiro (less Spring integration), custom filters (reinventing wheel) |
| **JWT (jjwt)** | 0.12.5 | Stateless auth; no server-side session; scalable across instances | Session-based (server memory), OAuth2 (overkill for this) |
| **Lombok** | - | Reduces boilerplate (@Data, @Builder, @RequiredArgsConstructor) | Manual getters/setters (tedious), Record classes (immutable, not for JPA entities) |
| **Caffeine** | - | High-performance in-memory cache; Spring-native integration | Ehcache (heavier), Redis (external dependency), Guava Cache (less Spring integration) |
| **Brevo API** | - | Transactional email service; SMTP replacement; reliable delivery | SendGrid, AWS SES, Mailgun |
| **Yahoo Finance API** | - | Free live stock/mutual fund/gold prices; no API key needed for basic usage | Alpha Vantage (limited free tier), Twelve Data (paid) |

---

## 3. Architecture & Project Structure

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────┐
│                 Frontend                     │
│  React 19 + TypeScript + Vite + TailwindCSS  │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Zustand   │  │ React    │  │ React     │ │
│  │ (Auth)    │  │ Query    │  │ Hook Form │ │
│  │           │  │ (Server  │  │ + Zod     │ │
│  │           │  │  State)  │  │           │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │     Axios (HTTP Client + Interceptors)    ││
│  └──────────────────────────────────────────┘│
└────────────────────┬────────────────────────┘
                     │ HTTP/REST API
                     ▼
┌─────────────────────────────────────────────┐
│                 Backend                      │
│        Java 17 + Spring Boot 3.2            │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │     Security Filter Chain             │   │
│  │  (JwtAuthFilter → Authentication)     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │Controllers│  │ Services │  │Repositories│ │
│  │ (REST)    │  │ (Logic)  │  │ (Data)     │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │      Price Provider Factory           │   │
│  │  (Strategy Pattern for live prices)   │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │     Caffeine Cache + PostgreSQL       │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### 3.2 Frontend Structure

```
wealthmap-frontend/src/
├── api/                    # API layer (Axios instances + API functions)
│   ├── axios.ts           # Axios instance with interceptors
│   ├── assets.api.ts      # Asset CRUD operations
│   ├── snapshots.api.ts   # Net worth snapshot operations
│   ├── family.api.ts      # Family group operations
│   └── users.api.ts       # User profile operations
├── store/                  # State management
│   └── authStore.ts       # Zustand auth store (token + user)
├── pages/                  # Route-level components
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Assets.tsx
│   ├── Family.tsx
│   ├── Maturities.tsx
│   └── Profile.tsx
├── components/
│   ├── layout/            # Layout components
│   │   ├── AppLayout.tsx  # Main layout with sidebar
│   │   ├── Sidebar.tsx    # Desktop sidebar
│   │   ├── Topbar.tsx     # Top navigation bar
│   │   └── MobileNav.tsx  # Mobile bottom nav
│   ├── forms/             # Form components
│   │   ├── AddStockForm.tsx
│   │   ├── AddGoldForm.tsx
│   │   ├── AddFDForm.tsx
│   │   ├── AddMutualFundForm.tsx
│   │   ├── AddRealEstateForm.tsx
│   │   ├── AssetSelectorModal.tsx
│   │   ├── ForgotPasswordModal.tsx
│   │   └── ChangePasswordModal.tsx
│   ├── ui/                # Reusable UI components
│   │   └── ConfirmDialog.tsx
│   └── ErrorBoundary.tsx  # Error boundary component
├── providers/
│   └── ThemeProvider.tsx  # Theme context provider
├── App.tsx                # Root component with routing
├── main.tsx               # Entry point
└── index.css              # Global styles + TailwindCSS
```

### 3.3 Backend Structure

```
wealthmap-backend/src/main/java/com/wealthmap/
├── WealthmapApplication.java          # Spring Boot entry point
├── config/
│   ├── SecurityConfig.java            # Spring Security configuration
│   └── CacheConfig.java               # Caffeine cache configuration
├── security/
│   ├── JwtUtil.java                   # JWT token generation/validation
│   ├── JwtAuthFilter.java             # JWT authentication filter
│   └── UserDetailsServiceImpl.java    # UserDetailsService implementation
├── entity/
│   ├── base/
│   │   └── Asset.java                 # Abstract base entity (JPA inheritance)
│   ├── User.java                      # User entity
│   ├── GoldItem.java                  # Gold asset entity
│   ├── Stock.java                     # Stock asset entity
│   ├── MutualFund.java                # Mutual fund entity
│   ├── FixedDeposit.java              # Fixed deposit entity
│   ├── RealEstate.java                # Real estate entity
│   ├── FamilyGroup.java               # Family group entity
│   ├── FamilyInvite.java              # Family invitation entity
│   ├── NetWorthSnapshot.java          # Net worth history entity
│   └── PasswordResetToken.java        # Password reset OTP entity
├── enums/
│   ├── AssetType.java                 # Asset type enumeration
│   ├── GoldPurity.java                # Gold purity levels (K18-K24)
│   ├── CompoundingFrequency.java      # FD compounding frequencies
│   └── RelationType.java              # Family relation types
├── dto/
│   ├── request/                       # Request DTOs (input)
│   │   ├── LoginRequest.java
│   │   ├── RegisterRequest.java
│   │   ├── StockRequest.java
│   │   ├── GoldRequest.java
│   │   ├── FixedDepositRequest.java
│   │   ├── MutualFundRequest.java
│   │   ├── RealEstateRequest.java
│   │   └── ...
│   └── response/                      # Response DTOs (output)
│       ├── AuthResponse.java
│       ├── AssetResponse.java
│       ├── StockResponse.java
│       ├── GoldResponse.java
│       └── ...
├── repository/                        # Spring Data JPA repositories
│   ├── UserRepository.java
│   ├── AssetRepository.java
│   ├── FamilyGroupRepository.java
│   ├── FamilyInviteRepository.java
│   ├── NetWorthSnapshotRepository.java
│   └── PasswordResetTokenRepository.java
├── service/
│   ├── UserService.java               # User profile management
│   ├── SnapshotService.java           # Net worth snapshots
│   ├── PasswordResetService.java      # OTP-based password reset
│   ├── EmailService.java              # Brevo email integration
│   ├── FamilyGroupService.java        # Family group management
│   ├── assets/                        # Asset-specific services
│   │   ├── GoldService.java
│   │   ├── StockService.java
│   │   ├── MutualFundService.java
│   │   ├── FixedDepositService.java
│   │   └── RealEstateService.java
│   └── price/                         # Price provider system
│       ├── PriceProvider.java         # Interface
│       ├── PriceProviderFactory.java  # Factory (Strategy Pattern)
│       ├── StockPriceProvider.java    # Yahoo Finance integration
│       ├── MutualFundPriceProvider.java # AMFI NAV integration
│       ├── GoldPriceProvider.java     # Gold + Forex integration
│       ├── FormulaBasedPriceProvider.java # Compound interest calculator
│       └── RealEstatePriceProvider.java # User-provided valuation
└── controller/                        # REST API controllers
    ├── AuthController.java            # /api/auth/*
    ├── AssetController.java           # /api/assets/*
    ├── SnapshotController.java        # /api/snapshots/*
    ├── FamilyGroupController.java     # /api/family/*
    ├── UserController.java            # /api/users/*
    ├── MarketController.java          # /api/market/*
    ├── GoldController.java            # /api/gold/*
    ├── FixedIncomeController.java     # /api/fd/*
    └── MigrationController.java       # /api/migrate/*
```

---

## 4. Design Patterns Used

### 4.1 Strategy Pattern (Price Provider System)

**Where:** `wealthmap-backend/src/main/java/com/wealthmap/service/price/`

**Why Implemented:**
The application needs to calculate the current value of different asset types, each requiring completely different pricing logic:
- **Stocks:** Fetch live price from Yahoo Finance API
- **Mutual Funds:** Fetch live NAV from AMFI (bulk download)
- **Gold:** Fetch spot gold price (USD), convert via forex (INR), apply purity multiplier
- **Fixed Deposits:** Calculate compound interest using `A = P(1 + r/n)^(nt)`
- **Real Estate:** Return user-provided estimated value

**How It Works:**
```java
// Interface defines the contract
public interface PriceProvider {
    BigDecimal getCurrentPrice(Asset asset);
    boolean supports(AssetType type);
}

// Factory selects the right provider
@Component
public class PriceProviderFactory {
    public PriceProvider getProvider(AssetType assetType) {
        switch (assetType) {
            case GOLD: return goldPriceProvider;
            case STOCK: return stockPriceProvider;
            case MUTUAL_FUND: return mutualFundPriceProvider;
            case FIXED_DEPOSIT: return formulaBasedPriceProvider;
            case REAL_ESTATE: return realEstatePriceProvider;
            default: throw new IllegalArgumentException("No provider");
        }
    }
}
```

**Interview Talking Points:**
- **Open/Closed Principle:** New asset types can be added by creating a new `PriceProvider` implementation without modifying existing code.
- **Single Responsibility:** Each provider handles one asset type's pricing logic.
- **Factory Pattern:** Centralizes object creation and selection logic.
- **Alternatives:** Could use Spring's `@Qualifier` annotation, or a `Map<AssetType, PriceProvider>` for O(1) lookup instead of switch.

---

### 4.2 Template Method Pattern (Asset Entity Hierarchy)

**Where:** `wealthmap-backend/src/main/java/com/wealthmap/entity/base/Asset.java`

**Why Implemented:**
All asset types share common fields (id, name, purchaseDate, user, familyGroup, assetType, timestamps) but differ in their specific attributes and how they calculate `investedAmount`.

**How It Works:**
```java
@Entity
@Table(name = "assets")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Asset {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private LocalDate purchaseDate;
    // ... common fields ...
    
    // Template method - each subclass MUST implement
    public abstract BigDecimal getInvestedAmount();
}

// Subclass implementation
@Entity
public class Stock extends Asset {
    private BigDecimal quantity;
    private BigDecimal averageBuyPrice;
    
    @Override
    public BigDecimal getInvestedAmount() {
        return quantity.multiply(averageBuyPrice);
    }
}
```

**Interview Talking Points:**
- **Polymorphism:** Same `getInvestedAmount()` call, different behavior per subclass.
- **JOINED Inheritance:** Each subclass gets its own table joined by FK to parent `assets` table.
- **Alternatives:** Could use `SINGLE_TABLE` inheritance (one table with type discriminator column) — trades off schema purity for query performance.

---

### 4.3 Repository Pattern (Data Access Layer)

**Where:** `wealthmap-backend/src/main/java/com/wealthmap/repository/`

**Why Implemented:**
Abstracts database access logic from business logic. Spring Data JPA auto-generates CRUD implementations.

**How It Works:**
```java
@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {
    List<Asset> findByUserId(Long userId);
    List<Asset> findByUserIdAndAssetType(Long userId, AssetType assetType);
    // Spring Data auto-generates the implementation!
}
```

**Interview Talking Points:**
- **Spring Data JPA:** Derives SQL queries from method names (query derivation).
- **Benefit:** Zero boilerplate for CRUD; custom queries via method naming conventions.
- **Alternatives:** `@Query` annotation for custom JPQL, Native SQL queries for complex joins.

---

### 4.4 Observer Pattern (React Query Server State)

**Where:** `wealthmap-frontend/src/App.tsx` and all page components

**Why Implemented:**
React Query treats server state differently from client state. It observes (subscribes to) query keys and automatically refetches when data becomes stale.

**How It Works:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
    },
  },
});

// In component - automatic subscription
const { data: assets, isLoading } = useQuery({
  queryKey: ['assets', 'all'],     // Cache key
  queryFn: getAllAssets,            // Fetch function
});

// After mutation - invalidate cache
queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
```

**Interview Talking Points:**
- **Stale-While-Revalidate:** Serves cached data first, then refetches in background.
- **Cache Deduplication:** Multiple components using same query key share the same cache entry.
- **Optimistic Updates:** Can update UI before server confirms (not implemented here but possible).
- **Alternatives:** SWR (simpler but fewer features), Redux Toolkit Query (more boilerplate).

---

### 4.5 Singleton Pattern (Zustand Store)

**Where:** `wealthmap-frontend/src/store/authStore.ts`

**Why Implemented:**
Auth state (token, user info) needs to be globally accessible across all components without prop drilling.

**How It Works:**
```typescript
export const useAuthStore = create<AuthState>((set) => {
  // Initialize from localStorage (survives page refresh)
  const token = localStorage.getItem('wealthmap_token');
  const userJson = localStorage.getItem('wealthmap_user');
  
  return {
    token,
    user: userJson ? JSON.parse(userJson) : null,
    isAuthenticated: !!token,
    login: (token, user) => {
      localStorage.setItem('wealthmap_token', token);
      localStorage.setItem('wealthmap_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('wealthmap_token');
      localStorage.removeItem('wealthmap_user');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
```

**Interview Talking Points:**
- **Zustand vs Redux:** Zustand is ~1KB vs Redux's ~11KB; no boilerplate; no providers needed.
- **Persistence:** Uses `localStorage` for JWT persistence across page refreshes.
- **Selector Pattern:** Components subscribe to specific slices of state (`useAuthStore((state) => state.isAuthenticated)`) to minimize re-renders.

---

## 5. Authentication & Security Flow

### 5.1 Registration Flow

```
1. User fills RegisterForm → React Hook Form + Zod validation
2. POST /api/auth/register → AuthController
3. Check if email exists → UserRepository.existsByEmail()
4. BCrypt hash password → PasswordEncoder.encode()
5. Save User → UserRepository.save()
6. Generate JWT → JwtUtil.generateToken()
7. Return AuthResponse { token, id, email, name }
8. Frontend stores token + user in Zustand store + localStorage
```

### 5.2 Login Flow

```
1. User fills LoginForm → React Hook Form + Zod validation
2. POST /api/auth/login → AuthController
3. AuthenticationManager.authenticate() → Spring Security validates credentials
4. JwtUtil.generateToken() → Creates JWT with HS256 signing
5. Return AuthResponse
6. Frontend stores in Zustand + localStorage
7. Navigate to / (Dashboard)
```

### 5.3 JWT Token Flow (Subsequent Requests)

```
1. User makes API call (e.g., GET /api/assets)
2. Axios interceptor reads token from localStorage
3. Adds header: Authorization: Bearer <token>
4. Request hits Spring Security filter chain
5. JwtAuthFilter.doFilterInternal():
   a. Extracts token from Authorization header
   b. Extracts email from token (subject claim)
   c. Loads UserDetails from database
   d. Validates token (signature + expiration)
   e. Creates UsernamePasswordAuthenticationToken
   f. Sets authentication in SecurityContextHolder
6. Controller receives authenticated request
7. Gets user email from Authentication object
8. Returns user-specific data
```

### 5.4 JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user@example.com",    // Subject (email)
    "iat": 1719900000,            // Issued at
    "exp": 1720504800             // Expiration
  },
  "signature": "HMACSHA256(base64(header) + '.' + base64(payload), secret)"
}
```

**Interview Talking Points:**
- **Stateless:** Server doesn't store session; token carries all needed info.
- **HS256:** HMAC-SHA256 symmetric signing (same secret for sign + verify).
- **Why JWT over Session:** Scalable across multiple server instances; no shared session store.
- **Security:** BCrypt for password hashing (one-way); JWT secret stored in `.env` file.

---

## 6. Real-Time Pricing Engine

### 6.1 Stock Pricing (`StockPriceProvider`)

**Data Source:** Yahoo Finance API (`query2.finance.yahoo.com/v8/finance/chart/{ticker}`)

**How It Works:**
1. Takes a `Stock` entity with `ticker` (e.g., "RELIANCE.NS")
2. Fetches live price from Yahoo Finance REST API
3. Parses JSON response → extracts `regularMarketPrice`
4. Multiplies by `quantity` to get current portfolio value
5. Falls back to `investedAmount` if API fails

**Key Code:**
```java
String url = "https://query2.finance.yahoo.com/v8/finance/chart/" + stock.getTicker();
// Parse: chart.result[0].meta.regularMarketPrice
double currentPrice = rootNode.path("chart").path("result").get(0)
    .path("meta").path("regularMarketPrice").asDouble();
return BigDecimal.valueOf(currentPrice).multiply(qty);
```

**Why Yahoo Finance:** Free tier, no API key required for basic chart data, supports Indian stock exchanges (NSE/BSE via `.NS`/`.BO` suffix).

**Alternatives:** Alpha Vantage (limited to 5 calls/min free), Twelve Data (paid), Google Finance (no official API).

---

### 6.2 Mutual Fund Pricing (`MutualFundPriceProvider`)

**Data Source:** AMFI India (`amfiindia.com/spages/NAVAll.txt`)

**How It Works:**
1. On first call (or after 12-hour cache expiry), downloads entire NAV list (~50,000+ schemes)
2. Parses semicolon-delimited text file
3. Caches scheme codes → NAV values in `ConcurrentHashMap`
4. For each MutualFund entity, looks up NAV by `schemeCode`
5. Calculates: `currentValue = units × currentNAV`

**Why Bulk Download:** AMFI doesn't have a per-scheme API; the NAVAll.txt file is the only reliable source. Downloading once and caching is more efficient than 50,000 individual API calls.

**Cache Strategy:**
```java
private final Map<String, BigDecimal> navCache = new ConcurrentHashMap<>();
private static final long CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

private void refreshCacheIfNeeded() {
    if (System.currentTimeMillis() - lastFetchTime > CACHE_EXPIRY_MS || navCache.isEmpty()) {
        // Download and parse NAVAll.txt
    }
}
```

---

### 6.3 Gold Pricing (`GoldPriceProvider`)

**Data Sources:**
1. Yahoo Finance for spot gold: `GC=F` (Gold Futures)
2. Yahoo Finance for forex: `INR=X` (USD/INR rate)

**How It Works:**
1. Fetches gold spot price in USD per troy ounce from Yahoo Finance
2. Fetches current USD/INR exchange rate
3. Converts: `INR_per_gram = (USD_per_ounce × USD_to_INR) / 31.1035`
4. Adds 15% premium for Indian domestic physical gold (import duty + making charges)
5. Multiplies by `weightGrams × purityMultiplier`

**Key Calculation:**
```java
// 1 Troy Ounce = 31.1034768 grams
double inrPerOunce = usdPerOunce * usdToInr;
double inrPerGram = inrPerOunce / 31.1034768;

// Add 15% domestic premium (import duty + making charges)
double indianDomesticPricePerGram = inrPerGram * 1.15;

// Final value
return pureWeight.multiply(pricePerGramINR);
```

**Why 15% Premium:** Indian government imposes import duties (~15%) on gold imports, plus jeweler making charges. This makes Indian gold prices consistently higher than international spot prices.

**Caching:** Uses Spring `@Cacheable` annotation with Caffeine cache (1-hour expiry).

---

### 6.4 Fixed Deposit Pricing (`FormulaBasedPriceProvider`)

**Formula:** `A = P(1 + r/n)^(nt)` (Compound Interest)

**How It Works:**
1. Takes `FixedDeposit` entity with: principalAmount, interestRate, startDate, maturityDate, compoundingFrequency
2. Calculates elapsed time in years: `daysElapsed / 365.25`
3. Applies compound interest formula based on frequency

**Key Code:**
```java
private BigDecimal calculateFDValue(FixedDeposit fd, LocalDate targetDate) {
    long daysElapsed = ChronoUnit.DAYS.between(fd.getStartDate(), endDate);
    double yearsElapsed = daysElapsed / 365.25;
    
    double p = fd.getPrincipalAmount().doubleValue();
    double r = fd.getInterestRate().doubleValue() / 100.0;
    int n = fd.getCompoundingFrequency().getPeriodsPerYear(); // 12, 4, 2, or 1
    
    double amount = p * Math.pow(1 + (r / n), n * yearsElapsed);
    return BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP);
}
```

**Compounding Frequencies:**
```java
public enum CompoundingFrequency {
    MONTHLY(12),      // 12 periods/year
    QUARTERLY(4),     // 4 periods/year
    HALF_YEARLY(2),   // 2 periods/year
    YEARLY(1);        // 1 period/year
}
```

**Why Compound Interest:** FDs compound interest at regular intervals (quarterly is most common in India). Simple interest would underestimate the value.

**Alternatives:** Could use a lookup table for common FD rates, but formula-based is more flexible.

---

### 6.5 Real Estate Pricing (`RealEstatePriceProvider`)

**How It Works:** Simply returns the user-provided `estimatedCurrentValue`. No external API call.

**Why:** Real estate valuations are subjective and location-dependent. No reliable free API exists for Indian property valuations. User provides their best estimate.

---

## 7. Database Schema & JPA Inheritance

### 7.1 Inheritance Strategy: JOINED

```
┌─────────────────────┐
│      assets          │  (Parent table)
│─────────────────────│
│ id (PK)             │
│ name                │
│ purchase_date       │
│ notes               │
│ user_id (FK)        │
│ family_group_id(FK) │
│ asset_type          │
│ created_at          │
│ updated_at          │
└─────────┬───────────┘
          │
    ┌─────┴─────┬──────────┬─────────────┬──────────────┐
    │           │          │             │              │
┌───▼───┐ ┌────▼────┐ ┌───▼────┐ ┌─────▼──────┐ ┌────▼──────┐
│stocks │ │gold_items│ │mutual_ │ │fixed_      │ │real_      │
│       │ │          │ │funds   │ │deposits    │ │estate     │
│───────│ │──────────│ │────────│ │────────────│ │───────────│
│ticker │ │weight_   │ │scheme_ │ │bank_name   │ │property_  │
│company│ │grams     │ │code    │ │start_date  │ │name       │
│qty    │ │purity    │ │folio_  │ │maturity_   │ │property_  │
│avg_   │ │purchase_ │ │units   │ │date        │ │type       │
│price  │ │price     │ │avg_nav │ │principal   │ │purchase_  │
│       │ │          │ │        │ │interest_   │ │price      │
│       │ │          │ │        │ │rate        │ │estimated_ │
│       │ │          │ │        │ │compounding │ │current_   │
│       │ │          │ │        │ │frequency   │ │value      │
└───────┘ └──────────┘ └────────┘ └────────────┘ └───────────┘
```

**Why JOINED Inheritance:**
- **Normalization:** No NULL columns; each subtype only stores its specific fields.
- **Query Performance:** Polymorphic queries require JOINs (slower than SINGLE_TABLE).
- **Schema Clarity:** Each asset type has its own table with only relevant columns.

**Alternatives:**
- `SINGLE_TABLE`: One big table with all columns; type discriminator column. Faster queries but many NULLs.
- `TABLE_PER_CLASS`: Each class gets its own complete table. No JOINs but no polymorphic queries.

---

## 8. Frontend Component Deep-Dive

### 8.1 React Hook Form + Zod (Form Management)

**Why React Hook Form:**
- **Uncontrolled Components:** Uses `ref` instead of state, minimizing re-renders.
- **Validation:** Integrates with Zod for schema-based validation.
- **Performance:** Only re-renders affected fields, not entire form.

**Example (AddStockForm):**
```typescript
// 1. Define Zod schema
const addStockSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required'),
  companyName: z.string().min(1, 'Company name is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be > 0'),
  averageBuyPrice: z.coerce.number().min(0.01, 'Buy price must be > 0'),
  notes: z.string().optional(),
});

// 2. Connect to form
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(addStockSchema),
});

// 3. Use in JSX
<input {...register('quantity')} type="number" />
{errors.quantity && <p>{errors.quantity.message}</p>}

// 4. Submit handler
const onSubmit = async (data) => {
  await addStockAsset(data);
  queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
};
```

**Interview Talking Points:**
- **Controlled vs Uncontrolled:** React Hook Form uses uncontrolled (ref-based) by default; better performance.
- **Zod vs Yup:** Zod is TypeScript-first (infers types from schema); Yup is JavaScript-first.
- **Resolver Pattern:** `zodResolver` bridges Zod's validation to React Hook Form's validation system.

---

### 8.2 Axios Interceptors (Request/Response Pipeline)

**Why Interceptors:**
- **Automatic JWT Injection:** Every request automatically includes the Bearer token.
- **Centralized Error Handling:** All 401/403 errors logged in one place.

**How It Works:**
```typescript
// Request interceptor - attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wealthmap_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status);
    // Don't auto-redirect; let components handle errors
    return Promise.reject(error);
  }
);
```

**Interview Talking Points:**
- **Chain of Responsibility:** Interceptors form a pipeline; each can modify request/response.
- **Error Handling Strategy:** Components handle errors individually (better UX) vs global redirect.
- **Alternatives:** Manual token attachment in each API call (DRY violation).

---

### 8.3 Zustand vs Redux (State Management)

**Why Zustand:**
```typescript
// Zustand: ~50 lines total
const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('wealthmap_token'),
  user: JSON.parse(localStorage.getItem('wealthmap_user')),
  isAuthenticated: !!localStorage.getItem('wealthmap_token'),
  login: (token, user) => {
    localStorage.setItem('wealthmap_token', token);
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('wealthmap_token');
    set({ token: null, isAuthenticated: false });
  },
}));

// Redux equivalent would need:
// - Action types (LOGIN, LOGOUT)
// - Action creators
// - Reducer function
// - Provider component
// - useSelector/useDispatch hooks
// Total: ~150+ lines
```

**Key Differences:**
| Feature | Zustand | Redux Toolkit |
|---|---|---|
| Boilerplate | Minimal | More verbose |
| Provider needed | No | Yes |
| Bundle size | ~1KB | ~11KB |
| Learning curve | Low | Medium |
| DevTools | Basic | Excellent |
| Middleware | Simple | Powerful |

**Interview Talking Points:**
- **When to use Redux:** Large apps with complex state logic, need DevTools time-travel debugging.
- **When to use Zustand:** Small-medium apps, want simplicity, don't need Redux ecosystem.

---

### 8.4 React Query (Server State Management)

**Why React Query:**
- **Automatic Caching:** Server data cached by query key.
- **Background Refetching:** Stale data refreshed automatically.
- **Deduplication:** Multiple components using same query share cache.
- **Optimistic Updates:** UI updates before server confirms.

**Query vs Mutation:**
```typescript
// QUERY: Read data (GET)
const { data, isLoading, error } = useQuery({
  queryKey: ['assets', 'all'],
  queryFn: getAllAssets,
  retry: 1,
  refetchOnWindowFocus: false,
});

// MUTATION: Write data (POST/PUT/DELETE)
const mutation = useMutation({
  mutationFn: addStockAsset,
  onSuccess: () => {
    // Invalidate related queries to refetch
    queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
  },
});
```

**Cache Invalidation Strategy:**
```typescript
// After any write operation, invalidate relevant queries
queryClient.invalidateQueries({ queryKey: ['assets', 'all'] });
queryClient.invalidateQueries({ queryKey: ['snapshots'] });
```

**Interview Talking Points:**
- **Server State vs Client State:** Server state is async, cacheable, shareable; client state is synchronous, local.
- **Stale Time vs Cache Time:** `staleTime` = when data becomes stale; `cacheTime` = when unused cache is garbage collected.
- **Alternatives:** SWR (simpler, less features), Redux Query (more boilerplate).

---

### 8.5 ErrorBoundary (React Error Handling)

**Why Class Component:**
React's `componentDidCatch` and `getDerivedStateFromError` lifecycle methods are only available in class components.

**How It Works:**
```typescript
class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorUI error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Interview Talking Points:**
- **Catches:** Rendering errors, lifecycle errors, constructors of child components.
- **Doesn't Catch:** Event handlers, async code, SSR, errors in ErrorBoundary itself.
- **Alternatives:** Try-catch in components (manual), global error handlers (`window.onerror`).

---

## 9. Key Annotations Explained (Interview Perspective)

### 9.1 JPA/Hibernate Annotations

```java
@Entity                          // Marks class as JPA entity (maps to DB table)
@Table(name = "assets")          // Specifies table name
@Id                              // Primary key
@GeneratedValue(strategy = GenerationType.IDENTITY)  // Auto-increment
@Column(nullable = false)        // NOT NULL constraint
@Column(unique = true)           // UNIQUE constraint
@Enumerated(EnumType.STRING)     // Store enum as String (not ordinal number)

@ManyToOne(fetch = FetchType.LAZY)  // Lazy loading (loads on access, not on query)
@JoinColumn(name = "user_id")       // FK column name

@Inheritance(strategy = InheritanceType.JOINED)  // JPA inheritance strategy
@EntityListeners(AuditingEntityListener.class)   // Enable created_at/updated_at

@CreationTimestamp               // Auto-set on INSERT
@UpdateTimestamp                 // Auto-set on UPDATE
```

**Interview Talking Points:**
- **LAZY vs EAGER Loading:** LAZY loads related entities on demand (N+1 problem if not careful); EAGER loads everything upfront (memory waste).
- **Cascade Types:** `CascadeType.ALL` = operations propagate to children; `PERSIST` = only saves.
- **ORphan Removal:** `orphanRemoval = true` deletes child when removed from parent collection.

---

### 9.2 Spring Security Annotations

```java
@Configuration                    // Marks class as configuration
@EnableWebSecurity               // Enables Spring Security
@RequiredArgsConstructor         // Lombok: constructor injection

@Bean                            // Method returns a bean managed by Spring container
@Value("${jwt.secret}")          // Injects property from application.properties
@Component                       // Marks class as Spring-managed component
@Service                         // @Component for service layer
@Repository                      // @Component for data access layer
@RestController                  // @Controller + @ResponseBody (returns JSON)
@RequestMapping("/api/assets")   // Base URL mapping
@GetMapping                      // HTTP GET endpoint
@PostMapping                     // HTTP POST endpoint
@PutMapping                      // HTTP PUT endpoint
@DeleteMapping                   // HTTP DELETE endpoint
@PathVariable                    // Extracts value from URL path
@RequestParam                     // Extracts query parameter
@RequestBody                     // Deserializes JSON body to Java object
@Valid                           // Triggers Bean Validation on @RequestBody
@Transactional                   // Database transaction boundary
@Cacheable(value = "goldPrice")  // Enables caching for method
```

**Interview Talking Points:**
- **@Transactional:** Ensures atomicity; rolls back on exception; proxy-based (doesn't work on self-invocation).
- **@Valid:** Works with Jakarta Validation (formerly javax.validation) + Zod-like constraints on DTOs.
- **@Cacheable:** First call executes method + caches; subsequent calls return cache; cache cleared on update.

---

### 9.3 Spring Boot Annotations

```java
@SpringBootApplication            // @Configuration + @EnableAutoConfiguration + @ComponentScan
@RequiredArgsConstructor         // Lombok: generates constructor for final fields
@Autowired                        // Dependency injection (field injection - discouraged)
@Value("${brevo.api.key}")       // Injects externalized property
@EnableCaching                    // Enables Spring's caching abstraction
```

**Interview Talking Points:**
- **@SpringBootApplication:** Combines three annotations; enables auto-configuration based on classpath.
- **Constructor Injection vs Field Injection:** Constructor injection is preferred (testable, immutable); field injection is convenient but harder to test.
- **Externalization:** Properties come from `application.properties`, environment variables, or `.env` files.

---

## 10. External Integrations

### 10.1 Yahoo Finance API

**Endpoints Used:**
- Stock prices: `https://query2.finance.yahoo.com/v8/finance/chart/{ticker}`
- Stock search: `https://query2.finance.yahoo.com/v1/finance/search?q={query}`
- Gold price: `https://query2.finance.yahoo.com/v8/finance/chart/GC=F`
- Forex rate: `https://query2.finance.yahoo.com/v8/finance/chart/INR=X`

**Why:** Free, no API key required, supports Indian markets (NSE/BSE).

**Limitations:** Rate limiting; unofficial API (could change without notice).

---

### 10.2 AMFI India

**Endpoint:** `https://www.amfiindia.com/spages/NAVAll.txt`

**Why:** Only official source for Indian mutual fund NAV data. Contains ~50,000+ schemes in semicolon-delimited format.

**Parsing:**
```java
String[] lines = response.split("\n");
for (String line : lines) {
    String[] parts = line.split(";");
    if (parts.length >= 5) {
        String schemeCode = parts[0].trim();
        BigDecimal nav = new BigDecimal(parts[4].trim());
        navCache.put(schemeCode, nav);
    }
}
```

---

### 10.3 Brevo API (Email Service)

**Used For:**
1. Password reset OTP emails
2. Family group invitation emails

**Endpoint:** `https://api.brevo.com/v3/smtp/email`

**Why Brevo:** Free tier (300 emails/day); reliable delivery; simple REST API.

**Alternative:** Could use `JavaMailSender` with SMTP, but Brevo handles deliverability, bounce management, etc.

---

## 11. Caching Strategy

### 11.1 Caffeine Cache Configuration

```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "goldPrice",         // Gold price cache
            "mutualFundNav",     // Mutual fund NAV cache
            "stockPrice",        // Stock price cache
            "forexRate"          // Forex rate cache
        );
        cacheManager.setCaffeine(caffeineCacheBuilder());
        return cacheManager;
    }

    Caffeine<Object, Object> caffeineCacheBuilder() {
        return Caffeine.newBuilder()
                .initialCapacity(100)      // Pre-allocate 100 entries
                .maximumSize(500)          // Max 500 entries (evicts LRU)
                .expireAfterWrite(1, TimeUnit.HOURS)  // TTL: 1 hour
                .recordStats();            // Enable cache statistics
    }
}
```

**Interview Talking Points:**
- **Caffeine vs Ehcache:** Caffeine is faster (windowTinyLfu algorithm); Ehcache supports disk persistence.
- **Cache Eviction:** LRU (Least Recently Used) when max size reached.
- **TTL (Time-To-Live):** `expireAfterWrite` ensures stale data is refreshed.
- **Why Cache External APIs:** Prevents rate limiting; reduces API call latency; improves user experience.

---

## 12. Mobile Responsiveness

### 12.1 Responsive Layout Strategy

```
Desktop (md+):
┌────────┬──────────────────────┐
│Sidebar │     Main Content     │
│(20px)  │                      │
│expand  │                      │
│on hover│                      │
└────────┴──────────────────────┘

Mobile (<md):
┌──────────────────────────────┐
│         Main Content         │
│                              │
├──────────────────────────────┤
│  🏠  💰  👨‍👩‍👧  📅  ⚙️        │  ← Bottom Nav
└──────────────────────────────┘
```

**Key Implementation:**
```typescript
// Sidebar: Hidden on mobile, hover-expand on desktop
<Sidebar className="hidden md:flex flex-col absolute left-0 top-0 bottom-0 
  w-20 hover:w-64 transition-all duration-300" />

// Mobile Nav: Only visible on mobile
<MobileNav className="md:hidden fixed bottom-0 left-0 right-0" />

// Content padding adjusts for mobile nav
<main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
```

**Interview Talking Points:**
- **Mobile-First Approach:** Start with mobile styles, add breakpoints for larger screens.
- **Touch Targets:** Mobile nav icons are 24x24px minimum for touch accessibility.
- **Safe Area:** `pb-safe` accounts for iPhone notch/home indicator.

---

## 13. Data Flow Architecture

### 13.1 Complete Data Flow (Adding a Stock)

```
User fills form
    ↓
React Hook Form + Zod validation
    ↓
onSubmit → addStockAsset(payload)
    ↓
Axios interceptor adds JWT header
    ↓
POST /api/assets/stock
    ↓
Spring Security filter chain validates JWT
    ↓
AssetController.addStock()
    ↓
StockService.addStock()
    ├── UserRepository.findByEmail()
    ├── Create Stock entity
    ├── Set user, familyGroup, assetType
    ├── AssetRepository.save()
    └── PriceProviderFactory.getProvider(STOCK)
        └── StockPriceProvider.getCurrentPrice()
            └── Yahoo Finance API call
    ↓
Return AssetResponse
    ↓
queryClient.invalidateQueries(['assets', 'all'])
    ↓
React Query refetches all assets
    ↓
Dashboard re-renders with updated data
```

---

## 14. Security Considerations

### 14.1 Password Security

- **BCrypt:** One-way hashing with salt; computationally expensive to brute-force.
- **Why BCrypt over MD5/SHA:** BCrypt is adaptive (work factor can increase with hardware); MD5/SHA are fast (vulnerable to rainbow tables).

### 14.2 CORS Configuration

```java
config.setAllowedOriginPatterns(List.of("*"));  // Allow any origin for deployment
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
config.setAllowedHeaders(List.of("*"));
config.setAllowCredentials(true);
```

**Why `*` for origins:** Render.com deployment uses dynamic subdomains. In production, restrict to specific domain.

### 14.3 Data Isolation

- **User-level isolation:** Each query filters by `user_id`.
- **Ownership check:** Before delete/update, verify `asset.user.id == currentUser.id`.
- **Family isolation:** Assets tagged with `family_group_id`; family queries only return grouped assets.

---

## 15. Future Improvements

| Feature | Why Needed | Implementation Approach |
|---|---|---|
| **Redis Caching** | Replace in-memory Caffeine for distributed caching | Spring Data Redis + `@Cacheable` with Redis backend |
| **Cryptocurrency Tracking** | Users want to track Bitcoin, Ethereum | CoinGecko API integration |
| **CSV/PDF Export** | Tax filing requires portfolio export | Apache POI (Excel), iText (PDF) |
| **Push Notifications** | FD maturity reminders | Firebase Cloud Messaging (FCM) |
| **Real-time WebSocket** | Live price updates without refresh | Spring WebSocket + STOMP |
| **OAuth2 Login** | Google/social login | Spring Security OAuth2 Client |
| **Docker Deployment** | Consistent dev/prod environments | Multi-stage Dockerfile |
| **CI/CD Pipeline** | Automated testing and deployment | GitHub Actions + Vercel/Render |

---

## 16. Interview Quick-Fire Answers

**Q: Why Spring Boot over Node.js?**
A: Type safety, mature ecosystem, excellent security framework, better for complex business logic, strong community support.

**Q: Why PostgreSQL over MongoDB?**
A: Relational data (users → assets → asset types); ACID compliance for financial data; row-level security; JOINs for complex queries.

**Q: Explain the Strategy Pattern with a real example.**
A: The PriceProviderFactory: each asset type has a different pricing strategy (Yahoo Finance for stocks, AMFI for MFs, formula for FDs). The factory selects the right strategy at runtime based on asset type.

**Q: How does JWT authentication work?**
A: Server generates signed token on login → Client stores in localStorage → Client sends token in Authorization header → Server validates signature and expiration → No server-side session needed.

**Q: Why use React Query instead of Redux for server state?**
A: React Query handles caching, refetching, deduplication, and loading/error states automatically. Redux is for client state; using it for server state creates unnecessary boilerplate.

**Q: What is the N+1 problem in JPA?**
A: When loading 100 assets, each with a user relation, lazy loading causes 100 additional queries (one per asset). Solution: Use `JOIN FETCH` in JPQL or `@EntityGraph` to load everything in one query.

**Q: Why Caffeine over Redis?**
A: Caffeine is in-memory (faster, no network latency); good for single-server deployments. Redis is better for distributed systems where multiple servers share cache.

**Q: Explain the compound interest formula used.**
A: `A = P(1 + r/n)^(nt)` where P=principal, r=annual rate, n=compounding frequency (12 for monthly), t=time in years. This gives the exact accrued value of an FD at any point in time.

---

*This document serves as a comprehensive reference for the WealthMap project. It should be updated after each major development iteration.*
