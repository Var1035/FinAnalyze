# FinAnalyze  
**A Financial Data Analysis & Insight Platform**

---

## Overview

**FinAnalyze** is a structured financial data analysis platform designed to process, validate, and analyze banking transaction data. The system converts raw CSV-based financial records into organized, queryable, and analyzable datasets, enabling downstream insights, reporting, and visualization.

The project follows a **modular architecture**, separating frontend presentation, backend processing, and database management to ensure scalability, maintainability, and clarity.

---

## Objectives

- Standardize and validate raw bank transaction data  
- Enable structured storage and retrieval of financial records  
- Support API-based data processing and testing  
- Provide a modern frontend foundation for analytics dashboards  

---

## Key Capabilities

- CSV-based bank transaction ingestion  
- Backend validation and transformation of financial data  
- API-driven data flow and testing support  
- Database schema management using Supabase  
- Frontend-ready architecture for analytics visualization  

---

## Technology Stack

### Frontend
- **React** with **TypeScript** – Component-based UI development  
- **Vite** – Fast build and development tooling  
- **Tailwind CSS** – Utility-first styling framework  
- **ESLint** – Code quality and linting  

### Backend
- **Python** – Data parsing, validation, and API logic  
- **Automated Test Scripts** – API and database verification  

### Database & Tooling
- **Supabase** – Database, authentication, and schema management  
- **Mockoon** – API mocking and testing  
- **Bolt** – Automation and configuration support  

---

## Project Structure


FinAnalyze/
│
├── backend/ # Python backend logic and API handling
├── src/ # Frontend source code (React + TypeScript)
├── supabase/ # Supabase configuration and migrations
├── mockoon/ # API mock definitions
├── .bolt/ # Automation and tooling configs
│
├── test_api.py # API test cases
├── test_db.py # Database test cases
├── test_bank.csv # Sample bank transaction data
├── test_upload.csv # Sample upload dataset
├── api_response.json # Sample API response output
│
├── index.html # Frontend entry point
├── package.json # Frontend dependencies
├── vite.config.ts # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
├── tsconfig.json # TypeScript configuration
└── README.md # Project documentation


---

## System Workflow

1. User uploads a CSV file containing bank transactions  
2. Backend services validate and normalize transaction data  
3. Cleaned data is stored in Supabase  
4. APIs expose structured financial records  
5. Frontend consumes APIs for analytics and visualization  

---

## Setup Instructions

### Clone the Repository
```bash
git clone https://github.com/Var1035/FinAnalyze.git
cd FinAnalyze
Frontend Setup
npm install
npm run dev
Backend Setup
python -m venv .venv
source .venv/bin/activate   # Linux / macOS
.venv\Scripts\activate      # Windows

pip install -r backend/requirements.txt
Database Migration
python run_migration.py
Run Tests
python test_api.py
python test_db.py
Future Enhancements

Intelligent transaction categorization using Machine Learning

Financial trend analysis and forecasting

Exportable reports (PDF / Excel)

User-level dashboards and budgeting insights

Contribution Guidelines

Contributions are welcome. Please ensure all changes follow the existing code structure and include appropriate test coverage.

License

License information has not been defined yet. Consider adding a license file to clarify usage and distribution terms.
