# React + TypeScript + Vite

This folder contains the WealthMap frontend, a React/Vite single-page app for authentication, dashboards, assets, liabilities, planning, family views, and profile management.

Currently, the frontend uses these core libraries:

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Zustand
- Axios
- React Hook Form
- Zod
- Recharts
- Tailwind CSS
- Lucide React

## What it includes

- Login and register pages
- Forgot-password and reset-password modals
- Protected application shell with sidebar, topbar, and mobile nav
- Dashboard with assets, liabilities, snapshots, analytics, alerts, notifications, and rebalancing views
- Asset forms for stocks, mutual funds, gold, fixed deposits, real estate, and crypto
- Liability forms for multiple debt types
- Planning pages for goals, emergency fund, SIPs, retirement, and maturities
- Family rollup and profile screens

## Routing

- `/login`
- `/register`
- `/`
- `/assets`
- `/liabilities`
- `/goals`
- `/family`
- `/maturities`
- `/profile`

## Data flow

- `src/api/axios.ts` attaches the JWT from `localStorage` on every request
- `src/store/authStore.ts` persists auth state in `localStorage`
- `src/App.tsx` wraps the app in `ThemeProvider`, `QueryClientProvider`, and `ErrorBoundary`
- Pages and forms use TanStack Query for server state and invalidation

## Environment

- `VITE_API_URL` overrides the backend base URL
- If unset, the app defaults to `http://localhost:8080/api`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run preview`

## Notes

- The theme provider currently forces light mode in the document root.
- Form validation is handled with React Hook Form plus Zod.
