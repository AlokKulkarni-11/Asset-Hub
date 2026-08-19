# Backend Family Deep Dive

This module adds shared-family portfolio tracking. It lets a user create a family group, invite members by email, accept invites, leave the family, and see family-level combined assets.

## 1. Architecture Overview

`FamilyGroupService` owns the business logic, while `FamilyGroupController` exposes the HTTP endpoints. The model is built from `FamilyGroup`, `FamilyInvite`, and the `familyGroup` relationship on `User` and asset entities. The module uses email invitations and invite tokens to safely connect users into a shared financial group.

Top-level modules:
- `controller`: family group API endpoints.
- `service`: family creation, invites, acceptance, and membership management.
- `entity`: group, invite, and user-family relationships.
- `repository`: persistence for groups, invites, and users.
- `service/assets`: used when computing family asset totals.

Typical family flow:
1. User creates a family.
2. Service creates a `FamilyGroup` and assigns the creator.
3. Creator invites another user.
4. Invite record is saved and optionally emailed.
5. Invitee accepts using token.
6. User joins the family group.
7. Family assets can be aggregated for the whole group.

## 2. Feature-by-Feature Breakdown

Family features:
- Create family group
- Invite member
- Accept invite
- Leave family
- View pending invites
- View family details
- View family assets

### Feature: Family creation

**What it does**
Creates a new group and attaches the creator as the first member.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/FamilyGroupController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/FamilyGroupService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/FamilyGroup.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/User.java`

**Step-by-step trace**
1. Controller reads the authenticated user email.
2. `FamilyGroupService.createFamily(...)` loads the user.
3. It checks that the user is not already in a group.
4. A `FamilyGroup` is created with a random invite code.
5. Group is saved and user’s `familyGroup` is set.

**State management**
- Group identity and membership are persisted in the DB.

**Validation & error handling**
- Users already in a group are rejected.
- Missing user results in a runtime error.

**Edge cases**
- Invite code uniqueness is assumed from random generation and DB uniqueness, but collision handling is not explicit.

### Feature: Invite member

**What it does**
Creates a pending invite for another user and optionally sends an email invitation.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/FamilyGroupController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/FamilyGroupService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/FamilyInvite.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/EmailService.java`

**Step-by-step trace**
1. Controller receives name and email.
2. Service confirms the caller is the family creator.
3. Service checks whether the invitee already belongs to a family.
4. Service prevents duplicate pending invites.
5. `FamilyInvite` is saved.
6. Email is sent asynchronously if configured.

**State management**
- Invite token and status are stored in the DB.
- Email is an external side effect.

**Validation & error handling**
- Duplicate invites are blocked.
- Users already in a family are blocked.

**Edge cases**
- Email may not send if the API key is missing, but the invite record still exists.

### Feature: Accept invite

**What it does**
Lets the invitee join the family using the invite token.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/FamilyGroupController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/FamilyGroupService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/FamilyInvite.java`
- `wealthmap-backend/src/main/java/com/wealthmap/entity/User.java`

**Step-by-step trace**
1. Controller gets token from the request body.
2. Service checks the user is not already in a family.
3. Invite token is looked up.
4. Status is checked for `PENDING`.
5. Email must match the invite target email.
6. User’s `familyGroup` is set and invite status becomes `ACCEPTED`.

**State management**
- Membership is persisted.
- Invite status is persisted.

**Validation & error handling**
- Invalid or processed tokens are rejected.
- Wrong email is rejected.

**Edge cases**
- The code comments note that email matching is intentionally strict enough to protect against the wrong account joining.

### Feature: Family assets

**What it does**
Aggregates assets across every family member so the group can see a combined portfolio.

**Files involved**
- `wealthmap-backend/src/main/java/com/wealthmap/controller/FamilyGroupController.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/FamilyGroupService.java`
- `wealthmap-backend/src/main/java/com/wealthmap/service/assets/*`
- `wealthmap-backend/src/main/java/com/wealthmap/repository/UserRepository.java`

**Step-by-step trace**
1. Controller loads the current user.
2. Service checks that the user belongs to a family.
3. Controller collects all users with the same family group.
4. It calls asset services for each member.
5. All assets are merged into a single list and returned.

**State management**
- Family membership is persistent.
- Aggregated family assets are computed per request.

**Validation & error handling**
- Non-family users are rejected.

**Edge cases**
- The implementation scans all users with `findAll()`, which works but does not scale well.

## 3. Library & Pattern Justification

- **Invite token flow**
  - Solves membership authorization without exposing direct group editing to arbitrary users.
  - Without it, invites would be hard to secure.
  - Alternative: signed invite links with JWT-style tokens. Tradeoff: fewer DB rows, but more token complexity.

- **Email-based invites**
  - Solves onboarding of remote family members.
  - Without it, the feature would be manual and cumbersome.
  - Alternative: in-app invite only. Tradeoff: simpler, but less useful.

## 4. Database & Data Model

Tables involved:
- `family_groups`
- `family_invites`
- `users`
- `assets`
- `liabilities`

Relationships:
- `User` belongs to one optional `FamilyGroup`.
- `FamilyInvite` points to one `FamilyGroup`.
- Assets and liabilities may also belong to a `FamilyGroup`.

Integrity reliance:
- Membership validation happens in service code.
- Combined family asset queries rely on user scans in code.

## 5. Security & Access Notes

Authentication is handled by the standard JWT flow. Authorization is then layered on top:
- Only the family creator can invite.
- Only the invite target email can accept.
- Only users who belong to a family can view family assets.
- Users can leave a family, but the code does not currently show special handling for creator departure.

Potential gaps:
- `findAll()` user scanning is inefficient.
- There is no dedicated authorization policy at the DB level.

## 6. Likely Interview Questions

- **Why use invite tokens?**
  - Because they let the backend securely associate an invite with a family and a target user.

- **Why check the invite email against the logged-in user email?**
  - To prevent someone else from accepting an invite intended for a different account.

- **Why scan all users for family assets?**
  - Because the current implementation keeps the logic simple, though it may need optimization later.

