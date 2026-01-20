"""
Voice Processing Utilities for Multilingual RAG

Provides:
- Speech-to-Text using OpenAI Whisper (cached model)
- Text translation using deep_translator
- Text-to-Speech using gTTS with base64 encoding
"""

import os
import io
import base64
import tempfile
from functools import lru_cache
from pathlib import Path

# Add local ffmpeg to PATH for Windows
PROJECT_ROOT = Path(__file__).resolve().parents[3]
FFMPEG_BIN = PROJECT_ROOT / "backend" / "ffmpeg_tool" / "ffmpeg-8.0.1-essentials_build" / "bin"
if FFMPEG_BIN.exists():
    os.environ["PATH"] += os.pathsep + str(FFMPEG_BIN)

import whisper
from deep_translator import GoogleTranslator
from gtts import gTTS


# -----------------------------
# LANGUAGE CODE MAPPINGS
# -----------------------------
LANGUAGE_CODES = {
    "english": {"whisper": "en", "gtts": "en", "translator": "en"},
    "hindi": {"whisper": "hi", "gtts": "hi", "translator": "hi"},
    "kannada": {"whisper": "kn", "gtts": "kn", "translator": "kn"},
    "tamil": {"whisper": "ta", "gtts": "ta", "translator": "ta"},
}


# -----------------------------
# WHISPER MODEL (CACHED)
# -----------------------------
@lru_cache(maxsize=1)
def get_whisper_model():
    """
    Load and cache the Whisper model.
    Using 'base' model for balance of speed and accuracy.
    """
    print("🎙️ Loading Whisper model (base)...")
    model = whisper.load_model("base")
    print("✅ Whisper model loaded and cached!")
    return model


# -----------------------------
# SPEECH-TO-TEXT
# -----------------------------
def transcribe_audio(audio_file_path: str, language: str = None) -> str:
    """
    Transcribe audio file to text using Whisper.
    
    Args:
        audio_file_path: Path to the audio file
        language: Optional language hint (e.g., 'en', 'hi', 'kn', 'ta')
    
    Returns:
        Transcribed text string
    """
    model = get_whisper_model()
    
    # Whisper options
    options = {}
    if language and language in ["en", "hi", "kn", "ta"]:
        options["language"] = language
    
    result = model.transcribe(audio_file_path, **options)
    return result["text"].strip()


# -----------------------------
# TRANSLATION
# -----------------------------
def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """
    Translate text between languages using Google Translator.
    
    Args:
        text: Text to translate
        source_lang: Source language code (e.g., 'en', 'hi', 'kn', 'ta')
        target_lang: Target language code
    
    Returns:
        Translated text string
    """
    if source_lang == target_lang:
        return text
    
    if not text or not text.strip():
        return text
    
    try:
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        return translated if translated else text
    except Exception as e:
        print(f"⚠️ Translation error: {e}")
        return text  # Fallback to original text


def translate_to_english(text: str, source_lang: str) -> str:
    """Convenience function to translate any language to English."""
    return translate_text(text, source_lang, "en")


def translate_from_english(text: str, target_lang: str) -> str:
    """Convenience function to translate English to any language."""
    return translate_text(text, "en", target_lang)


# -----------------------------
# TEXT-TO-SPEECH
# -----------------------------
def text_to_speech_base64(text: str, lang_code: str = "en") -> str:
    """
    Convert text to speech and return as base64 encoded MP3.
    
    Args:
        text: Text to convert to speech
        lang_code: Language code for TTS (e.g., 'en', 'hi', 'kn', 'ta')
    
    Returns:
        Base64 encoded string of MP3 audio
    """
    if not text or not text.strip():
        return ""
    
    try:
        # Generate TTS audio
        tts = gTTS(text=text, lang=lang_code, slow=False)
        
        # Save to bytes buffer
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        # Encode to base64
        audio_base64 = base64.b64encode(audio_buffer.read()).decode("utf-8")
        
        return audio_base64
    
    except Exception as e:
        print(f"⚠️ TTS error: {e}")
        return ""


# -----------------------------
# FULL PIPELINE HELPER
# -----------------------------
def process_voice_query(
    audio_file_path: str,
    target_language: str,
    rag_function
) -> dict:
    """
    Full voice query processing pipeline.
    
    Args:
        audio_file_path: Path to recorded audio file
        target_language: User's selected language ('english', 'hindi', 'kannada', 'tamil')
        rag_function: Function that takes English query and returns (answer, sources)
    
    Returns:
        dict with query_text_native, response_text_native, audio_base64
    """
    # Get language codes
    lang_config = LANGUAGE_CODES.get(target_language.lower(), LANGUAGE_CODES["english"])
    whisper_lang = lang_config["whisper"]
    gtts_lang = lang_config["gtts"]
    translator_lang = lang_config["translator"]
    
    # Step A: Speech-to-Text (Native language)
    native_query = transcribe_audio(audio_file_path, language=whisper_lang)
    print(f"📝 Transcribed ({target_language}): {native_query}")
    
    # Step B: Translate to English (if needed)
    if translator_lang != "en":
        english_query = translate_to_english(native_query, translator_lang)
        print(f"🔄 Translated to English: {english_query}")
    else:
        english_query = native_query
    
    # Step C: RAG Query
    english_response, sources = rag_function(english_query)
    print(f"🤖 RAG Response: {english_response[:100]}...")
    
    # Step D: Translate response back to Native (if needed)
    if translator_lang != "en":
        native_response = translate_from_english(english_response, translator_lang)
        print(f"🔄 Translated to {target_language}: {native_response[:100]}...")
    else:
        native_response = english_response
    
    # Step E: Text-to-Speech
    audio_base64 = text_to_speech_base64(native_response, gtts_lang)
    print(f"🔊 Generated audio ({len(audio_base64)} chars base64)")
    
    return {
        "query_text_native": native_query,
        "response_text_native": native_response,
        "audio_base64": audio_base64,
        "sources": sources  # Include sources for frontend display
    }
