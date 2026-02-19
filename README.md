# FinAnalyze – Financial Health Assessment Tool

FinAnalyze is a **personal finance analytics** tool that ingests raw banking data and transforms it into clear, actionable insights about a user's financial health.[page:1] It focuses on categorization, trend analysis, and intuitive dashboards to help users understand income, expenses, and savings behavior over time.[page:1]

---

## Features

- Upload bank transaction data (CSV) for automated processing and analysis.[page:1]  
- Clean and normalize raw statements using a robust Python backend pipeline.[page:1]  
- Categorize transactions (income, expenses, savings, etc.) with rule-based and programmatic matching.[page:1]  
- Visual dashboards built in TypeScript to summarize spending patterns and financial health KPIs.[page:1]  
- Supabase-backed storage for structured financial data and user-related information.[page:1]  
- API layer for uploading, testing, and validating transaction data.[page:1]  

---

## Tech Stack

**Frontend**  
- TypeScript (React + Vite-based setup inferred from `vite.config.ts`)[page:1]  
- Tailwind CSS for styling (`tailwind.config.js`, `postcss.config.js`)[page:1]  

**Backend**  
- Python for data processing and API logic (`backend`, various `test_*.py` utilities)[page:1]  

**Database & Infra**  
- Supabase for database and authentication (`supabase` folder, migration scripts)[page:1]  

**Tooling**  
- ESLint for linting (`eslint.config.js`)[page:1]  
- Mockoon for mocking API responses during development (`mockoon`)[page:1]  
- Vite for bundling and dev server (`vite.config.ts`)[page:1]  

---

## Project Structure

```bash
FinAnalyze/
├─ .bolt/                 # Bolt / automation-related config[1]
├─ backend/               # Python backend and API logic[1]
├─ mockoon/               # Mockoon configuration for mock APIs[1]
├─ src/                   # Frontend source (TypeScript, React components, Dashboard)[1]
├─ supabase/              # Supabase migrations and configs[1]
├─ test_*.py              # Backend tests and utilities (API, DB, parsing, matching)[1]
├─ test_bank.csv          # Sample bank CSV for local testing[1]
├─ test_upload.csv        # Sample upload file for API tests[1]
├─ api_response.json      # Example/recorded API response[1]
├─ index.html             # Frontend root HTML[1]
├─ package.json           # Frontend dependencies & scripts[1]
├─ vite.config.ts         # Vite configuration[1]
└─ tsconfig*.json         # TypeScript configuration files[1]
