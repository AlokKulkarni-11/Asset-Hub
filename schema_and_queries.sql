-- ============================================================================
-- WealthMap Database Schema & SQL Query Reference
-- Dialect: PostgreSQL (Supabase / Standard PostgreSQL 14+)
-- Architecture: Spring Boot JPA with Joined Table Inheritance Strategy
-- ============================================================================

-- Drop tables if resetting database (in reverse dependency order)
/*
DROP TABLE IF EXISTS goal_tagged_assets CASCADE;
DROP TABLE IF EXISTS asset_documents CASCADE;
DROP TABLE IF EXISTS notification_histories CASCADE;
DROP TABLE IF EXISTS price_alerts CASCADE;
DROP TABLE IF EXISTS rebalancing_targets CASCADE;
DROP TABLE IF EXISTS emergency_funds CASCADE;
DROP TABLE IF EXISTS financial_goals CASCADE;
DROP TABLE IF EXISTS net_worth_snapshots CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_tfa_recovery_codes CASCADE;
DROP TABLE IF EXISTS family_invites CASCADE;

-- Asset subclass tables
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS mutual_fund CASCADE;
DROP TABLE IF EXISTS fixed_deposit CASCADE;
DROP TABLE IF EXISTS gold_items CASCADE;
DROP TABLE IF EXISTS cryptocurrencies CASCADE;
DROP TABLE IF EXISTS esop_rsus CASCADE;
DROP TABLE IF EXISTS bonds CASCADE;
DROP TABLE IF EXISTS real_estate CASCADE;
DROP TABLE IF EXISTS gold_price_history CASCADE;

-- Liability subclass tables
DROP TABLE IF EXISTS home_loans CASCADE;
DROP TABLE IF EXISTS personal_loans CASCADE;
DROP TABLE IF EXISTS vehicle_loans CASCADE;
DROP TABLE IF EXISTS education_loans CASCADE;
DROP TABLE IF EXISTS credit_card_debt CASCADE;
DROP TABLE IF EXISTS other_liabilities CASCADE;

-- Root entity tables
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS liabilities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS family_groups CASCADE;
*/

-- ============================================================================
-- 1. DDL: CORE ENTITY TABLES (Users & Family Groups)
-- ============================================================================

