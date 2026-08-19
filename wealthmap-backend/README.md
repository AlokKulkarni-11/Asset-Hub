# WealthMap Backend

WealthMap backend is a Spring Boot API for authentication, asset and liability management, family groups, snapshots, analytics, planning, alerts, and supporting automation.

## Stack

- Java 17
- Spring Boot 3.2
- Spring Security with stateless JWT auth
- Spring Data JPA and Hibernate
- PostgreSQL
- Caffeine cache
- Spring scheduling and async execution
- Brevo email integration

## Core modules

- `controller/`
- `service/`
- `repository/`
- `entity/`
- `dto/`
- `security/`
- `config/`

## API surface

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/assets`
- `GET /api/assets/stock/search`
- `GET /api/assets/mutualfund/search`
- `GET /api/assets/crypto/search`
- `GET /api/liabilities`
- `GET /api/planning/emergency-fund`
- `GET /api/planning/sips`
- `POST /api/planning/retirement`
- `GET /api/goals`
- `GET /api/family/me`
- `GET /api/family/assets`
- `GET /api/family/rollup`
- `GET /api/snapshots`
- `POST /api/snapshots/capture`
- `GET /api/analytics/summary`
- `GET /api/analytics/benchmarks`
- `POST /api/analytics/what-if`
- `GET /api/alerts/price`
- `GET /api/alerts/notifications`
- `GET /api/alerts/rebalancing`
- `GET /api/users/profile`

## Controllers

- `AuthController` for register/login and password reset flows
- `AssetController`, `MarketController`, `GoldController`, and `FixedIncomeController` for investment assets
- `LiabilityController` for debt records
- `PlanningController` for emergency fund, SIP, and retirement planning
- `GoalController` for financial goals
- `FamilyGroupController` for family groups and rollups
- `SnapshotController` for net worth snapshots
- `AnalyticsController` for summary and benchmark data
- `AlertController` for alerts, notifications, and rebalancing
- `UserController` for profile and password updates
- `MigrationController` for auth migration support

## Security

- All routes except `/api/auth/**` require authentication
- JWTs are validated by a request filter before protected controllers run
- Passwords are hashed with BCrypt
- CORS is configured for API access across deployment environments

## Configuration

Set these environment variables when running outside the default development setup:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `GOLD_API_KEY`
- `TWELVEDATA_API_KEY`
- `BREVO_API_KEY`

`application.properties` also contains defaults for local development, including the API base URL, JWT expiry, and automation schedules.

## Run locally

- Build with Maven: `mvn clean package`
- Run the app: `mvn spring-boot:run`

## Notes

- `@EnableCaching`, `@EnableScheduling`, and `@EnableAsync` are enabled in the main application class.
- External price feeds and email workflows are handled in services, not directly in controllers.
