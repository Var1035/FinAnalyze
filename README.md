# FinAnalyze – Financial Health Assessment Platform

FinAnalyze is a **financial data analytics** platform designed to transform raw banking statements into structured, insightful, and action‑oriented views of an individual's financial health.[page:1] The system focuses on scalable ingestion, robust data validation, and clear visualization of income, expenses, and savings trends over time.[page:1]

---

## Key Features

- Secure ingestion of bank transaction data from CSV files with validation of schema and format.[page:1]  
- Automated cleaning, normalization, and categorization of financial transactions.[page:1]  
- Rule‑driven and programmatic logic for matching and classifying transaction types.[page:1]  
- Dashboard experience for exploring spending patterns, income flows, and savings behavior.[page:1]  
- Supabase‑backed data storage for persistent and queryable financial records.[page:1]  
- Comprehensive test utilities for API endpoints, database operations, and parsing logic.[page:1]  

---

## Tech Stack

**Frontend**  
- TypeScript with a modern React + Vite setup for building the user interface (`src`, `vite.config.ts`).[page:1]  
- Tailwind CSS for utility‑first styling and consistent design (`tailwind.config.js`, `postcss.config.js`).[page:1]  

**Backend**  
- Python for data processing, validation, and API integrations (`backend`, multiple `test_*.py` utilities).[page:1]  

**Data & Infrastructure**  
- Supabase as the primary database and platform for persistence and schema management (`supabase` directory).[page:1]  
- Mockoon configuration for mocking APIs during local development and testing (`mockoon`).[page:1]  

**Tooling & Quality**  
- ESLint and TypeScript configuration for code quality and type safety (`eslint.config.js`, `tsconfig*.json`).[page:1]  
- Vite for fast local development and optimized production builds.[page:1]  

---

## High‑Level Workflow

1. **Data Ingestion**  
   - Users upload CSV files containing bank transactions (e.g., `test_bank.csv`, `test_upload.csv`).[page:1]  
   - Columns and formats are validated using dedicated test scripts (`test_columns.py`, `test_parsing.py`).[page:1]  

2. **Processing & Classification**  
   - Python utilities clean and normalize raw records, then categorize transactions (e.g., income, expense types) using matching logic (`test_match.py`, `inspect_*.py`).[page:1]  

3. **Storage & Access**  
   - Processed records are stored in Supabase, with migrations and insert operations orchestrated via scripts such as `run_migration.py`, `test_db*.py`.[page:1]  

4. **API & Debugging**  
   - API endpoints are exercised and validated with scripts like `test_api.py`, `test_api_upload.py`, and `test_api_debug.py`, supported by example artifacts such as `api_response.json` and `error.txt`.[page:1]  

5. **Visualization**  
   - The frontend dashboard (e.g., `Dashboard.tsx`) consumes processed data and presents intuitive summaries and visual insights for end users.[page:1]  

---

## Project Structure
```
FinAnalyze/
├─ .bolt/                 # Automation and configuration assets[1]
├─ backend/               # Python backend logic and processing scripts[1]
├─ mockoon/               # Mockoon API configuration for local testing[1]
├─ src/                   # Frontend (TypeScript/React components, views, dashboard)[1]
├─ supabase/              # Supabase configuration, migrations, and schema files[1]
├─ api_response.json      # Example API response payload for debugging[1]
├─ error.txt              # Captured error output for troubleshooting[1]
├─ index.html             # Frontend entry HTML file[1]
├─ package.json           # Frontend dependencies and npm scripts[1]
├─ postcss.config.js      # PostCSS configuration for Tailwind/CSS pipeline[1]
├─ tailwind.config.js     # Tailwind CSS configuration[1]
├─ test_api.py            # API endpoint test script[1]
├─ test_api_debug.py      # API debugging and logging helper[1]
├─ test_api_upload.py     # API upload flow test script[1]
├─ test_bank.csv          # Sample bank CSV for ingestion tests[1]
├─ test_columns.py        # CSV column validation script[1]
├─ test_db.py             # Database connectivity and basic operations test[1]
├─ test_db_insert.py      # Database insert operation validation[1]
├─ test_db_insert2.py     # Additional insert and edge‑case tests[1]
├─ test_db_user_id.py     # User ID and mapping‑related tests[1]
├─ test_match.py          # Transaction matching and classification tests[1]
├─ test_parsing.py        # CSV parsing and normalization tests[1]
├─ test_upload.csv        # Sample upload file for API tests[1]
├─ tsconfig.app.json      # TypeScript configuration for application code[1]
├─ tsconfig.json          # Root TypeScript configuration[1]
├─ tsconfig.node.json     # TypeScript configuration for Node‑related tooling[1]
├─ vite.config.ts         # Vite configuration for build and dev server[1]
└─ eslint.config.js       # ESLint configuration for linting rules[1]
