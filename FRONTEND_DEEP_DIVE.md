# Frontend Deep Dive

This document covers the React/Vite frontend at a module level. The frontend is a single-page app that handles authentication, protected routing, asset and liability management screens, family and planning pages, dashboards, and global UI state.

## 1. Architecture Overview

The frontend is built with React, TypeScript, Vite, React Router, TanStack Query, Zustand, Axios, React Hook Form, Zod, Recharts, Tailwind CSS, and Lucide React. It uses a shell layout for authenticated pages, a shared Axios client that injects JWTs automatically, and page-level components that call backend APIs through dedicated modules. Server state is cached with TanStack Query, auth state is persisted in localStorage through Zustand, and the UI is organized around route-level pages plus reusable modal/form components.

Top-level folders/modules and their responsibility:
- `src/main.tsx`: React entry point.
- `src/App.tsx`: routes, providers, and protected shell wiring.
- `src/api`: HTTP clients and typed API wrappers.
- `src/components/layout`: topbar, sidebar, mobile nav, and the authenticated shell.
- `src/components/forms`: add/edit dialogs for assets, liabilities, planning, and auth recovery.
- `src/components/ui`: reusable UI primitives.
- `src/pages`: the route-level screens.
- `src/providers`: global theme handling.
- `src/store`: auth state persistence.
- `src/index.css` and `src/App.css`: global and app-level styling.

Typical request lifecycle:
1. User clicks a button or submits a form in a page/component.
2. Component calls a function from an API module.
3. Axios adds the JWT from localStorage if present.
4. Request hits the backend.
5. TanStack Query caches the response if the call is a query.
6. Mutation success invalidates cached data or updates local state.
7. Component re-renders with new data.

Major technologies used here:
- React: renders the UI and handles component composition.
- TypeScript: gives typed DTOs and safer API/data handling.
- Vite: provides fast dev server and production builds.
- React Router: handles public and protected navigation.
- TanStack Query: caches and syncs server state.
- Zustand: stores auth state and persists it across reloads.
- Axios: centralizes API requests and auth headers.
- Zod: validates form inputs before submit.
- React Hook Form: manages form state with low rerender overhead.
- Tailwind CSS: powers the utility-first styling system.

## 2. Feature-by-Feature Breakdown

Frontend features:
- Authentication screens
- Protected application shell
- Dashboard
- Asset management
- Liability management
- Planning screens
- Family screens
- Profile/settings
- Global theme and error handling

### Feature: Authentication screens

**What it does**
Lets the user register, log in, start password recovery, and reset a password.

**Files involved**
- `wealthmap-frontend/src/pages/Login.tsx`
- `wealthmap-frontend/src/pages/Register.tsx`
- `wealthmap-frontend/src/components/forms/ForgotPasswordModal.tsx`
- `wealthmap-frontend/src/components/forms/ChangePasswordModal.tsx`
- `wealthmap-frontend/src/api/axios.ts`
- `wealthmap-frontend/src/store/authStore.ts`

**Step-by-step trace**
1. Login/register form validates input with Zod and React Hook Form.
2. API call is made through shared Axios client.
3. On success, token and user data are stored in Zustand/localStorage.
4. Navigation redirects to the protected app.
5. Forgot/reset flows open modals and call auth endpoints.

**State management**
- Form input is local component state managed by React Hook Form.
- Token/user are global auth state in Zustand.
- Backend session is not used.

**Validation & error handling**
- Invalid email/password is blocked by Zod before API call.
- API errors are shown inline in the form.

**Edge cases**
- Forgot password is modal-driven, so the login page remains visible.
- Token persistence depends on localStorage availability.

### Feature: Protected shell and navigation

**What it does**
Keeps logged-in users inside the app layout and renders the navigation shell around protected pages.

**Files involved**
- `wealthmap-frontend/src/App.tsx`
- `wealthmap-frontend/src/components/layout/AppLayout.tsx`
- `wealthmap-frontend/src/components/layout/Sidebar.tsx`
- `wealthmap-frontend/src/components/layout/Topbar.tsx`
- `wealthmap-frontend/src/components/layout/MobileNav.tsx`
- `wealthmap-frontend/src/store/authStore.ts`

**Step-by-step trace**
1. React Router matches a protected route.
2. `AppLayout` checks auth state.
3. If unauthenticated, it redirects to `/login`.
4. Otherwise it renders sidebar, topbar, and mobile nav.
5. Child routes render inside `Outlet`.

**State management**
- Auth state is global and persistent.
- Navigation state is route-driven.

