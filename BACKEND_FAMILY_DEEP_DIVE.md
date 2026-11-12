# Backend Family Collaboration & RBAC Deep Dive

This document covers AssetHub’s family wealth collaboration module: **Multi-Tenant Family Groups**, **Role-Based Access Control (RBAC)**, **Per-Member Net Worth Rollups**, **Shared Family Goals**, **System Audit Trail**, and **Brevo Email Invitations**.

---

## 1. Architecture Overview

The Family module allows multiple registered users to link their individual accounts under a shared Family Group while maintaining strict data isolation and permission boundaries.

```
                         +----------------------+
                         |     FamilyGroup      |
                         +----------------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
+-------------------+     +-------------------+     +-------------------+
|  FamilyMember 1   |     |  FamilyMember 2   |     |  FamilyMember 3   |
|  (Role: OWNER)    |     |  (Role: EDITOR)   |     |  (Role: VIEWER)   |
+-------------------+     +-------------------+     +-------------------+
          |                         |                         |
   Assets & Debts            Assets & Debts            Assets & Debts
```

### Key Components:
- `com.wealthmap.entity.FamilyGroup`: Master group entity containing name, creator, members, and shared goals.
- `com.wealthmap.entity.FamilyMember`: Links a `User` to a `FamilyGroup` with an assigned `FamilyRole`.
- `com.wealthmap.controller.FamilyGroupController`: REST endpoints (`/api/family/**`) for group CRUD, invitations, role modifications, and rollup analytics.
- `com.wealthmap.controller.AuditLogController`: Exposes `/api/audit-logs` for family activity tracking.
- `com.wealthmap.service.AuditLogService`: Automatically intercepts modifications across assets, liabilities, and member roles to log event history.

---

## 2. Permission Tiers & Security Enforcement

| Role | Permissions | Security Enforcement |
| :--- | :--- | :--- |
| **OWNER** | Full control: Invite/remove members, promote/demote roles, delete group, manage all assets & debts | Spring Security + Service validation |
| **EDITOR** | Read all family assets, add/edit/delete assets and liabilities, create family goals | `hasAnyAuthority("ROLE_FAMILY_OWNER", "ROLE_FAMILY_EDITOR")` |
| **VIEWER** | Read-only inspection of family net worth, holdings, and reports | Write methods blocked at Spring Security filter chain (`POST`, `PUT`, `DELETE`) |

---

## 3. Rollup Analytics & Shared Family Goals

### 3.1 Per-Member Net Worth Rollup
- Aggregates assets and debts across all family members:
  $$\text{Member Net Worth}_m = \sum \text{Assets}_m - \sum \text{Liabilities}_m$$
  $$\text{Family Net Worth} = \sum_{m} \text{Member Net Worth}_m$$
  $$\text{Member Contribution Share} = \left(\frac{\text{Member Net Worth}_m}{\text{Family Net Worth}}\right) \times 100$$
- Visualized as interactive breakdown pie and bar charts on the frontend.

### 3.2 Shared Family Milestone Goals
- Multiple family members can tag their individual assets to pool progress toward shared targets (e.g. "Family House Purchase", "Children Education Corpus").
- The backend aggregates current valuations across tagged assets regardless of individual ownership.

---

## 4. System Audit Trail & Email Invitations

- **Audit Logging**: Every create, update, and delete action automatically writes an `AuditLog` entry containing `timestamp`, `actorId`, `actorName`, `actionType` (`ASSET_CREATED`, `MEMBER_ROLE_CHANGED`, etc.), and `detailsJson`.
- **Brevo Email Invites**: Group owners can invite members via email. The service generates a secure cryptographic UUID token with a 7-day expiration and delivers a branded HTML invitation email via Brevo API.
