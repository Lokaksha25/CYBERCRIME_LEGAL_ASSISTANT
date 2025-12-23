from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict
from glue_query_to_llm import answer_question

# ---------------- APP INIT ----------------
app = FastAPI(
    title="CyberCrime Legal Assistant API",
    description="RAG-based Cybercrime Legal Assistant using ChromaDB + Groq",
    version="1.0.0"
)

# ---------------- REQUEST SCHEMA ----------------
class QueryRequest(BaseModel):
    query: str
    n_results: int = 3

# ---------------- RESPONSE SCHEMA ----------------
class CaseSummary(BaseModel):
    title: str
    year: int | str
    summary: str
    full_text: str

class QueryResponse(BaseModel):
    answer: str
    case_summaries: List[CaseSummary]

# ---------------- API ENDPOINT ----------------
@app.post("/analyze", response_model=QueryResponse)
def analyze_case(request: QueryRequest):
    answer, case_summaries = answer_question(
        request.query,
        n_results=request.n_results
    )

    return {
        "answer": answer,
        "case_summaries": case_summaries
    }

# ---------------- HEALTH CHECK ----------------
@app.get("/")
def health():
    return {"status": "API running"}