**Validation & error handling**
- Unauthenticated access is blocked by route redirect.

**Edge cases**
- If auth state in localStorage becomes stale, the UI may think the user is authenticated until a protected API call fails.

### Feature: Dashboard

**What it does**
Shows net worth, assets, liabilities, snapshots, analytics summary, emergency fund progress, price alerts, notifications, rebalancing status, benchmark overlays, performance callouts, and a what-if simulator.

**Files involved**
- `wealthmap-frontend/src/pages/Dashboard.tsx`
- `wealthmap-frontend/src/api/assets.api.ts`
- `wealthmap-frontend/src/api/liabilities.api.ts`
- `wealthmap-frontend/src/api/snapshots.api.ts`
- `wealthmap-frontend/src/api/analytics.api.ts`
- `wealthmap-frontend/src/api/planning.api.ts`
- `wealthmap-frontend/src/api/alerts.api.ts`
- `wealthmap-frontend/src/store/authStore.ts`

**Step-by-step trace**
1. Page mounts and TanStack Query fires asset/liability/snapshot/analytics queries.
2. A snapshot capture is triggered on mount.
3. The page computes derived chart data and summary metrics.
4. Recharts renders line and pie charts.
5. What-if sliders update projected values locally.

**State management**
- Server state is TanStack Query cached data.
- Slider values and chart toggles are local component state.
- Auth is global.

**Validation & error handling**
- Loading state is shown until queries complete.
- If no data exists, the page shows empty-state messages.

**Edge cases**
- Some calculations are done client-side as approximations, so UI values may diverge from backend calculations if rules change.

### Feature: Asset management screens

**What it does**
Lets users list, add, edit, search, and delete all supported asset types.

**Files involved**
- `wealthmap-frontend/src/pages/Assets.tsx`
- `wealthmap-frontend/src/components/forms/AddStockForm.tsx`
- `wealthmap-frontend/src/components/forms/AddMutualFundForm.tsx`
- `wealthmap-frontend/src/components/forms/AddGoldForm.tsx`
- `wealthmap-frontend/src/components/forms/AddFDForm.tsx`
- `wealthmap-frontend/src/components/forms/AddRealEstateForm.tsx`
- `wealthmap-frontend/src/components/forms/AddCryptoForm.tsx`
- `wealthmap-frontend/src/components/forms/AssetSelectorModal.tsx`
- `wealthmap-frontend/src/components/ui/ConfirmDialog.tsx`
- `wealthmap-frontend/src/api/assets.api.ts`

**Step-by-step trace**
1. Assets page fetches all assets.
2. User opens asset selector and chooses a type.
3. The correct add/edit modal opens.
4. Form submission calls the corresponding API wrapper.
5. TanStack Query invalidates asset data so the list refreshes.

**State management**
- Form state is local.
- Asset list is server state.
- Modal open/close state is local.

**Validation & error handling**
- Zod and React Hook Form validation is used in forms.
- API failures are surfaced through modal or page-level error states.

**Edge cases**
- Search-heavy asset forms depend on backend search APIs staying responsive.

### Feature: Liability management screens

**What it does**
Lets users create and edit different debt types, including subtype-specific forms.

**Files involved**
- `wealthmap-frontend/src/pages/Liabilities.tsx`
- `wealthmap-frontend/src/components/forms/AddLiabilityForm.tsx`
- `wealthmap-frontend/src/components/forms/LiabilitySelectorModal.tsx`
- `wealthmap-frontend/src/api/liabilities.api.ts`

**Step-by-step trace**
1. Liabilities page fetches the user’s debt list.
2. User chooses a liability type.
3. A subtype-aware form is rendered.
4. Submit calls the liabilities API.
5. Cached liability data is invalidated and reloaded.

**State management**
- The displayed list is server state.
- Form subtype selection is local UI state.

**Validation & error handling**
- Input validation is handled before submission.
- Backend errors are surfaced to the user.

**Edge cases**
- The liability form needs to stay aligned with backend subtype fields.

### Feature: Planning screens

**What it does**
Shows emergency fund status, SIP trackers, retirement projections, and maturity-related planning data.

**Files involved**
- `wealthmap-frontend/src/pages/Goals.tsx`
- `wealthmap-frontend/src/pages/Maturities.tsx`
- `wealthmap-frontend/src/api/planning.api.ts`
- `wealthmap-frontend/src/api/goals.api.ts`

**Step-by-step trace**
1. Page loads planning-related server data.
2. User updates settings or adds SIP/goal entries.
3. API wrapper posts changes to backend.
4. TanStack Query refreshes the affected screens.

