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


How It Works
Data Ingestion

Users upload bank CSV files (e.g., test_bank.csv, test_upload.csv).[page:1]

Backend scripts parse and validate column structure (test_columns.py, test_parsing.py).[page:1]

Processing & Storage

Python backend cleans, normalizes, and categorizes transactions using multiple utilities (test_match.py, inspect_*.py).[page:1]

Data is stored in a Supabase database using migration and insertion helpers (run_migration.py, test_db*.py).[page:1]

APIs & Testing

API endpoints handle file upload and processing (test_api.py, test_api_upload.py, test_api_debug.py).[page:1]

api_response.json and error.txt help debug and verify responses during development.[page:1]

Dashboard Visualization

The frontend (in src/, including Dashboard.tsx) fetches processed data and renders interactive charts and summaries.[page:1]

Getting Started
Prerequisites
Node.js (for frontend) and npm or yarn.[page:1]

Python 3.x (for backend scripts and APIs).[page:1]

Supabase project or local instance configured to match the schema used here.[page:1]

Installation
bash
# Clone the repository
git clone https://github.com/Var1035/FinAnalyze.git
cd FinAnalyze

# Install frontend dependencies
npm install

# (Optional) Create and activate a Python virtual environment
# python -m venv .venv
# source .venv/bin/activate  # Linux/Mac
# .venv\Scripts\activate     # Windows

# Install Python dependencies
# pip install -r backend/requirements.txt  # if present
Running the Frontend
bash
npm run dev
This starts the Vite dev server and serves the React/TypeScript dashboard.[page:1]

Backend & Database
Run Supabase migrations using run_migration.py and other helper scripts as needed.[page:1]

Use test_db*.py utilities to verify database connectivity and insertion logic.[page:1]

Use test_api*.py scripts to test the upload and processing endpoints locally.[page:1]

Testing
This repository includes multiple test utilities for different parts of the system:[page:1]

test_api.py, test_api_upload.py, test_api_debug.py – API endpoint tests.[page:1]

test_db.py, test_db_insert*.py, test_db_user_id.py – Database and insertion tests.[page:1]

test_parsing.py, test_match.py, test_columns.py – CSV parsing, matching, and schema validation.[page:1]

Run tests individually with:

bash
python test_api.py
python test_db.py
# ...and so on
Future Enhancements
Advanced categorization using ML/LLM-based classification of transactions.

User-specific budgeting recommendations and alerts.

More visual insights and export options (PDF/Excel reports).

