# Backend Snapshots Deep Dive

This module captures historical net-worth snapshots so the dashboard can show trends over time. It computes current totals on demand, stores them, and then reads them back in date order for charting.

## 1. Architecture Overview

`SnapshotService` aggregates current assets and liabilities, writes one `NetWorthSnapshot` per day, and reads those snapshots back for history views. The controller is thin and just exposes endpoints to fetch snapshots or capture a fresh one. This module is the bridge between live portfolio state and chart-friendly historical data.

Top-level modules:
- `controller`: snapshot endpoints.
- `service`: snapshot capture and retrieval.
- `entity`: snapshot persistence model.
- `repository`: JPA access for snapshots and users.
- `service/assets` and `service/LiabilityService`: data sources for the snapshot totals.

Typical snapshot flow:
1. Dashboard loads.
2. Frontend asks for snapshots.
3. Controller resolves the current user.
4. Service gathers current asset and liability values.
5. Totals are saved as today’s snapshot.
6. Snapshot history is returned in date order.

## 2. Feature-by-Feature Breakdown

Snapshot features:
- Capture current snapshot
- List snapshots

### Feature: Capture snapshot

**What it does**
Calculates current total assets, liabilities, invested amount, and net worth and stores them for today.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/SnapshotController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/SnapshotService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/NetWorthSnapshot.java`
- `wealthmap-backend/src/main/java/com/wealthmap/repository/NetWorthSnapshotRepository.java`

**Step-by-step trace**
1. Controller loads the user by email.
2. `captureSnapshotNow(...)` loads current assets and liabilities.
3. Totals are summed.
4. Existing snapshot for today is reused if found.
5. Snapshot fields are updated and saved.

**State management**
- Snapshot data is stored permanently.
- The current calculation is request-scoped until saved.

**Validation & error handling**
- Missing user causes an error.

**Edge cases**
- Existing snapshot for the same day is updated instead of duplicated.

### Feature: Snapshot history

**What it does**
Returns all stored snapshots for a user in ascending date order.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/SnapshotController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/SnapshotService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/dto/response/SnapshotResponse.java`

**Step-by-step trace**
1. Controller resolves the user.
2. Service fetches snapshots ordered by date.
3. Snapshots are mapped into response DTOs.
4. Frontend renders the time series.

**State management**
- Read-only historical data comes from the DB.

**Validation & error handling**
- Missing user throws an error.

**Edge cases**
- Older rows with missing total assets or liabilities are normalized in mapping with fallback values.

## 3. Library & Pattern Justification

- **One snapshot per day**
  - Solves the need for historical trend charts without overly granular duplicates.
  - Without it, the chart could be noisy and redundant.
  - Alternative: hourly or event-based snapshots. Tradeoff: more detail, more storage.

## 4. Database & Data Model

Table:
- `net_worth_snapshots`

Relationships:
- Each snapshot belongs to one `User`.

Integrity reliance:
- The snapshot reflects whatever current asset/liability values the services return at capture time.

## 5. Security & Access Notes

Snapshots are user-specific, so the controller always resolves the current user before reading or writing. The app does not let the client submit arbitrary snapshot totals, which is good because snapshot values must come from backend calculation, not user input.

Potential gaps:
- There is no scheduling logic shown here for automatic daily snapshots; capture appears to be manual/on-demand.

## 6. Likely Interview Questions

- **Why capture snapshots in the backend instead of the frontend?**
  - Because the backend owns financial truth and can persist the calculation reliably.

- **Why reuse today’s snapshot if it already exists?**
  - Because the app wants one record per day rather than duplicates.

- **Why store total assets and liabilities separately?**
  - So the app can reconstruct the breakdown later instead of only storing net worth.