**State management**
- Planning data is server state.
- Any open dialog or form state is local.

**Validation & error handling**
- Backend validation is relied on for final data integrity.

**Edge cases**
- The retirement and emergency-fund math is ultimately backend-derived, so the UI should treat it as read-only truth.

### Feature: Family and profile screens

**What it does**
Supports family invitations, combined family views, and user profile/password updates.

**Files involved**
- `wealthmap-frontend/src/pages/Family.tsx`
- `wealthmap-frontend/src/pages/Profile.tsx`
- `wealthmap-frontend/src/api/family.api.ts`
- `wealthmap-frontend/src/api/users.api.ts`
- `wealthmap-frontend/src/components/forms/ChangePasswordModal.tsx`

**Step-by-step trace**
1. Page loads current family or profile data.
2. User creates or accepts invites, or edits profile/password.
3. API wrapper sends the change.
4. UI refreshes after success.

**State management**
- Server data comes from API calls.
- Profile edit modal state is local.

**Validation & error handling**
- Invalid passwords and profile data are rejected by backend and displayed in the UI.

**Edge cases**
- Family membership changes can affect what assets the page is allowed to show.

### Feature: Theme and error handling

**What it does**
Keeps the UI visually consistent and prevents the app from crashing on render errors.

**Files involved**
- `wealthmap-frontend/src/providers/ThemeProvider.tsx`
- `wealthmap-frontend/src/components/ErrorBoundary.tsx`
- `wealthmap-frontend/src/index.css`
- `wealthmap-frontend/src/App.css`

**Step-by-step trace**
1. App boots and wraps everything in the theme provider.
2. The root document class is adjusted to light mode.
3. Error boundary catches React render failures.
4. Global CSS defines the visual baseline.

**State management**
- Theme state is currently effectively fixed to light mode.
- Error state is local to the error boundary.

**Validation & error handling**
- Error boundary prevents full app crashes from uncaught render errors.

**Edge cases**
- `ThemeProvider` currently forces light mode and does not behave like a full theme switcher.

## 3. Library & Pattern Justification

- **TanStack Query**
  - Solves caching and refetching of server state.
  - Without it, every page would need custom loading, refresh, and invalidation logic.
  - Alternative: manual `useEffect` + local state. Tradeoff: simpler to start, much harder to keep consistent.

- **Zustand**
  - Solves lightweight global auth state.
  - Without it, login state would be awkward to share between components and route guards.
  - Alternative: React Context. Tradeoff: built in, but often more verbose for auth persistence.

- **Axios interceptor**
  - Solves automatic JWT header attachment.
  - Without it, every API call would repeat header plumbing.
  - Alternative: fetch wrapper per module. Tradeoff: fine, but less centralized.

- **React Router protected routes**
  - Solves route-level access control in the UI.
  - Without it, unauthenticated users could see protected pages before backend rejection.
  - Alternative: conditional rendering only. Tradeoff: less clean navigation separation.

- **Tailwind CSS**
  - Solves fast, consistent styling across many screens and modals.
  - Without it, the dashboard would require a lot more hand-written CSS.
  - Alternative: CSS modules or plain CSS. Tradeoff: more handcrafted but less utility speed.

## 4. Data Flow & State Model

- Local state
  - Form inputs, modal open state, chart toggles, and simulator sliders.
- Global state
  - Auth token and user profile in Zustand.
- Server state
  - Assets, liabilities, snapshots, analytics, family data, planning data, alerts, notifications, and profile data via TanStack Query.

This separation is a good fit for the app because the frontend has a lot of API-backed screens and only a small amount of truly global client state.

## 5. Security & Access Notes

The frontend is not the real security boundary, but it matters for UX and safety:
- Protected routes prevent casual access to private screens.
- JWT is attached automatically by Axios.
- Forms use validation before network requests.
- The backend still enforces actual access control.

Possible gaps:
- The auth token is stored in localStorage, which is common in SPAs but should be defended in interviews as a tradeoff.
- Some visual state, like theme, is not fully implemented as a genuine toggle.

## 6. Likely Interview Questions

- **Why use TanStack Query here?**
  - Because the app is heavily API-driven and needs caching, refetching, and invalidation.

- **Why keep auth in Zustand instead of React Context?**
  - Because auth is global, persistent, and simple enough to fit well in a small store.

- **Why attach the JWT in an Axios interceptor?**
  - Because it avoids duplicating header logic across every API module.

- **Why is the dashboard doing some calculations client-side too?**
  - Because some projections are UX-oriented and can be computed instantly in the browser.
