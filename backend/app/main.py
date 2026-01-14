from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union

from app.rag.glue import answer_question

# ------------------------
# FastAPI App
# ------------------------
app = FastAPI(
    title="Cybercrime RAG API",
    description="Retrieval-Augmented Generation API for Cybercrime Legal Guidance (India)",
    version="1.0.0",
)

# ------------------------
# CORS (required for React)
# ------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # later restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------
# Request / Response Models
# ------------------------
class AskRequest(BaseModel):
    question: str
    top_k: int = 5


class Source(BaseModel):
    title: str
    year: Union[int, str]
    summary: str
    full_text: str


class AskResponse(BaseModel):
    answer: str
    sources: List[Source]


# ------------------------
# Routes
# ------------------------
@app.get("/")
def health_check():
    return {"status": "ok", "message": "Cybercrime RAG API is running"}


@app.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest):
    try:
        answer, sources = answer_question(
            payload.question,
            payload.top_k
        )

        return {
            "answer": answer,
            "sources": sources,
        }

    except Exception as e:
        # Never crash the server
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
