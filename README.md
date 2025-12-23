⚖️ CyberCrime Legal Assistant (RAG System)

A Retrieval-Augmented Generation (RAG) based legal assistant that provides grounded cybercrime-related legal guidance using real case data, vector search, and a Large Language Model (LLM).

The system retrieves relevant cybercrime cases from a vector database and generates clean, explainable legal responses with citations.

Note: The dataset used in this project is compiled from publicly available cybercrime case summaries for academic purposes.




🚀 Features

📚 Vector Search (ChromaDB) for cybercrime cases

🧠 LLM-powered legal reasoning using Groq (LLaMA 3.1)

🔍 Context-aware answers grounded in real data

🧾 Transparent citations (case-based evidence)

🖥️ Streamlit-based UI

🧩 Clean modular architecture (ingestion, retrieval, generation, UI)




🏗️ System Architecture

User Query

        ↓

Streamlit UI (app.py)

        ↓

RAG Pipeline (rag_pipeline.py)

        ↓

Vector Search (ChromaDB)

        ↓
   
Top-K Relevant Cases

        ↓

Groq LLM (LLaMA 3.1)

        ↓

Generated Legal Answer + Citations



LEGALCHATBOT/


├── ingest.py              (Data ingestion into ChromaDB)

├── query.py               (Retrieval-only CLI testing)

├── llm.py                 (Groq LLM integration)

├── rag_pipeline.py        (Retrieval + Generation logic)

├── app.py                 (Streamlit UI)

├── data/

      └── cases.json         (Cybercrime case dataset)


├── cyber_crime_db/        (Persistent ChromaDB storage)

├── .venv/                 (Virtual environment)

└── README.md



⚙️ Tech Stack

Python 3.11

ChromaDB – Vector database

Groq API – Ultra-fast LLM inference

LLaMA 3.1 – Large Language Model

Streamlit – Web UI

SentenceTransformers / Default Embeddings


📈Future Improvements

🔐 Authentication & user sessions

🌐 REST API (FastAPI)

📊 Confidence scoring

🧠 Conversation memory

🚀 Cloud deployment
