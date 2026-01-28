from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Union, Optional
import tempfile
import os
from pathlib import Path

# Load environment variables from .env file
from dotenv import load_dotenv
PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

from app.rag.glue import answer_question
from app.rag.voice_utils import process_voice_query, translate_from_english, LANGUAGE_CODES

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
    language: str = "english"  # Supported: english, hindi, kannada, tamil


class Source(BaseModel):
    title: str
    year: Union[int, str]
    summary: str
    full_text: str


class AskResponse(BaseModel):
    answer: str
    sources: List[Source]


class VoiceResponse(BaseModel):
    query_text_native: str
    response_text_native: str
    audio_base64: str
    sources: Optional[List[Source]] = []


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

        # Translate response to user's selected language if not English
        target_lang = payload.language.lower()
        if target_lang != "english" and target_lang in LANGUAGE_CODES:
            lang_code = LANGUAGE_CODES[target_lang]["translator"]
            answer = translate_from_english(answer, lang_code)
            print(f"🔄 Translated response to {target_lang}")

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


@app.post("/process-audio", response_model=VoiceResponse)
async def process_audio(
    file: UploadFile = File(...),
    target_lang: str = Form(default="english")
):
    """
    Process voice query through the RAG pipeline.
    
    - Accepts audio file (webm, wav, mp3, etc.)
    - Transcribes using Whisper
    - Translates to English (if needed)
    - Queries the RAG system
    - Translates response back to native language
    - Returns text + audio (base64 MP3)
    
    Supported languages: english, hindi, kannada, tamil
    """
    # Validate language
    valid_languages = ["english", "hindi", "kannada", "tamil"]
    if target_lang.lower() not in valid_languages:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid language. Supported: {', '.join(valid_languages)}"
        )
    
    # Save uploaded file temporarily
    temp_file = None
    try:
        # Create temp file with appropriate extension
        suffix = os.path.splitext(file.filename)[1] if file.filename else ".webm"
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        
        # Write uploaded content
        content = await file.read()
        temp_file.write(content)
        temp_file.close()
        
        # Process through voice pipeline
        result = process_voice_query(
            audio_file_path=temp_file.name,
            target_language=target_lang.lower(),
            rag_function=answer_question
        )
        
        return VoiceResponse(
            query_text_native=result["query_text_native"],
            response_text_native=result["response_text_native"],
            audio_base64=result["audio_base64"],
            sources=result.get("sources", [])
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Voice processing error: {str(e)}"
        )
    
    finally:
        # Cleanup temp file
        if temp_file and os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

