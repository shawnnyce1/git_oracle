# GoldSight - Gold Price Analysis & Prediction Platform

## Overview

GoldSight is a full-stack financial analytics application for tracking, analyzing, and predicting gold (XAU/USD) prices. It ingests historical gold price data (from CSV and the Polygon API), stores it in PostgreSQL, runs technical analysis to generate BUY/SELL/HOLD trading signals, and provides backtesting capabilities. The frontend is a dark-themed financial dashboard built with React, featuring interactive charts, data tables, and prediction cards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Monorepo Structure
The project uses a three-folder monorepo layout:
- **`client/`** — React SPA (Single Page Application)
- **`server/`** — Express.js API server
- **`shared/`** — Shared types, schemas, and route definitions used by both client and server

### Frontend Architecture
- **Framework:** React with TypeScript, bundled by Vite
- **Routing:** Wouter (lightweight client-side router) with three pages: Dashboard (`/`), Analysis (`/analysis`), Data View (`/data`)
- **State Management:** TanStack React Query for server state (fetching, caching, mutations)
- **UI Components:** shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Charts:** Recharts for interactive financial area charts with time-range filtering (1M, 3M, 6M, 1Y, ALL)
- **Animations:** Framer Motion for page transitions and card animations
- **Styling:** Tailwind CSS with CSS variables for a dark financial theme (gold primary color `#FFD700`, dark navy background). Custom fonts: Cinzel (display), Manrope (body), JetBrains Mono (monospace)
- **Path aliases:** `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime:** Node.js with Express.js
- **Language:** TypeScript, executed via `tsx` in development
- **API Pattern:** RESTful JSON API under `/api/*` prefix
- **Key Endpoints:**
  - `GET /api/gold` — List all gold prices
  - `POST /api/gold/update` — Seed from CSV or fetch new data from Polygon API
  - `GET /api/predictions` — List trading predictions
  - `POST /api/predictions/generate` — Generate new trading signals
  - Backtest endpoints also defined in schema
- **Route Contracts:** Shared route definitions in `shared/routes.ts` with Zod schemas for request/response validation, used by both client hooks and server handlers
- **Development:** Vite dev server runs as middleware on the Express server with HMR support
- **Production:** Client is built with Vite to `dist/public`, server is bundled with esbuild to `dist/index.cjs`

### Data Storage
- **Database:** PostgreSQL via `DATABASE_URL` environment variable
- **ORM:** Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema (3 tables):**
  - `gold_prices` — Daily OHLCV data with unique date constraint (id, date, open, high, low, close, volume, created_at)
  - `predictions` — Trading signals (id, date, signal [BUY/SELL/HOLD], confidence, reason, created_at)
  - `backtests` — Strategy backtest results (id, name, start_date, end_date, total_return, win_rate, trades_count, config JSON, created_at)
- **Migrations:** Use `drizzle-kit push` (`npm run db:push`) to sync schema to database
- **Storage Layer:** `DatabaseStorage` class in `server/storage.ts` implements `IStorage` interface, providing clean abstraction over database operations with bulk insert support and conflict handling

### Data Ingestion Strategy
1. **Initial Seed:** On first `POST /api/gold/update`, reads from a bundled CSV file (`attached_assets/gold_2004_to_now_GC_F_*.csv`) containing historical data from 2004
2. **Incremental Updates:** After seeding, fetches only missing days from the Polygon.io API using the `C:XAUUSD` ticker
3. **Deduplication:** Uses `onConflictDoNothing()` on the unique date column to prevent duplicates

### Build System
- **Dev:** `npm run dev` — runs tsx with Vite middleware for HMR
- **Build:** `npm run build` — Vite builds client, esbuild bundles server. Dependencies are selectively bundled vs externalized via an allowlist in `script/build.ts`
- **Start:** `npm start` — runs the production bundle from `dist/index.cjs`
- **Type Check:** `npm run check` — TypeScript check without emit

## External Dependencies

### Database
- **PostgreSQL** — Required. Connection via `DATABASE_URL` environment variable. Sessions use `connect-pg-simple`.

### APIs
- **Polygon.io REST API** — Used to fetch daily gold forex data (`C:XAUUSD`). API key is hardcoded in `server/routes.ts` (should be moved to environment variable).

### Key npm Packages
- **Server:** express, drizzle-orm, drizzle-zod, pg, csv-parse, zod, nanoid, connect-pg-simple
- **Client:** react, wouter, @tanstack/react-query, recharts, framer-motion, date-fns, shadcn/ui (Radix UI primitives), tailwindcss, clsx, tailwind-merge
- **Build:** vite, @vitejs/plugin-react, esbuild, tsx, drizzle-kit
- **Replit-specific:** @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer, @replit/vite-plugin-dev-banner