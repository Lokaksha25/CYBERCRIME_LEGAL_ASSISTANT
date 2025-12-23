import os
import re
from groq import Groq


# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def clean_title(title: str) -> str:
    if not title:
        return "Related Case"
    # Remove "Incident 42", "Case 12", etc.
    title = re.sub(r"(incident|case)\s*\d+\s*-?\s*", "", title, flags=re.IGNORECASE)
    return title.strip()

def summarize_document(doc: str, max_chars: int = 450) -> str:
    if len(doc) <= max_chars:
        return doc.strip()

    cut = doc[:max_chars]
    last_period = cut.rfind(".")
    return cut[: last_period + 1] if last_period != -1 else cut + "..."


def clean_document_text(doc: str) -> str:
    if not doc:
        return ""

    # Remove leading "Incident: XYZ Incident 42 - City"
    doc = re.sub(
        r"Incident:\s*.*?(?:\n|$)",
        "",
        doc,
        flags=re.IGNORECASE
    )

    # Remove repeated "Category:" line if present
    doc = re.sub(
        r"Category:\s*.*?(?:\n|$)",
        "",
        doc,
        flags=re.IGNORECASE
    )

    return doc.strip()


def generate_answer(question, retrieved_docs):
    if not client:
        return "⚠️ GROQ_API_KEY not set.", []

    context = ""
    case_summaries = []

    for i, item in enumerate(retrieved_docs, 1):
        meta = item["metadata"]
        raw_doc = item["document"]
        clean_doc = clean_document_text(raw_doc)

        title = clean_title(meta.get("title", "Related Case"))

        case_summaries.append({
            "title": title,
            "year": meta.get("year", "N/A"),
            "summary": summarize_document(clean_doc),
            "full_text": clean_doc
        })

        context += f"""
Title: {title}
Laws Involved: {meta.get('laws', 'N/A')}
Description:
{clean_doc}
"""


    system_prompt = """
You are an expert Cybercrime Legal Assistant for India.
Answer the user's question using the provided cases.
Do NOT mention case numbers or references like [1], [2].
Provide clear legal guidance and steps.
If information is insufficient, say so.
"""

    user_prompt = f"""
Question:
{question}

Cases:
{context}

Answer:
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        max_tokens=700,
    )


    answer_text = response.choices[0].message.content
    return answer_text, case_summaries


