# Backend Liabilities Deep Dive

This module covers every liability type in WealthMap, including home loans, personal loans, education loans, credit card debt, vehicle loans, and other liabilities. It shares the same architecture as assets: a polymorphic base entity, a repository for the base type, a controller, and a service that creates the correct subtype at runtime.

## 1. Architecture Overview

The liabilities system uses `Liability` as a JOINED inheritance base class, `LiabilityRepository` for persistence, and `LiabilityService` as the main business-logic layer. The controller is thin and delegates create, read, update, and delete actions to the service. The service is responsible for deciding which subtype to instantiate, calculating EMI, enforcing ownership, and mapping entities into a response shape the frontend can display.

Top-level modules:
- `controller`: exposes liability CRUD endpoints.
- `service`: contains liability creation, update, EMI logic, and mapping.
- `entity` and `entity/base`: define the base liability model and subtype tables.
- `dto/request` and `dto/response`: request and response payloads for debt data.
- `repository`: provides the JPA entry point for liabilities.
- `enums`: defines supported liability types.

Typical liability request lifecycle:
1. User submits a liability form.
2. Controller receives `LiabilityRequest`.
3. Service resolves the authenticated user.
4. Service chooses the correct subtype from `LiabilityType`.
5. Common fields and subtype fields are populated.
6. EMI is either accepted or calculated.
7. Repository saves the base and subtype tables.
8. Service maps the entity to `LiabilityResponse`.

## 2. Feature-by-Feature Breakdown

Liability features:
- Add liabilities
- Update liabilities
- List liabilities
- Fetch one liability
- Delete liabilities
- Calculate EMI

### Feature: Liability CRUD

**What it does**
Lets users store and manage debt records of different kinds while keeping subtype-specific fields intact.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/LiabilityController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/LiabilityService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/base/Liability.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/HomeLoan.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/PersonalLoan.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/EducationLoan.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/CreditCardDebt.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/VehicleLoan.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/OtherLiability.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/request/LiabilityRequest.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/LiabilityResponse.java`

**Step-by-step trace**
1. `LiabilityController.addLiability(...)` or `updateLiability(...)` receives the request.
2. `LiabilityService` loads the current user.
3. `createEntityFromRequest(...)` chooses the correct subtype for new liabilities.
4. `populateCommonFields(...)` writes shared debt data.
5. `updateSubtypeSpecificFields(...)` writes subtype-specific fields for updates.
6. The entity is saved through `LiabilityRepository`.
7. `mapToResponse(...)` returns a subtype-aware DTO.

**State management**
- Principal, balance, EMI, and subtype fields are persisted.
- Derived calculations are recomputed in service code.

**Validation & error handling**
- DTO validation checks basic numeric and required fields.
- Ownership is checked before read/update/delete.

**Edge cases**
- If the liability type changes during update, the service deletes and recreates the entity.
- That works, but it is a little blunt and could be cleaner with a migration-aware approach.

### Feature: EMI calculation

**What it does**
Calculates the monthly EMI from principal, annual interest rate, and tenure.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/service/LiabilityService.java`

**Step-by-step trace**
1. `populateCommonFields(...)` checks whether EMI was supplied.
2. If EMI is missing or zero, `calculateEMI(...)` is called.
3. The formula uses principal, monthly rate, and tenure.
4. The result is rounded to two decimals.

**State management**
- EMI is stored as a numeric field on the entity.
- The calculation is deterministic and stateless.

**Validation & error handling**
- If principal is invalid or tenure is non-positive, the result is zero.
- If interest rate is zero, the service falls back to simple principal/tenure division.

**Edge cases**
- The implementation assumes annual interest input, not monthly.
- It does not model prepayment or changing rates.

## 3. Library & Pattern Justification

- **Polymorphic JPA inheritance**
  - Solves the need to store very different debt subtypes with shared debt fields.
  - Without it, the model would either be duplicated or require one giant nullable table.
  - Alternative: composition with separate tables per subtype and a manual discriminator. Tradeoff: more flexible, more code.

- **Service-level subtype factory**
  - Solves entity creation based on liability type.
  - Without it, controller code would become cluttered and persistence logic would be duplicated.
  - Alternative: factory bean. Tradeoff: similar clarity, slightly cleaner separation.

- **EMI calculation in service**
  - Solves deterministic debt math close to the domain logic.
  - Without it, the frontend or database would need to own the formula.
  - Alternative: stored procedure. Tradeoff: centralized in DB, but less readable in Java.

## 4. Database & Data Model

Tables involved:
- `liabilities`
- `home_loans`
- `personal_loans`
- `education_loans`
- `credit_card_debt`
- `vehicle_loans`
- `other_liabilities`

Relationships:
- Every liability belongs to one `User`.
- Every liability may belong to a `FamilyGroup`.
- Subtype tables extend the base `liabilities` table through JOINED inheritance.

Where application code matters:
- EMI calculation is application-owned.
- Liability type changes are handled in service code.
- Ownership checks are not enforced purely by the DB.

## 5. Security & Access Notes

Access control works in two layers:
- Spring Security ensures the request is authenticated.
- `LiabilityService` ensures the authenticated user owns the liability before update or delete.

This is correct because endpoint access and row ownership are different problems. The route may be authenticated, but a user still should not be able to touch someone else’s debt record.

Potential issues:
- Deleting and recreating on type change can make audit/history less precise.
- The service throws runtime exceptions for not-found and access-denied cases instead of using a structured exception hierarchy.

## 6. Likely Interview Questions

- **Why use JOINED inheritance for liabilities?**
  - Because each liability type has unique fields, but they all share core debt fields.

- **Why calculate EMI in Java instead of the frontend?**
  - Because the backend should own financial truth and keep the result consistent across clients.

- **Why recreate the entity when liability type changes?**
  - Because the subtype table mapping changes and the old entity structure may not fit the new type cleanly.

## 7. Things I Should Be Able to Defend

- Current EMI formula
  - Strong justification: it is standard reducing-balance EMI math and easy to explain.

- Delete-and-recreate on type change
  - Weak justification: it works, but a more deliberate migration or subtype conversion would be safer.