-- 1.1 Family Groups Table
CREATE TABLE IF NOT EXISTS family_groups (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    invite_code VARCHAR(255) NOT NULL UNIQUE,
    creator_id BIGINT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(50),
    family_group_id BIGINT REFERENCES family_groups(id) ON DELETE SET NULL,
    family_role VARCHAR(50), -- OWNER, EDITOR, VIEWER
    tfa_enabled BOOLEAN DEFAULT FALSE,
    tfa_secret VARCHAR(255),
    google_id VARCHAR(255),
    google_email VARCHAR(255),
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expires_at TIMESTAMP WITHOUT TIME ZONE,
    google_drive_folder_id VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 User 2FA Recovery Codes Table (Collection Table)
CREATE TABLE IF NOT EXISTS user_tfa_recovery_codes (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recovery_code VARCHAR(255) NOT NULL,
    PRIMARY KEY (user_id, recovery_code)
);

-- 1.4 Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    otp VARCHAR(50) NOT NULL,
    expiry_date TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- 1.5 Family Invites Table
CREATE TABLE IF NOT EXISTS family_invites (
    id BIGSERIAL PRIMARY KEY,
    family_group_id BIGINT NOT NULL REFERENCES family_groups(id) ON DELETE CASCADE,
    invitee_email VARCHAR(255) NOT NULL,
    invitee_name VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, ACCEPTED
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. DDL: ASSETS & INHERITED ASSET SUBCLASSES (Joined Strategy)
-- ============================================================================

-- 2.1 Base Assets Table
CREATE TABLE IF NOT EXISTS assets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_group_id BIGINT REFERENCES family_groups(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- GOLD, STOCK, MUTUAL_FUND, FIXED_DEPOSIT, REAL_ESTATE, CRYPTOCURRENCY, BOND, ESOP_RSU, etc.
    currency VARCHAR(10) DEFAULT 'INR',
    purchase_date DATE,
    notes TEXT,
    nominee_name VARCHAR(255),
    nominee_relationship VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 Stocks Subclass Table
CREATE TABLE IF NOT EXISTS stock (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    ticker VARCHAR(50),
    company_name VARCHAR(255),
    quantity NUMERIC(19, 4),
    average_buy_price NUMERIC(19, 4)
);

-- 2.3 Mutual Funds Subclass Table
CREATE TABLE IF NOT EXISTS mutual_fund (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    scheme_code VARCHAR(100), -- AMFI Scheme Code
    scheme_name VARCHAR(255),
    folio_number VARCHAR(100),
    units NUMERIC(19, 4),
    average_nav NUMERIC(19, 4)
);

-- 2.4 Fixed Deposits Subclass Table
CREATE TABLE IF NOT EXISTS fixed_deposit (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    bank_name VARCHAR(255),
    principal_amount NUMERIC(19, 2),
    interest_rate NUMERIC(8, 4),
    compounding_frequency VARCHAR(50), -- MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY
    start_date DATE,
    maturity_date DATE
);

-- 2.5 Gold Items Subclass Table
CREATE TABLE IF NOT EXISTS gold_items (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    weight_grams NUMERIC(10, 4) NOT NULL,
    purity VARCHAR(20) NOT NULL, -- K18, K20, K22, K24
    purchase_price NUMERIC(15, 2) NOT NULL
);

-- 2.5b Silver Items Subclass Table
CREATE TABLE IF NOT EXISTS silver_items (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    weight_grams NUMERIC(10, 4) NOT NULL,
    purity VARCHAR(20) NOT NULL, -- P999, P925, P900, P800
    purchase_price NUMERIC(15, 2) NOT NULL
);

-- 2.6 Cryptocurrencies Subclass Table
CREATE TABLE IF NOT EXISTS cryptocurrencies (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    coin_id VARCHAR(100), -- e.g. "bitcoin", "ethereum"
    symbol VARCHAR(20),   -- e.g. "BTC", "ETH"
    units NUMERIC(19, 8),
    average_buy_price NUMERIC(19, 4)
);

-- 2.7 ESOP / RSU Subclass Table
CREATE TABLE IF NOT EXISTS esop_rsus (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    plan_type VARCHAR(20), -- ESOP, RSU
    company_name VARCHAR(255),
    ticker VARCHAR(50),
    grant_date DATE,
    vesting_start_date DATE,
    total_units_granted NUMERIC(19, 4),
    vested_units NUMERIC(19, 4),
    unvested_units NUMERIC(19, 4),
    strike_price NUMERIC(19, 4),
    current_stock_price NUMERIC(19, 4)
);

-- 2.8 Bonds Subclass Table
CREATE TABLE IF NOT EXISTS bonds (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    bond_type VARCHAR(50), -- GOVERNMENT_BOND, CORPORATE_BOND, PPF, NPS, SOVEREIGN_GOLD_BOND, OTHER_DEBENTURE
    issuer VARCHAR(255),
    coupon_rate NUMERIC(8, 4),
    invested_amount NUMERIC(19, 2),
    face_value NUMERIC(19, 2),
    quantity NUMERIC(19, 4),
    compounding_frequency VARCHAR(50),
    start_date DATE,
    maturity_date DATE
);

-- 2.9 Real Estate Subclass Table
CREATE TABLE IF NOT EXISTS real_estate (
    id BIGINT PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
    property_name VARCHAR(255),
    property_type VARCHAR(100), -- RESIDENTIAL, COMMERCIAL, LAND, APARTMENT, etc.
    purchase_price NUMERIC(19, 2),
    estimated_current_value NUMERIC(19, 2)
);

-- 2.10 Gold Price History Table (Reference cache)
CREATE TABLE IF NOT EXISTS gold_price_history (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    price_per_gram_24k NUMERIC(15, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 3. DDL: LIABILITIES & INHERITED LIABILITY SUBCLASSES (Joined Strategy)
-- ============================================================================

-- 3.1 Base Liabilities Table
CREATE TABLE IF NOT EXISTS liabilities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_group_id BIGINT REFERENCES family_groups(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    liability_type VARCHAR(50) NOT NULL, -- HOME_LOAN, PERSONAL_LOAN, EDUCATION_LOAN, CREDIT_CARD_DEBT, VEHICLE_LOAN, OTHER_LIABILITY
    principal_amount NUMERIC(19, 2),
    interest_rate NUMERIC(8, 4),
    tenure_months INTEGER,
    outstanding_balance NUMERIC(19, 2),
    emi NUMERIC(19, 2),
    start_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3.2 Home Loans Subclass Table
CREATE TABLE IF NOT EXISTS home_loans (
    id BIGINT PRIMARY KEY REFERENCES liabilities(id) ON DELETE CASCADE,
    lender_name VARCHAR(255),
    property_address TEXT
);

-- 3.3 Personal Loans Subclass Table
CREATE TABLE IF NOT EXISTS personal_loans (
    id BIGINT PRIMARY KEY REFERENCES liabilities(id) ON DELETE CASCADE,
    lender_name VARCHAR(255),
    purpose VARCHAR(255)
);

-- 3.4 Vehicle Loans Subclass Table
CREATE TABLE IF NOT EXISTS vehicle_loans (
    id BIGINT PRIMARY KEY REFERENCES liabilities(id) ON DELETE CASCADE,
    lender_name VARCHAR(255),
    vehicle_model VARCHAR(255)
);

-- 3.5 Education Loans Subclass Table
CREATE TABLE IF NOT EXISTS education_loans (
    id BIGINT PRIMARY KEY REFERENCES liabilities(id) ON DELETE CASCADE,
    lender_name VARCHAR(255),
    institution_name VARCHAR(255)
);

-- 3.6 Credit Card Debt Subclass Table
CREATE TABLE IF NOT EXISTS credit_card_debt (
    id BIGINT PRIMARY KEY REFERENCES liabilities(id) ON DELETE CASCADE,
    card_issuer VARCHAR(255),
    last_four_digits VARCHAR(4)
);

-- 3.7 Other Liabilities Subclass Table
CREATE TABLE IF NOT EXISTS other_liabilities (
    id BIGINT PRIMARY KEY REFERENCES liabilities(id) ON DELETE CASCADE,
    description_detail TEXT
);

-- ============================================================================
-- 4. DDL: PLANNING, DOCUMENTS, SNAPSHOTS, AUTOMATION & AUDITING
-- ============================================================================

-- 4.1 Financial Goals Table
CREATE TABLE IF NOT EXISTS financial_goals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_group_id BIGINT REFERENCES family_groups(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    target_amount NUMERIC(19, 2) NOT NULL,
    target_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.2 Tagged Assets for Goals (ElementCollection Join Table)
CREATE TABLE IF NOT EXISTS goal_tagged_assets (
    goal_id BIGINT NOT NULL REFERENCES financial_goals(id) ON DELETE CASCADE,
    asset_id BIGINT NOT NULL,
    PRIMARY KEY (goal_id, asset_id)
);

-- 4.3 Emergency Fund Configuration Table
CREATE TABLE IF NOT EXISTS emergency_funds (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    monthly_expense NUMERIC(19, 2) NOT NULL,
    target_months INTEGER DEFAULT 6
);

-- 4.4 Portfolio Rebalancing Targets Table
CREATE TABLE IF NOT EXISTS rebalancing_targets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    target_equity_pct DOUBLE PRECISION DEFAULT 60.0,
    target_debt_pct DOUBLE PRECISION DEFAULT 30.0,
    target_gold_pct DOUBLE PRECISION DEFAULT 10.0,
    drift_threshold_pct DOUBLE PRECISION DEFAULT 5.0
);

-- 4.5 Net Worth Snapshots Table (Historical Trend)
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    net_worth NUMERIC(19, 2) NOT NULL,
    total_assets NUMERIC(19, 2),
    total_liabilities NUMERIC(19, 2),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.6 Asset & Liability Document Vault Table (Google Drive Linkage)
CREATE TABLE IF NOT EXISTS asset_documents (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id BIGINT REFERENCES assets(id) ON DELETE SET NULL,
    liability_id BIGINT REFERENCES liabilities(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    drive_file_id VARCHAR(255) NOT NULL,
    drive_view_url TEXT,
    drive_download_url TEXT,
    document_type VARCHAR(100), -- STATEMENT, RECEIPT, POLICY, DEED, TAX_CERTIFICATE
    extracted_data_json TEXT,   -- AI parsing results stored as JSON string
    uploaded_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.7 Price Alerts Table (Stock, Gold, Crypto Automation)
CREATE TABLE IF NOT EXISTS price_alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    asset_id BIGINT,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    target_price NUMERIC(19, 4) NOT NULL,
    alert_condition VARCHAR(20) NOT NULL, -- ABOVE, BELOW
    active BOOLEAN DEFAULT TRUE,
    last_observed_price NUMERIC(19, 4),
    last_triggered_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.8 Notification History Table
CREATE TABLE IF NOT EXISTS notification_histories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(50), -- PRICE_ALERT, MATURITY_REMINDER, REBALANCING_NUDGE, DIGEST
    reference_type VARCHAR(100),
    reference_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4.9 Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id BIGINT,
    details TEXT,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_family_group_id ON assets(family_group_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets(asset_type);

CREATE INDEX IF NOT EXISTS idx_liabilities_user_id ON liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_family_group_id ON liabilities(family_group_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_liability_type ON liabilities(liability_type);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON net_worth_snapshots(user_id, snapshot_date ASC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notification_histories(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_user ON asset_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_asset ON asset_documents(asset_id);
CREATE INDEX IF NOT EXISTS idx_documents_liability ON asset_documents(liability_id);

CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);


-- ============================================================================
-- 6. APPLICATION SQL QUERIES COOKBOOK (Executed by Services & Repositories)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 6.1 Authentication & User Management Queries
-- ----------------------------------------------------------------------------

-- Check user registration existence by email
SELECT COUNT(*) > 0 FROM users WHERE email = 'user@example.com';

-- Find user by email for JWT Login
SELECT id, email, password, name, mobile_number, family_group_id, family_role, tfa_enabled, tfa_secret, 
       google_id, google_email, google_access_token, google_refresh_token, google_token_expires_at, google_drive_folder_id, created_at 
FROM users 
WHERE email = 'user@example.com';

-- Insert new user
INSERT INTO users (name, email, password, mobile_number, tfa_enabled)
VALUES ('Alok Kulkarni', 'user@example.com', '$2a$10$encryptedPasswordHashHere', '+919876543210', false)
RETURNING id;

-- Update user Google OAuth tokens
UPDATE users 
SET google_id = 'g-123456', 
    google_email = 'user@gmail.com', 
    google_access_token = 'ya29.a0AfH6...', 
    google_refresh_token = '1//0gXyz...', 
    google_token_expires_at = '2026-10-06 00:00:00'
WHERE id = 1;

-- Store 2FA recovery codes
INSERT INTO user_tfa_recovery_codes (user_id, recovery_code)
VALUES (1, 'REC-982143'), (1, 'REC-551029'), (1, 'REC-884102');

-- Verify Password Reset Token (OTP)
SELECT p.id, p.otp, p.expiry_date, p.user_id 
FROM password_reset_tokens p 
WHERE p.otp = '492817' AND p.expiry_date > CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 6.2 Asset Queries (Polymorphic JPA Joined Strategy)
-- ----------------------------------------------------------------------------

-- Fetch all polymorphic assets for a user (Hydrates base + subclass tables)
SELECT a.id, a.name, a.asset_type, a.currency, a.purchase_date, a.notes, a.nominee_name, a.nominee_relationship, a.created_at, a.updated_at,
       s.ticker, s.company_name, s.quantity, s.average_buy_price,
       m.scheme_code, m.scheme_name, m.folio_number, m.units AS mf_units, m.average_nav,
       fd.bank_name, fd.principal_amount AS fd_principal, fd.interest_rate AS fd_rate, fd.compounding_frequency AS fd_compounding, fd.start_date AS fd_start, fd.maturity_date AS fd_maturity,
       g.weight_grams, g.purity, g.purchase_price AS gold_price,
       c.coin_id, c.symbol AS crypto_symbol, c.units AS crypto_units, c.average_buy_price AS crypto_buy_price,
       e.plan_type, e.company_name AS esop_company, e.total_units_granted, e.vested_units, e.unvested_units, e.strike_price, e.current_stock_price,
       b.bond_type, b.issuer, b.coupon_rate, b.invested_amount AS bond_invested, b.face_value, b.quantity AS bond_qty, b.maturity_date AS bond_maturity,
       r.property_name, r.property_type, r.purchase_price AS real_estate_purchase, r.estimated_current_value
FROM assets a
LEFT JOIN stock s ON a.id = s.id
LEFT JOIN mutual_fund m ON a.id = m.id
LEFT JOIN fixed_deposit fd ON a.id = fd.id
LEFT JOIN gold_items g ON a.id = g.id
LEFT JOIN cryptocurrencies c ON a.id = c.id
LEFT JOIN esop_rsus e ON a.id = e.id
LEFT JOIN bonds b ON a.id = b.id
LEFT JOIN real_estate r ON a.id = r.id
WHERE a.user_id = 1;

-- Insert a new Stock Asset (Two-step JPA insert)
-- Step 1: Base Asset Table
INSERT INTO assets (user_id, family_group_id, name, asset_type, currency, purchase_date, notes)
VALUES (1, NULL, 'TCS Shares', 'STOCK', 'INR', '2025-01-15', 'Long term tech holding')
RETURNING id; -- returns e.g. 101

-- Step 2: Subclass Table
INSERT INTO stock (id, ticker, company_name, quantity, average_buy_price)
VALUES (101, 'TCS.BSE', 'Tata Consultancy Services', 50.0000, 3850.0000);

-- Insert a Gold Asset
INSERT INTO assets (user_id, name, asset_type, currency, purchase_date)
VALUES (1, 'Kundan 24K Gold Bar', 'GOLD', 'INR', '2024-05-10')
RETURNING id; -- returns e.g. 102

INSERT INTO gold_items (id, weight_grams, purity, purchase_price)
VALUES (102, 50.0000, 'K24', 350000.00);

-- Query fixed deposits maturing in next N days (Automated Maturity Reminder)
SELECT a.id, a.user_id, a.name, fd.bank_name, fd.principal_amount, fd.maturity_date, u.email, u.name as user_name
FROM assets a
JOIN fixed_deposit fd ON a.id = fd.id
JOIN users u ON a.user_id = u.id
WHERE fd.maturity_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days');

-- ----------------------------------------------------------------------------
-- 6.3 Liability Queries (Polymorphic JPA Joined Strategy)
-- ----------------------------------------------------------------------------

-- Fetch all liabilities with subclass attributes
SELECT l.id, l.name, l.liability_type, l.principal_amount, l.interest_rate, l.tenure_months, 
       l.outstanding_balance, l.emi, l.start_date, l.notes,
       hl.lender_name AS home_loan_lender, hl.property_address,
       pl.lender_name AS personal_loan_lender, pl.purpose,
       vl.lender_name AS vehicle_loan_lender, vl.vehicle_model,
       el.lender_name AS edu_loan_lender, el.institution_name,
       cc.card_issuer, cc.last_four_digits,
       ol.description_detail
FROM liabilities l
LEFT JOIN home_loans hl ON l.id = hl.id
LEFT JOIN personal_loans pl ON l.id = pl.id
LEFT JOIN vehicle_loans vl ON l.id = vl.id
LEFT JOIN education_loans el ON l.id = el.id
LEFT JOIN credit_card_debt cc ON l.id = cc.id
LEFT JOIN other_liabilities ol ON l.id = ol.id
WHERE l.user_id = 1;

-- Insert a Home Loan Liability
INSERT INTO liabilities (user_id, name, liability_type, principal_amount, interest_rate, tenure_months, outstanding_balance, emi, start_date)
VALUES (1, 'HDFC Villa Home Loan', 'HOME_LOAN', 7500000.00, 8.50, 240, 6800000.00, 65000.00, '2023-01-01')
RETURNING id; -- returns e.g. 201

INSERT INTO home_loans (id, lender_name, property_address)
VALUES (201, 'HDFC Bank', 'Plot 42, Palm Meadows, Bangalore');

-- ----------------------------------------------------------------------------
-- 6.4 Goals & Portfolio Planning Queries
-- ----------------------------------------------------------------------------

-- Get user's financial goals with tagged asset references
SELECT g.id, g.name, g.target_amount, g.target_date, g.notes, g.created_at,
       array_agg(t.asset_id) AS tagged_assets
FROM financial_goals g
LEFT JOIN goal_tagged_assets t ON g.id = t.goal_id
WHERE g.user_id = 1 OR g.family_group_id = 10
GROUP BY g.id;

-- Tag an asset to a goal
INSERT INTO goal_tagged_assets (goal_id, asset_id)
VALUES (5, 101)
ON CONFLICT DO NOTHING;

-- Emergency Fund Setup & Target Calculation
SELECT ef.monthly_expense, ef.target_months, (ef.monthly_expense * ef.target_months) AS required_fund
FROM emergency_funds ef
WHERE ef.user_id = 1;

-- ----------------------------------------------------------------------------
-- 6.5 Net Worth Snapshots & Historical Trend
-- ----------------------------------------------------------------------------

-- Insert periodic snapshot
INSERT INTO net_worth_snapshots (user_id, snapshot_date, net_worth, total_assets, total_liabilities)
VALUES (1, '2026-10-01', 14500000.00, 21300000.00, 6800000.00);

-- Fetch snapshot history for chart visualization
SELECT snapshot_date, net_worth, total_assets, total_liabilities
FROM net_worth_snapshots
WHERE user_id = 1
ORDER BY snapshot_date ASC;

-- ----------------------------------------------------------------------------
-- 6.6 Family Group Sharing & Multi-User Rollup Queries
-- ----------------------------------------------------------------------------

-- Get all family members in a group
SELECT u.id, u.name, u.email, u.family_role, u.created_at
FROM users u
WHERE u.family_group_id = 10;

-- Aggregate group net worth / asset allocation across all family members
SELECT 
    a.asset_type,
    COUNT(a.id) AS asset_count,
    SUM(
        COALESCE(s.quantity * s.average_buy_price, 0) +
        COALESCE(m.units * m.average_nav, 0) +
        COALESCE(fd.principal_amount, 0) +
        COALESCE(g.purchase_price, 0) +
        COALESCE(c.units * c.average_buy_price, 0) +
        COALESCE(e.vested_units * e.strike_price, 0) +
        COALESCE(b.invested_amount, b.quantity * b.face_value, 0) +
        COALESCE(r.estimated_current_value, r.purchase_price, 0)
    ) AS total_invested_value
FROM assets a
JOIN users u ON a.user_id = u.id
LEFT JOIN stock s ON a.id = s.id
LEFT JOIN mutual_fund m ON a.id = m.id
LEFT JOIN fixed_deposit fd ON a.id = fd.id
LEFT JOIN gold_items g ON a.id = g.id
LEFT JOIN cryptocurrencies c ON a.id = c.id
LEFT JOIN esop_rsus e ON a.id = e.id
LEFT JOIN bonds b ON a.id = b.id
LEFT JOIN real_estate r ON a.id = r.id
WHERE u.family_group_id = 10
GROUP BY a.asset_type;

-- ----------------------------------------------------------------------------
-- 6.7 Automation, Price Alerts & Notification Queries
-- ----------------------------------------------------------------------------

-- Fetch all active price alerts for background price monitoring worker
SELECT pa.id, pa.user_id, pa.asset_id, pa.asset_name, pa.asset_type, pa.target_price, 
       pa.alert_condition, pa.last_observed_price, u.email, u.name AS user_name
FROM price_alerts pa
JOIN users u ON pa.user_id = u.id
WHERE pa.active = true;

-- Update triggered alert
UPDATE price_alerts 
SET last_observed_price = 4250.00, 
    last_triggered_at = CURRENT_TIMESTAMP, 
    active = false 
WHERE id = 3;

-- Fetch unread notifications count
SELECT COUNT(*) 
FROM notification_histories 
WHERE user_id = 1 AND is_read = false;

-- Mark all notifications as read
UPDATE notification_histories 
SET is_read = true 
WHERE user_id = 1 AND is_read = false;

-- ----------------------------------------------------------------------------
-- 6.8 Document Vault & Google Drive Management Queries
-- ----------------------------------------------------------------------------

-- List documents with associated asset or liability name
SELECT doc.id, doc.file_name, doc.file_size, doc.mime_type, doc.drive_file_id, 
       doc.drive_view_url, doc.drive_download_url, doc.document_type, doc.uploaded_at,
       a.name AS asset_name, l.name AS liability_name
FROM asset_documents doc
LEFT JOIN assets a ON doc.asset_id = a.id
LEFT JOIN liabilities l ON doc.liability_id = l.id
WHERE doc.user_id = 1
ORDER BY doc.uploaded_at DESC;

-- ----------------------------------------------------------------------------
-- 6.9 Audit Trail Queries
-- ----------------------------------------------------------------------------

-- Paginated audit log retrieval for compliance / family admin
SELECT id, user_email, user_name, action, target_type, target_id, details, timestamp
FROM audit_logs
WHERE user_email IN ('user1@example.com', 'user2@example.com')
ORDER BY timestamp DESC
LIMIT 20 OFFSET 0;
