# AlfaCareers — The Hidden Job Market Engine

AlfaCareers is an AI-powered job discovery and autonomous career co-pilot platform designed to surface un-syndicated roles directly from corporate career pages and connect candidates to real opportunities before they hit mainstream job boards.

---

## 🏗️ Architecture Overview

The repository is structured as a modular monorepo:

* **`apps/web`**: Next.js App Router (Candidate, Employer, Super Admin Portals) with Tailwind CSS design system.
* **`services/api`**: FastAPI (Python) asynchronous engine managing Deep Web Hunter scraping, ATS resume compilation, local vector embeddings, and background workflows.
* **Database & Infrastructure**: PostgreSQL (Relational Data), ChromaDB (Vector Search), and self-hosted Ollama (Llama 3.1 LLM).

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Python (3.10+)

### 2. Infrastructure Containers
Start local PostgreSQL, ChromaDB, and Ollama:
```bash
docker-compose up -d
```

### 3. Backend Setup (`services/api`)
```bash
cd services/api
python -m venv .venv
# Activate environment (Windows PowerShell: .venv\Scripts\Activate.ps1)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend Setup (`apps/web`)
```bash
cd apps/web
npm install
npm run dev
```

---

## 📄 License & Blueprint Reference
Built according to the [AlfaCareers Master Blueprint v2.0](AlfaCareers_Master_Blueprint.docx).
