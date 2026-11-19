# PaisaFlow — Personal Finance Manager

**Understand Your Money. Control Your Future.**

PaisaFlow is a full-stack personal finance management web application tailored for Indian personal finance workflows (`INR ₹`, `en-IN` number formatting, `DD MMM YYYY` dates, `Asia/Kolkata` timezone) with warm light and deep pine dark themes.

## Key Features

- **Financial Overview Dashboard**: Live KPIs (Total Balance, Income, Expenses, Net Savings, Savings Rate, Budget Utilization), interactive charts, and date-range filters.
- **Transactions Ledger**: Income, expense, and account-to-account transfers (excluded from income/expense totals), search, multi-filter, sort, pagination, and CSV export.
- **Multi-Account Management**: Bank accounts, UPI, cash, savings accounts, credit cards, and digital wallets with real-time recalculated balances and per-account history.
- **Budgets & Categories**: Overall monthly and category-specific budgets with overspending warnings, utilization charts, and customizable icons/colors.
- **Savings Goals**: Target tracking with progress percentages, manual contributions, and withdrawals.
- **Recurring Payments**: Daily, weekly, monthly, and yearly bills/income with duplicate-occurrence protection.
- **Analytics & Reports**: 6/12-month cashflow trends, category breakdowns, cumulative savings growth, CSV export, and printable PDF financial reports.
- **AI Financial Assistant**: Server-side Gemini integration grounded strictly in the user's recorded PaisaFlow ledger.
- **Auth & Isolated Demo Mode**: Local user accounts and a resettable sample workspace kept completely separate.

## Getting Started

1. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (required for the AI Financial Assistant).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the full-stack development server on port `3000`:
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts Express API + Vite dev middleware on `http://localhost:3000` |
| `npm run build` | Builds Vite client bundle (`dist/`) and bundles `server.ts` (`server.js`) |
| `npm run start` | Runs the production Node.js server (`server.js`) |
| `npm run lint` | Runs TypeScript type-checking (`tsc --noEmit`) |
| `npx tsx --test src/utils/financeMath.test.ts src/domain/financeReducer.test.ts` | Executes pure domain & math unit tests |

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full folder layout, pure domain reducer design, versioned API specification (`/api/v1/*`), environment configuration, and error handling strategy.
