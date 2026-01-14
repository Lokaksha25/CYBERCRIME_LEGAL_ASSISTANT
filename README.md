# ⚖️ CyberCrime Legal Assistant

<div align="center">



**An AI-powered legal assistant providing grounded cybercrime guidance using RAG technology**


</div>

---

## 📋 Table of Contents

- Overview
- Features
- System Architecture
- Tech Stack
- Getting Started
  - Prerequisites
  - Installation
  - Configuration
- Usage
- Project Structure
- API Reference
- Dataset
- Acknowledgments

---

## 🎯 Overview

CyberCrime Legal Assistant is a **Retrieval-Augmented Generation (RAG)** system that provides accurate, grounded legal guidance on cybercrime cases. Unlike traditional chatbots, this system retrieves relevant case law from a vector database and generates responses backed by real legal precedents.

### Why RAG?

- **Grounded Responses**: Answers are based on actual case data, not hallucinations
- **Transparent Citations**: Every response includes source case references
- **Up-to-date Information**: Easy to update the knowledge base with new cases
- **Domain-Specific Accuracy**: Specialized for cybercrime legal queries

> **Note**: This system is for educational and informational purposes only. Always consult a qualified legal professional for official legal advice.

---

## ✨ Features

### Core Capabilities

- 🔍 **Semantic Search**: ChromaDB-powered vector search for finding relevant cases
- 🧠 **LLM Reasoning**: Groq (LLaMA 3.1) for natural language generation
- 📚 **Case Citations**: Transparent source attribution with case references
- ⚡ **Fast Inference**: Groq's infrastructure ensures sub-second response times
- 🎨 **Modern UI**: React-based chat interface with dark mode support

### User Experience

- 💬 Real-time chat interface
- 📝 Context-aware responses
- 🌓 Dark/Light mode toggle
- 📱 Responsive design
- 💾 Chat history persistence

---

## 🏗️ System Architecture

```
┌─────────────────┐
│   User Query    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React Frontend │
│   (Chat UI)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FastAPI/Flask  │
│   Backend API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  RAG Pipeline   │
│  rag_pipeline.py│
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────┐
│ChromaDB│ │ Groq │
│Vector  │ │ LLM  │
│  DB    │ │      │
└────────┘ └──────┘
    │         │
    └────┬────┘
         ▼
  ┌──────────────┐
  │   Response   │
  │ + Citations  │
  └──────────────┘
```

### Pipeline Flow

1. **User Input**: Query submitted via React chat interface
2. **Embedding**: Query converted to vector embedding
3. **Retrieval**: ChromaDB finds top-K most relevant cases
4. **Context Formation**: Retrieved cases formatted as context
5. **Generation**: Groq LLM generates response with citations
6. **Display**: Answer shown in UI with source references

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11+** - Core language
- **ChromaDB** - Vector database for semantic search
- **Groq API** - Ultra-fast LLM inference
- **LLaMA 3.1** - Large language model
- **FastAPI/Flask** - REST API framework
- **SentenceTransformers** - Text embeddings

### Frontend
- **React 18+** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11 or higher
- Node.js 18+ and npm
- Git
- Groq API key ([Get one here](https://console.groq.com))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/legalchatbot.git
cd legalchatbot
```

#### 2. Backend Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment on Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 3. Frontend Setup

```bash
cd frontend
npm install
```

#### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
GROQ_API_KEY=your_groq_api_key_here
CHROMA_DB_PATH=./cyber_crime_db
MODEL_NAME=llama-3.1-70b-versatile
```

#### 5. Data Ingestion

```bash
# Run from project root
python backend/app/rag/ingest.py
```

This will:
- Load cases from `data/cases.json`
- Generate embeddings
- Store vectors in ChromaDB

---

## 💻 Usage

### Development Mode

**Terminal 1 - Backend:**
```bash
# Activate virtual environment
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Run backend (from root)
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build

```bash
# Frontend
cd frontend
npm run build

# Serve with backend
cd ../backend
python main.py --production
```

### CLI Testing

Test retrieval only:
```bash
python backend/app/rag/query.py "What are the penalties for UPI fraud?"
```

Test full RAG pipeline:
```bash
python backend/app/rag/rag_pipeline.py "Someone hacked my Instagram account"
```

---

## 📁 Project Structure

```
LEGALCHATBOT/
│
├── backend/
│   ├── app/
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   ├── glue.py              # ChromaDB connection
│   │   │   ├── ingest.py            # Data ingestion pipeline
│   │   │   ├── llm.py               # Groq LLM integration
│   │   │   ├── query.py             # Retrieval module
│   │   │   └── rag_pipeline.py      # Main RAG logic
│   │   ├── __init__.py
│   │   └── main.py                  # FastAPI/Flask app
│   ├── cyber_crime_db/              # ChromaDB storage
│   └── chroma_db/
│
├── data/
│   └── cases.json                   # Cybercrime case dataset
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── Client.js            # API client
│   │   ├── components/
│   │   │   └── Message.jsx          # Chat message component
│   │   ├── pages/
│   │   │   └── Chat.jsx             # Main chat page
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .env                             # Environment variables
├── .gitignore
├── requirements.txt                 # Python dependencies
└── README.md
```

---

## 🔌 API Reference

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### POST `/ask`
Get legal guidance on a cybercrime query.

**Request:**
```json
{
  "question": "I lost money in a UPI fraud. What should I do?",
  "top_k": 5
}
```

**Response:**
```json
{
  "answer": "Based on relevant case law, you should immediately...",
  "sources": [
    "IPC Section 420 - Cheating and Dishonesty",
    "IT Act 2000 Section 66D - Punishment for cheating by personation"
  ],
  "context_used": 5
}
```

#### GET `/health`
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "model": "llama-3.1-70b-versatile"
}
```

---

## 📊 Dataset

The system uses a curated dataset of cybercrime cases stored in `data/cases.json`.

### Schema

```json
{
  "case_id": "CC001",
  "title": "UPI Fraud Case",
  "category": "financial_fraud",
  "description": "Victim lost ₹50,000 through unauthorized UPI transaction...",
  "relevant_laws": ["IPC 420", "IT Act 66D"],
  "verdict": "Guilty - 2 years imprisonment + ₹1,00,000 fine",
  "precedent": "Similar cases should report to cybercrime cell within 24 hours"
}
```

### Data Sources

> **Important**: The dataset is compiled from publicly available cybercrime case summaries for educational and research purposes only.


### Coding Standards

- Follow PEP 8 for Python code
- Use ESLint/Prettier for JavaScript
- Write meaningful commit messages
- Add tests for new features
- Update documentation


##  Acknowledgments

- **ChromaDB Team** - For the excellent vector database
- **Groq** - For providing fast LLM inference
- **Meta AI** - For the LLaMA model
- **Indian Legal Community** - For publicly available case data


<div align="center">

**[⬆ Back to Top](#-cybercrime-legal-assistant)**

Made with ❤️ for legal tech innovation

</div>